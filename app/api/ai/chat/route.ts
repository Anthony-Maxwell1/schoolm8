import { DEFAULT_SKILLS } from "@/lib/ai/default-skills";
import {
    convertToModelMessages,
    createUIMessageStreamResponse,
    streamText,
    stepCountIs,
    consumeStream,
    toUIMessageStream,
    UIMessage,
} from "ai";
import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";
import { AIInstructions } from "@/lib/ai/ai";
import { tools } from "@/lib/ai/tools";
import { chatId as validateChatId, generateChatTitle, persistChat, serializableTools } from "@/lib/ai/chat-backend";

export const maxDuration = 60;

const DEFAULT_PROFILES = [
    {
        id: "default-study",
        name: "Study",
        context: "Prepare the user for exams and in-class assessments.",
    },
    {
        id: "default-project",
        name: "Project",
        context: "Help with projects and hand-in assessments within the permitted requirements.",
    },
    {
        id: "default-customization",
        name: "Customization",
        context: "Help modify the site, themes, and personal experience.",
    },
    {
        id: "default-resources",
        name: "Resources",
        context: "Create study materials and organise classes, tasks, and schedules.",
    },
];

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const {
            messages,
            profileId,
            skillId,
            agentId,
            chatId,
            timeZone,
        }: { messages: UIMessage[]; profileId?: string; skillId?: string; agentId?: string; chatId?: string; timeZone?: string } =
            await req.json();
        const id = validateChatId(chatId);
        if (!Array.isArray(messages) || messages.length === 0) return Response.json({ error: "messages must be a nonempty UIMessage array" }, { status: 400 });
        let localTime = new Date().toISOString();
        if (typeof timeZone === "string") {
            try { localTime = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "long", timeZone }).format(new Date()) + ` (${timeZone})`; } catch { /* Invalid client timezone: use authoritative UTC. */ }
        }
        const agent = agentId ? await schema.ai.getAgent(userId, agentId) : null;
        if (agentId && !agent) return Response.json({ error: "Agent not found" }, { status: 404 });
        const config = await schema.ai.getConfig(userId);
        if (!config?.apiKey) {
            return Response.json(
                { error: "Add an AI API key in Settings first." },
                { status: 400 },
            );
        }

        const [profiles, skills] = await Promise.all([
            schema.ai.getProfiles(userId),
            schema.ai.getSkills(userId),
        ]);
        const profileEntries = [
            ...DEFAULT_PROFILES,
            ...(Array.isArray(profiles)
                ? profiles
                : Object.entries(profiles ?? {}).map(([id, profile]) => ({ ...profile, id }))),
        ] as Array<Record<string, unknown>>;
        const skillEntries = (
            Array.isArray(skills) ? skills : Object.values(skills ?? {})
        ) as Array<Record<string, unknown>>;
        skillEntries.unshift(...DEFAULT_SKILLS);
        const selectedProfile = profileId
            ? profileEntries.find(
                  (profile) => profile.id === profileId || profile.name === profileId,
              )
            : undefined;
        const selectedSkill = skillId
            ? skillEntries.find((skill) => skill.id === skillId || skill.name === skillId)
            : undefined;
        const activeProfiles = profileEntries.filter((profile) =>
            agent
                ? (agent.profileIds ?? []).includes(profile.id)
                : profile.enabled !== false && (!selectedProfile || profile === selectedProfile),
        );
        const mandatoryIds = new Set(
            (agent || selectedProfile ? activeProfiles : []).flatMap((profile) =>
                Array.isArray(profile.requiredSkillIds)
                    ? (profile.requiredSkillIds as string[])
                    : [],
            ),
        );
        const context = [
            ...activeProfiles.map(
                (profile) =>
                    `Profile (${String(profile.name)}): ${String(profile.context)}. When using this profile, these skill IDs are mandatory: ${Array.isArray(profile.requiredSkillIds) ? profile.requiredSkillIds.join(", ") : "none"}.`,
            ),
            ...skillEntries.map(
                (skill) =>
                    `Skill (${String(skill.name)}, id: ${String(skill.id)})${mandatoryIds.has(String(skill.id)) ? " [MANDATORY: follow this skill for this profile]" : ""}: ${String(skill.instructions)}`,
            ),
            selectedSkill
                ? `The user explicitly requested skill: ${String(selectedSkill.name)}.`
                : "",
            agent ? `System agent (${String(agent.name)}): ${String(agent.instructions)}` : "",
        ].join("\n");
        const system = `${AIInstructions}\nCurrent server-verified time: ${localTime}. For date-sensitive tools, supply explicit dates in the user timezone; do not rely on a tool default of today (which may use UTC).\n\n${selectedProfile ? "Follow the selected conversation profile." : "Choose the most appropriate profile below for the user's request; do not apply unrelated profiles. Explain your approach when helpful."}\n\nUser context:\n${context}`;
        const provider = config.provider ?? "gemini";
        const model = (
            provider === "gemini"
                ? createGoogle({ apiKey: config.apiKey })(config.model ?? "gemini-2.5-flash")
                : provider === "claude"
                  ? createAnthropic({ apiKey: config.apiKey })(config.model)
                  : provider === "deepseek"
                    ? createDeepSeek({ apiKey: config.apiKey })(config.model)
                    : createOpenAI({ apiKey: config.apiKey })(config.model)
        ) as LanguageModel;
        const existing = await schema.ai.getChat(userId, id);
        const title = existing?.title && existing.title !== "New chat" ? String(existing.title) : await generateChatTitle(model, messages);
        await persistChat(userId, id, title, messages);
        const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(messages),
            tools: serializableTools(tools(userId)),
            stopWhen: stepCountIs(10),
        });
        return createUIMessageStreamResponse({
            headers: { "x-chat-id": id },
            consumeSseStream: ({ stream }) => consumeStream({ stream }),
            stream: toUIMessageStream({
                stream: result.stream,
                originalMessages: messages,
                onEnd: async ({ messages: completedMessages }) => {
                    await persistChat(userId, id, title, completedMessages);
                },
                onError: (error) => {
                    console.error("AI chat stream failed", error);
                    return error instanceof Error ? error.message : "AI chat failed";
                },
            }),
        });
    } catch (error) {
        return Response.json(
            { error: error instanceof Error ? error.message : "AI request failed" },
            { status: 500 },
        );
    }
}


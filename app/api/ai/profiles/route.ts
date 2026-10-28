import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";
import { DEFAULT_SKILLS } from "@/lib/ai/default-skills";

const DEFAULT_PROFILES = [
    {
        id: "default-study",
        name: "Study",
        context: "Prepare the user for exams and in-class assessments.",
        system: true,
    },
    {
        id: "default-project",
        name: "Project",
        context: "Help with projects and hand-in assessments within the permitted requirements.",
        system: true,
    },
    {
        id: "default-customization",
        name: "Customization",
        context: "Help modify the site, themes, and personal experience.",
        system: true,
    },
    {
        id: "default-resources",
        name: "Resources",
        context: "Create study materials and organise classes, tasks, and schedules.",
        system: true,
    },
];

export async function GET(req: Request) {
    try {
        const profiles = await schema.ai.getProfiles(getUid(req));
        return NextResponse.json({
            profiles: [
                ...DEFAULT_PROFILES.map((profile) => ({ ...profile, requiredSkillIds: [] })),
                ...Object.entries(profiles ?? {})
                    .filter(([id]) => !DEFAULT_PROFILES.some((profile) => profile.id === id))
                    .map(([id, profile]) => ({
                        requiredSkillIds: [],
                        ...profile,
                        id,
                        system: false,
                    })),
            ],
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load profiles" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const context = typeof body.context === "string" ? body.context.trim() : "";
        if (!name || !context) {
            return NextResponse.json({ error: "Name and context are required" }, { status: 400 });
        }
        const id = typeof body.id === "string" && body.id ? body.id : uuidv4();
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
            return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
        }
        if (DEFAULT_PROFILES.some((profile) => profile.id === id)) {
            return NextResponse.json({ error: "Built-in profiles are read-only" }, { status: 403 });
        }
        if (name.length > 100 || context.length > 30000) {
            return NextResponse.json(
                { error: "Name or instructions are too long" },
                { status: 400 },
            );
        }
        if (
            body.requiredSkillIds !== undefined &&
            (!Array.isArray(body.requiredSkillIds) ||
                body.requiredSkillIds.some((value: unknown) => typeof value !== "string") ||
                body.requiredSkillIds.length > 100)
        ) {
            return NextResponse.json(
                { error: "Required skills must be a list of up to 100 skill IDs" },
                { status: 400 },
            );
        }
        const requiredSkillIds = [...new Set<string>(body.requiredSkillIds ?? [])];
        const skills = await schema.ai.getSkills(userId);
        const availableIds = new Set([
            ...DEFAULT_SKILLS.map((skill) => skill.id),
            ...(Array.isArray(skills)
                ? skills.map((skill) => skill.id)
                : Object.keys(skills ?? {})),
        ]);
        if (requiredSkillIds.some((skillId) => !availableIds.has(skillId))) {
            return NextResponse.json(
                { error: "A selected skill no longer exists. Reload your skills and try again." },
                { status: 400 },
            );
        }
        await schema.ai.saveProfile(userId, id, {
            requiredSkillIds,
            name,
            context,
            enabled: body.enabled !== false,
            updatedAt: Date.now(),
        });
        return NextResponse.json({ id });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save profile" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
        if (DEFAULT_PROFILES.some((profile) => profile.id === id)) {
            return NextResponse.json(
                { error: "Default profiles cannot be deleted" },
                { status: 403 },
            );
        }
        await schema.ai.deleteProfile(getUid(req), id);
        return NextResponse.json({ deleted: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete profile" },
            { status: 500 },
        );
    }
}

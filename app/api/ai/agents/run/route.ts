import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";
import { db } from "@/lib/firebaseAdmin";
import { POST as chat } from "@/app/api/ai/chat/route";

export const maxDuration = 60;

export async function POST(req: Request) {
    let claimed: { ref: FirebaseFirestore.DocumentReference; key: string } | undefined;
    try {
        const uid = getUid(req);
        const { agentId } = await req.json();
        if (typeof agentId !== "string" || !agentId || agentId.includes("/"))
            return Response.json({ error: "Invalid agent id" }, { status: 400 });
        const ref = db.collection("ai").doc(uid).collection("agents").doc(agentId);
        const assignments = await schema.lms.getAssignments(uid);
        const ids = Object.keys(assignments ?? {}).sort();
        const now = Date.now();
        const key = crypto.randomUUID();
        const prompt = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            const agent = snapshot.data();
            if (!agent) throw new Error("Agent not found");
            if (agent.trigger?.type === "manual" || !agent.trigger) return null;
            if ((agent.lockUntil ?? 0) > now || now - (agent.lastAttemptAt ?? 0) < 300000)
                return null;
            let reason = "Run your scheduled instructions now.";
            if (agent.trigger.type === "assignment") {
                if (!Array.isArray(agent.assignmentIds)) {
                    transaction.update(ref, { assignmentIds: ids });
                    return null;
                }
                const added = ids.filter((id) => !agent.assignmentIds.includes(id));
                if (!added.length) return null;
                reason = `New assignments detected (IDs): ${added.slice(0, 20).join(", ")}. Follow your instructions for these assignments.`;
            } else if (agent.trigger.type === "interval") {
                const interval = Math.max(5, Number(agent.trigger.intervalMinutes) || 60) * 60000;
                if (now - (agent.lastRunAt ?? agent.updatedAt ?? now) < interval) return null;
            } else return null;
            transaction.update(ref, { lockUntil: now + 120000, runKey: key, lastAttemptAt: now });
            return reason;
        });
        if (!prompt) return Response.json({ skipped: true });
        claimed = { ref, key };
        const response = await chat(
            new Request(new URL("/api/ai/chat", req.url), {
                method: "POST",
                headers: {
                    Authorization: req.headers.get("Authorization") ?? "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    agentId,
                    messages: [{ id: key, role: "user", parts: [{ type: "text", text: prompt }] }],
                }),
            }),
        );
        if (!response.ok)
            throw new Error((await response.json()).error || "Agent execution failed");
        const raw = await response.text();
        let output = "";
        for (const line of raw.split("\n")) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            const event = JSON.parse(line.slice(6));
            if (event.type === "error")
                throw new Error(event.errorText || "Agent execution failed");
            if (event.type === "text-delta") output += event.delta ?? "";
        }
        await ref.update({
            lastRunAt: Date.now(),
            lockUntil: 0,
            assignmentIds: ids,
            lastError: "",
            lastOutput: output.slice(0, 50000),
        });
        return Response.json({ ran: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Agent execution failed";
        if (claimed)
            await claimed.ref.update({ lockUntil: 0, lastError: message }).catch(() => undefined);
        return Response.json({ error: message }, { status: 500 });
    }
}

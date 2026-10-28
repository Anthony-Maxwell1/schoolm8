import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";

export async function GET(req: Request) {
    try {
        const agents = await schema.ai.getAgents(getUid(req));
        return NextResponse.json({
            agents: Object.entries(agents ?? {}).map(([id, agent]) => ({ id, ...agent })),
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load agents" },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const userId = getUid(req);
        const body = await req.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
        if (!name || !instructions) {
            return NextResponse.json(
                { error: "Name and instructions are required" },
                { status: 400 },
            );
        }
        const id = typeof body.id === "string" && body.id ? body.id : uuidv4();
        await schema.ai.saveAgent(userId, id, {
            name,
            instructions,
            profileIds: Array.isArray(body.profileIds) ? body.profileIds.slice(0, 20) : [],
            trigger: {
                type: ["interval", "assignment"].includes(body.trigger?.type)
                    ? body.trigger.type
                    : "manual",
                intervalMinutes: Math.max(
                    5,
                    Math.min(10080, Number(body.trigger?.intervalMinutes) || 60),
                ),
            },
            updatedAt: Date.now(),
        });
        return NextResponse.json({ id });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save agent" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing agent id" }, { status: 400 });
        await schema.ai.deleteAgent(getUid(req), id);
        return NextResponse.json({ deleted: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete agent" },
            { status: 500 },
        );
    }
}

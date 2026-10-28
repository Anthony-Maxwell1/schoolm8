import { DEFAULT_SKILLS } from "@/lib/ai/default-skills";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUid } from "@/lib/access/auth";
import { schema } from "@/lib/firebaseSchema";

export async function GET(req: Request) {
    try {
        const skills = await schema.ai.getSkills(getUid(req));
        return NextResponse.json({
            skills: [
                ...DEFAULT_SKILLS,
                ...(Array.isArray(skills)
                    ? skills
                    : Object.entries(skills ?? {}).map(([id, skill]) => ({
                          id,
                          ...(skill as Record<string, unknown>),
                      }))),
            ],
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to load skills" },
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
        if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
            return NextResponse.json({ error: "Invalid skill id" }, { status: 400 });
        }
        if (name.length > 100 || instructions.length > 30000) {
            return NextResponse.json(
                { error: "Name or instructions are too long" },
                { status: 400 },
            );
        }
        if (DEFAULT_SKILLS.some((skill) => skill.id === id)) {
            return NextResponse.json(
                { error: "Built-in skills are read-only. Create your own copy instead." },
                { status: 403 },
            );
        }
        await schema.ai.saveSkill(userId, id, {
            name,
            instructions,
            enabled: body.enabled !== false,
            updatedAt: Date.now(),
        });
        return NextResponse.json({ id });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save skill" },
            { status: 400 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing skill id" }, { status: 400 });
        if (DEFAULT_SKILLS.some((skill) => skill.id === id)) {
            return NextResponse.json(
                { error: "Default skills cannot be deleted" },
                { status: 403 },
            );
        }
        await schema.ai.deleteSkill(getUid(req), id);
        return NextResponse.json({ deleted: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete skill" },
            { status: 500 },
        );
    }
}

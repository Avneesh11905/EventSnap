import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAIN_API_URL = process.env.NEXT_PUBLIC_MODEL_URL || "http://localhost:8000";

// GET /api/encode/count?eventId=xxx — check how many images are encoded in pgvector
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const eventId = req.nextUrl.searchParams.get("eventId");
        if (!eventId) {
            return NextResponse.json({ err: "Missing eventId" }, { status: 400 });
        }

        // Verify ownership and get event code
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findFirst({
            where: { id: eventId, owner_id: user.id },
            select: { id: true, code: true, owner_id: true },
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }

        // Proxy to main_api
        const headers: Record<string, string> = {};

        const res = await fetch(`${MAIN_API_URL}/api/events/encode-count/${event.code}`, { headers });
        const data = await res.json();

        return NextResponse.json({ success: true, ...data });
    } catch {
        return NextResponse.json({ err: "Failed to check encoding status" }, { status: 500 });
    }
}

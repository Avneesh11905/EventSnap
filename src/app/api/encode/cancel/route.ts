import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json({ err: "eventId is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ err: "User not found" }, { status: 404 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { code: true, owner_id: true }
        });

        if (!event) {
            return NextResponse.json({ err: "Event not found" }, { status: 404 });
        }

        if (event.owner_id !== user.id) {
            return NextResponse.json({ err: "Forbidden" }, { status: 403 });
        }

        const pythonBackendUrl = process.env.NEXT_PUBLIC_INFERENCE_BACKEND_URL || "http://localhost:8000";
        const cancelRes = await fetch(`${pythonBackendUrl}/api/events/cancel-encoding/${event.code}`, {
            method: "POST"
        });

        if (!cancelRes.ok) {
            const err = await cancelRes.text();
            console.error("Failed to cancel encoding on python backend:", err);
            return NextResponse.json({ err: "Failed to cancel encoding" }, { status: cancelRes.status });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Cancel encoding error:", error);
        return NextResponse.json({ err: "Internal server error" }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiClient } from "@/lib/axios";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json({ err: "Missing eventId" }, { status: 400 });
        }

        // Verify event ownership
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
            return NextResponse.json({ err: "Event not found or unauthorized" }, { status: 404 });
        }

        // Proxy the call to the main_api server-side (no CORS issues)
        const MAIN_API_URL = process.env.NEXT_PUBLIC_INFERENCE_API_URL || "http://localhost:8000";

        const encodeRes = await apiClient.post(`${MAIN_API_URL}/api/events/encode-event/`, {
            event_code: event.code 
        });

        const encodeData = encodeRes.data;

        return NextResponse.json({
            success: true,
            task_id: encodeData.task_id,
        });
    } catch (error: any) {
        console.error("Encode proxy error:", error);
        return NextResponse.json({ err: error.message }, { status: 500 });
    }
}

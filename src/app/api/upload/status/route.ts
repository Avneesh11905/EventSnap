import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiClient } from "@/lib/axios";

const MAIN_API_URL = process.env.NEXT_PUBLIC_INFERENCE_API_URL || "http://localhost:8000";

// GET /api/upload/status?taskId=xxx — proxy encoding progress from main_api
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ err: "Unauthorized" }, { status: 401 });
        }

        const taskId = req.nextUrl.searchParams.get("taskId");
        if (!taskId || taskId === "undefined") {
            return NextResponse.json({ err: "Invalid or missing taskId" }, { status: 400 });
        }

        const res = await apiClient.get(`${MAIN_API_URL}/api/events/encode-status/${taskId}`);
        const data = res.data;
        return NextResponse.json({ success: true, ...data });
    } catch {
        return NextResponse.json({ err: "Failed to fetch encoding status" }, { status: 500 });
    }
}

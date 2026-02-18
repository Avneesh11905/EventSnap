import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAIN_API_URL = process.env.NEXT_PUBLIC_MODEL_URL || "http://localhost:8000";
const API_KEY = process.env.EVENTSNAP_API_KEY || "";

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

        const headers: Record<string, string> = {};
        if (API_KEY) headers["X-API-Key"] = API_KEY;

        const res = await fetch(`${MAIN_API_URL}/api/events/encode-status/${taskId}`, { headers });
        if (!res.ok) {
            return NextResponse.json({ err: "Failed to fetch status" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, ...data });
    } catch {
        return NextResponse.json({ err: "Failed to fetch encoding status" }, { status: 500 });
    }
}

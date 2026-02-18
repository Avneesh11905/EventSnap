import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { s3, BUCKET } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ err: "Unauthorized" }, { status: 401 });

        const { id: taskId } = await context.params;
        if (!taskId || taskId === "undefined") {
            return NextResponse.json({ err: "Invalid Task ID" }, { status: 400 });
        }

        // Proxy to main_api for status
        const res = await fetch(`${process.env.NEXT_PUBLIC_MODEL_URL}/api/tasks/${taskId}`, {
            headers: { "X-API-Key": process.env.EVENTSNAP_API_KEY || "" }
        });

        const data = await res.json();

        if (data.status === "SUCCESS" && data.result?.zip_path) {
            // Generate presigned URL for the resulting ZIP
            const command = new GetObjectCommand({
                Bucket: BUCKET,
                Key: data.result.zip_path,
            });

            const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
            data.download_url = downloadUrl;
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Task status proxy error:", err);
        return NextResponse.json({ err: err.message }, { status: 500 });
    }
}

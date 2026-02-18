import {
    S3Client,
    HeadBucketCommand,
    CreateBucketCommand,
    PutBucketCorsCommand,
    PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT!;
const accessKey = process.env.MINIO_ACCESS_KEY!;
const secretKey = process.env.MINIO_SECRET_KEY!;

export const BUCKET = process.env.MINIO_BUCKET_NAME!;

export const s3 = new S3Client({
    endpoint,
    region: "us-east-1", // MinIO doesn't care, but SDK requires it
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    },
    forcePathStyle: true, // Required for MinIO
});

/** Ensure the bucket exists in MinIO; create it if missing */
let bucketChecked = false;
export async function ensureBucketExists() {
    if (bucketChecked) return;
    try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
        bucketChecked = true;
    } catch (err: unknown) {
        const code =
            (err as { name?: string }).name ||
            (err as { $metadata?: { httpStatusCode?: number } }).$metadata
                ?.httpStatusCode;
        if (code === "NotFound" || code === 404 || code === "NoSuchBucket") {
            console.log(`Bucket "${BUCKET}" not found — creating it...`);
            await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
            console.log(`Bucket "${BUCKET}" created successfully.`);
        } else {
            throw err;
        }
    }

    // Always ensure CORS is configured (MinIO persistent storage might need it)
    try {
        await s3.send(new PutBucketCorsCommand({
            Bucket: BUCKET,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["PUT", "GET", "POST", "HEAD"],
                        AllowedOrigins: ["*"], // In production, restrict to your domain
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000,
                    },
                ],
            },
        }));
        bucketChecked = true;
    } catch (corsErr) {
        console.error("Failed to configure CORS for bucket:", corsErr);
    }

    // New: Ensure Public-Read Policy so images can be displayed in the browser
    try {
        const publicReadPolicy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "PublicRead",
                    Effect: "Allow",
                    Principal: "*",
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${BUCKET}/*`],
                },
            ],
        };

        await s3.send(new PutBucketPolicyCommand({
            Bucket: BUCKET,
            Policy: JSON.stringify(publicReadPolicy),
        }));
        console.log(`Public-read policy applied to bucket "${BUCKET}".`);
    } catch (policyErr) {
        console.error("Failed to apply public-read policy to bucket:", policyErr);
    }
}

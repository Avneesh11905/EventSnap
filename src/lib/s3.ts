import {
    S3Client,
    HeadBucketCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT!;
const accessKey = process.env.STORAGE_ACCESS_KEY!;
const secretKey = process.env.STORAGE_SECRET_KEY!;

export const BUCKET = process.env.STORAGE_BUCKET_NAME!;

export const s3 = new S3Client({
    endpoint,
    region: "auto", // S3 API requires a region (auto works for most S3-compatible providers)
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    },
    forcePathStyle: true, // Required for some S3-compatible storage APIs
});

/** Ensure the bucket exists in Storage; throw an error if missing */
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
            throw new Error(`Storage bucket "${BUCKET}" does not exist. Please create it manually with the correct policies/CORS settings.`);
        } else {
            throw err;
        }
    }

    bucketChecked = true;
}

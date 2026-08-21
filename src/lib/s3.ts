import { S3Client } from "@aws-sdk/client-s3";

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

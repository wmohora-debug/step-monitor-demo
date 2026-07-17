import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Only allow execution in a server environment
if (typeof window !== "undefined") {
  throw new Error("S3 utility can only be executed on the server side.");
}

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function parseS3Uri(uri: string): { bucket: string; key: string } | null {
  if (!uri.startsWith("s3://")) return null;
  const match = uri.match(/^s3:\/\/([^\/]+)\/(.+)$/);
  if (!match) return null;
  return {
    bucket: match[1],
    key: match[2],
  };
}

export async function generatePresignedUrl(uri: string, expiresInSeconds = 3600): Promise<string> {
  const parsed = parseS3Uri(uri);
  if (!parsed) {
    throw new Error("Invalid S3 URI format. Expected: s3://bucket/key");
  }

  const expectedBucket = process.env.AWS_S3_BUCKET || "iqm-step";
  if (parsed.bucket !== expectedBucket) {
    throw new Error("Access denied: Unauthorized bucket in S3 URI.");
  }

  // Strictly enforce prefix mapping validation for security
  if (!parsed.key.startsWith("galleries/images/")) {
    throw new Error("Access denied: Unauthorized key prefix path.");
  }

  const command = new GetObjectCommand({
    Bucket: parsed.bucket,
    Key: parsed.key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

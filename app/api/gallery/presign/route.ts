import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePresignedUrl } from "@/src/core/utils/s3";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user via cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("super_admin_access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate AWS S3 configuration
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!accessKey || !secretKey || !region || !bucket) {
      const missing = [];
      if (!accessKey) missing.push("AWS_ACCESS_KEY_ID");
      if (!secretKey) missing.push("AWS_SECRET_ACCESS_KEY");
      if (!region) missing.push("AWS_REGION");
      if (!bucket) missing.push("AWS_S3_BUCKET");
      return NextResponse.json(
        { error: `AWS S3 server configuration is incomplete. Missing environment variable(s): ${missing.join(", ")}` },
        { status: 500 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { uri, uris } = body;

    // 3. Batch resolution
    if (Array.isArray(uris)) {
      const results = await Promise.all(
        uris.map(async (u) => {
          if (typeof u !== "string" || !u.startsWith("s3://")) {
            return { uri: u, url: u }; // Pass-through for non-S3/invalid URLs
          }
          try {
            const url = await generatePresignedUrl(u);
            return { uri: u, url };
          } catch (err: any) {
            return { uri: u, error: err.message, url: "" };
          }
        })
      );
      return NextResponse.json({ results });
    }

    // 4. Single resolution
    if (typeof uri !== "string") {
      return NextResponse.json({ error: "Invalid URI" }, { status: 400 });
    }

    if (!uri.startsWith("s3://")) {
      return NextResponse.json({ url: uri }); // Pass-through for non-S3/invalid URLs
    }

    const url = await generatePresignedUrl(uri);
    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

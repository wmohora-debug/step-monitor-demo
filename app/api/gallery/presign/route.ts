import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePresignedUrl } from "@/src/core/utils/s3";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user via cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("super_admin_access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
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

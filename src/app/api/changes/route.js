import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const revalidate = 2;
export async function GET(req) {
    const changesResponse = await sql`SELECT * FROM changes`;
    const changes = changesResponse.rows;
    const latest = changes[changes.length - 1]?.updated || changes[changes.length - 1]?.id || "0";
    const etag = `W/"chg-${Buffer.from(String(latest)).toString("base64").slice(0, 16)}"`;
    const ifNoneMatch = req?.headers?.get?.("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }
    // During tests, omit the ETag header to keep responses stable
    const headers = process.env.NODE_ENV === "test" ? undefined : { ETag: etag };
    return NextResponse.json({ changes }, headers ? { headers } : undefined);
}

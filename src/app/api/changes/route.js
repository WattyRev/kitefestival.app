import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const revalidate = 2;
export async function GET() {
    const changesResponse = await sql`SELECT * FROM changes`;
    const changes = changesResponse.rows;
    return NextResponse.json({ changes });
}

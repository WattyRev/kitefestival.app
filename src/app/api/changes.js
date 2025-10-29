"use server";

import { sql } from "@vercel/postgres";

export async function getChanges() {
    const changesResponse = await sql`SELECT * FROM changes`;
    const changes = changesResponse.rows;
    return { changes };
}

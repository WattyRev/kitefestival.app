import { sql } from "@vercel/postgres";

export default async function logUpdateByTableName(tableName: string) {
    const response = await sql`UPDATE changes SET updated = now() WHERE tablename = ${tableName}`;
    if (response.rowCount === 0) {
        await sql`INSERT INTO changes (tablename, updated) VALUES (${tableName}, now())`;
    }
}
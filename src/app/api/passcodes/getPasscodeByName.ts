import { sql } from "@vercel/postgres";

export default async function getPasscodeByName(name: string) {
    const editorPasscodeResponse = await sql`SELECT passcode FROM passcodes WHERE name = ${name}`;
    if (!editorPasscodeResponse.rows.length) {
        throw new Error(`${name} passcode not found`);
    }
    return editorPasscodeResponse.rows[0].passcode;
}
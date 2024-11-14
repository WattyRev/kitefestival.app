import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import getPasscodeByName from "../passcodes/getPasscodeByName";

export async function POST(req: Request) {
    const { title, description, passcode } = await req.json();
    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }
    const editorPasscode = await getPasscodeByName('editor');
    if (passcode !== editorPasscode) {
        return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
    }

    if (!title || !description) {
        return NextResponse.json({ message: 'No title or description provided'}, { status: 400 });
    }

    const id = crypto.randomUUID();
    const countResponse = await sql`SELECT COUNT(*) FROM activities`;
    const sortIndex = countResponse.rows[0].count;
    await sql`INSERT INTO activities (id, title, description, sortIndex) VALUES (${id}, ${title}, ${description}, ${sortIndex})`;
    const activities = [
        { id, title, description, sortIndex },
    ]
    return NextResponse.json({ activities });
}

export async function GET() {
    const activitiesResponse = await sql`SELECT id, title, description, sortIndex FROM activities`;
    const activities = activitiesResponse.rows;
    return NextResponse.json({ activities });
}

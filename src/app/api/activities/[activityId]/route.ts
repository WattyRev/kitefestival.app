import { NextRequest, NextResponse } from "next/server";
import { getPasscodeByName } from "../../passcodes/route";
import { sql } from "@vercel/postgres";

export async function DELETE(req: NextRequest, { params }: { params: { activityId: string } }) {
    const { activityId } = params;
    const { passcode } = await req.json();
    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }
    const editorPasscode = await getPasscodeByName('editor');
    if (passcode !== editorPasscode) {
        return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
    }
    if (!activityId) {
        return NextResponse.json({ message: 'No activity ID provided'}, { status: 400 });
    }
    await sql`DELETE FROM activities WHERE id = ${activityId}`;
    return NextResponse.json({ message: 'Activity deleted'});
}

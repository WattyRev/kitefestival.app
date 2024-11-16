import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import getPasscodeByName from "../../passcodes/getPasscodeByName";
import logUpdateByTableName from "../../logUpdate";
import validatePasscode, { PasscodeLevel } from "../../passcodes/validatePasscode";
import patchActivity, { NoPatchableKeysError } from "./patchActivity";

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
    await logUpdateByTableName('activities');
    return NextResponse.json({ message: 'Activity deleted'});
}

export async function PATCH(req: NextRequest, { params }: { params: { activityId: string } }) {
    const { activity, passcode } = await req.json();
    const validationResponse = await validatePasscode(passcode, [PasscodeLevel.EDITOR]);
    if (validationResponse !== true) {
        return validationResponse;
    }

    try {
        const updatedActivity = await patchActivity(params.activityId, activity);
        return NextResponse.json({ activities: [updatedActivity] });
    } catch (error) {
        if (error === NoPatchableKeysError) {
            return NextResponse.json({ message: `No patchable keys provided for activity ${params.activityId}`}, { status: 400 });
        }
        throw error;
    }
}
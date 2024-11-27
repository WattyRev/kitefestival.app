import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import getPasscodeByName from "../../passcodes/getPasscodeByName";
import logUpdateByTableName from "../../logUpdate";
import validatePasscode from "../../passcodes/validatePasscode";
import patchActivity, { NoPatchableKeysError } from "./patchActivity";

/**
 * Deletes an activity by ID.
 *
 * DELETE /api/activities/:activityId
 * {
 *   passcode: string
 * }
 *
 * Response:
 * {
 *   message: string
 * }
 */
export async function DELETE(req, { params }) {
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
    await Promise.all([sql`DELETE FROM activities WHERE id = ${activityId}`, logUpdateByTableName('activities')]);
    return NextResponse.json({ message: 'Activity deleted'});
}

/**
 * Patches an existing activity with new values.
 *
 * PATCH /api/activities/:activityId
 * {
 *   activity: Partial<Activity>
 *   passcode: string
 * }
 *
 * Response:
 * {
 *   message?: string
 * }
 */
export async function PATCH(req, { params }) {
    const { activity, passcode } = await req.json();
    const validationResponse = await validatePasscode(passcode, ['editor']);
    if (validationResponse !== true) {
        return validationResponse;
    }

    try {
        await Promise.all([patchActivity(params.activityId, activity), logUpdateByTableName('activities')]);
        return NextResponse.json({ });
    } catch (error) {
        if (error === NoPatchableKeysError) {
            return NextResponse.json({ message: `No patchable keys provided for activity ${params.activityId}`}, { status: 400 });
        }
        throw error;
    }
}
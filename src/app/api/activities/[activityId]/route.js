import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../logUpdate";
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from "../../passcodes/validatePasscode";
import patchActivity, { NoPatchableKeysError} from "./patchActivity";
import { cookies } from "next/headers";

/**
 * Deletes an activity by ID.
 *
 * DELETE /api/activities/:activityId
 *
 * Response:
 * {
 *   message: string
 * }
 */
export async function DELETE(_, { params }) {
    const { activityId } = params;
    const cookieStore = cookies();
    const passcode = cookieStore.get('passcode')?.value;
    try {
        await validatePasscode(passcode, ['editor']);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            return NextResponse.json({ message: 'No passcode provided'}, { status: 401 });
        }
        if (error instanceof InvalidPasscodeError) {
            return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
        }
        throw error;
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
 * }
 *
 * Response:
 * {
 *   message?: string
 * }
 */
export async function PATCH(req, { params }) {
    const { activity } = await req.json();
    const cookieStore = cookies();
    const passcode = cookieStore.get('passcode')?.value;
    try {
        await validatePasscode(passcode, ['editor']);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            return NextResponse.json({ message: 'No passcode provided'}, { status: 401 });
        }
        if (error instanceof InvalidPasscodeError) {
            return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
        }
        throw error;
    }

    try {
        await Promise.all([patchActivity(params.activityId, activity), logUpdateByTableName('activities')]);
        return NextResponse.json({ });
    } catch (error) {
        if (error instanceof NoPatchableKeysError) {
            return NextResponse.json({ message: `No patchable keys provided for activity ${params.activityId}`}, { status: 400 });
        }
        throw error;
    }
}
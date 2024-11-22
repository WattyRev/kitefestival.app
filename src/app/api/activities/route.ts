import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../logUpdate";
import validatePasscode, { PasscodeLevel } from "../passcodes/validatePasscode";
import patchActivity from "./[activityId]/patchActivity";

export interface Activity {
    id: string;
    title: string;
    description: string;
    sortIndex: number;    
    scheduleIndex: number;
}

export const revalidate = 0;

/**
 * Get all activities.
 *
 * GET /api/activities
 *
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function GET() {
    const activitiesResponse = await sql`SELECT * FROM activities ORDER BY sortIndex ASC`;
    const activities = activitiesResponse.rows.map(activity => {
        const { id, title, description, sortindex, scheduleindex } = activity;
        return { id, title, description, sortIndex: sortindex, scheduleIndex: scheduleindex };
    })
    return NextResponse.json({ activities });
}

/**
 * Create a new activity.
 *
 * POST /api/activities
 * {
 *   title: string
 *   description: string
 *   passcode: string
 * }
 * 
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function POST(req: Request) {
    const { title, description = '', passcode } = await req.json();
    const validationResponse = await validatePasscode(passcode, [PasscodeLevel.EDITOR]);
    if (validationResponse !== true) {
        return validationResponse;
    }

    if (!title) {
        return NextResponse.json({ message: 'No title provided'}, { status: 400 });
    }

    const id = crypto.randomUUID();
    const highestSortIndexResponse = await sql`SELECT (sortIndex) FROM activities ORDER BY sortIndex DESC LIMIT 1`;
    let sortIndex;
    if (!highestSortIndexResponse.rows.length) {
        sortIndex = 0;
    } else {
        sortIndex = highestSortIndexResponse.rows[0].sortindex + 1;
    }
    await Promise.all([
        sql`INSERT INTO activities (id, title, description, sortIndex, scheduleIndex) VALUES (${id}, ${title}, ${description}, ${sortIndex}, null)`,
        logUpdateByTableName('activities')
    ]);
    const activities = [
        { id, title, description, sortIndex, scheduleIndex: null },
    ]
    return NextResponse.json({ activities });
}

/**
 * Patches multiple activities at once.
 * 
 * PATCH /api/activities
 * {
 *   activities: Partial<Activity>[],
 *   passcode: string
 * }
 * 
 * Response:
 * {}
 */
export async function  PATCH(req: Request) {
    const { activities, passcode }: ({ activities: Partial<Activity>[], passcode: string }) = await req.json();
    const validationResponse = await validatePasscode(passcode, [PasscodeLevel.EDITOR]);
    if (validationResponse !== true) {
        return validationResponse;
    }

    await Promise.all(activities.map(async activity => {
        if (!activity.id) {
            return;
        }
        await Promise.all([patchActivity(activity.id, activity), logUpdateByTableName('activities')]);
    }));
    return NextResponse.json({});
};

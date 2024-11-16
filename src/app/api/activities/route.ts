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
    const activitiesResponse = await sql`SELECT id, title, description, sortIndex FROM activities ORDER BY sortIndex ASC`;
    const activities = activitiesResponse.rows;
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
    await sql`INSERT INTO activities (id, title, description, sortIndex) VALUES (${id}, ${title}, ${description}, ${sortIndex})`;
    await logUpdateByTableName('activities');
    const activities = [
        { id, title, description, sortIndex },
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
 * {
 *   activities: Activity[]
 * }
 */
export async function  PATCH(req: Request) {
    const { activities, passcode }: ({ activities: Partial<Activity>[], passcode: string }) = await req.json();
    const validationResponse = await validatePasscode(passcode, [PasscodeLevel.EDITOR]);
    if (validationResponse !== true) {
        return validationResponse;
    }

    const updatedActivities = await Promise.all(activities.map(async activity => {
        if (!activity.id) {
            return;
        }
        await patchActivity(activity.id, activity);
    }));
    return NextResponse.json({ activities: updatedActivities });
};

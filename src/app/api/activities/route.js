import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../crypto";
import logUpdateByTableName from "../logUpdate";
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from "../passcodes/validatePasscode";
import patchActivity from "./[activityId]/patchActivity";
import { cookies } from "next/headers";

export const revalidate = 0;

/**
 * Get all activities.
 *
 * GET /api/activities?eventId=optional
 *
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
      let activitiesResponse;
    if (eventId) {
        activitiesResponse = await sql`SELECT * FROM activities WHERE eventId = ${eventId} ORDER BY scheduleIndex ASC,sortIndex ASC`;
    } else {
        // For backward compatibility, if no eventId is provided, get activities for active event or all activities
        // First check if events table exists, if not just get all activities
        try {
            activitiesResponse = await sql`
                SELECT a.* FROM activities a 
                LEFT JOIN events e ON a.eventId = e.id 
                WHERE e.isActive = true OR a.eventId IS NULL 
                ORDER BY a.scheduleIndex ASC, a.sortIndex ASC
            `;
        } catch (error) {
            // If events table doesn't exist, just get all activities
            if (error.code === '42P01') { // Table doesn't exist error
                activitiesResponse = await sql`SELECT * FROM activities ORDER BY scheduleIndex ASC, sortIndex ASC`;
            } else {
                throw error;
            }
        }
    }
    
    const activities = activitiesResponse.rows.map(activity => {
        const { id, title, description, sortindex, scheduleindex, eventid } = activity;
        return { id, title, description, sortIndex: sortindex, scheduleIndex: scheduleindex, eventId: eventid };
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
 *   eventId?: string
 * }
 * 
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function POST(req) {
    const { title, description = '', eventId = null } = await req.json();
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

    if (!title) {
        return NextResponse.json({ message: 'No title provided'}, { status: 400 });
    }

    const id = randomUUID();
    
    // Get the highest sort index for activities in the same event (or no event)
    let highestSortIndexResponse;
    if (eventId) {
        highestSortIndexResponse = await sql`SELECT (sortIndex) FROM activities WHERE eventId = ${eventId} ORDER BY sortIndex DESC LIMIT 1`;
    } else {
        highestSortIndexResponse = await sql`SELECT (sortIndex) FROM activities WHERE eventId IS NULL ORDER BY sortIndex DESC LIMIT 1`;
    }
    
    let sortIndex;
    if (!highestSortIndexResponse.rows.length) {
        sortIndex = 0;
    } else {
        sortIndex = highestSortIndexResponse.rows[0].sortindex + 1;
    }
    
    await Promise.all([
        sql`INSERT INTO activities (id, title, description, sortIndex, scheduleIndex, eventId) VALUES (${id}, ${title}, ${description}, ${sortIndex}, null, ${eventId})`,
        logUpdateByTableName('activities')
    ]);
    const activities = [
        { id, title, description, sortIndex, scheduleIndex: null, eventId },
    ]
    return NextResponse.json({ activities });
}

/**
 * Patches multiple activities at once.
 * 
 * PATCH /api/activities
 * {
 *   activities: Partial<Activity>[],
 * }
 * 
 * Response:
 * {}
 */
export async function PATCH(req) {
    const { activities } = await req.json();
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

    await Promise.all(activities.map(async activity => {
        if (!activity.id) {
            return;
        }
        await Promise.all([patchActivity(activity.id, activity), logUpdateByTableName('activities')]);
    }));
    return NextResponse.json({});
};

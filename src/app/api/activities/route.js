import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../crypto";
import logUpdateByTableName from "../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import patchActivity from "./[activityId]/patchActivity";
import { cookies } from "next/headers";

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
    const activitiesResponse =
        await sql`SELECT * FROM activities ORDER BY scheduleIndex ASC,sortIndex ASC`;
    const activities = activitiesResponse.rows.map((activity) => {
        const { id, title, description, sortindex, scheduleindex } = activity;
        return {
            id,
            title,
            description,
            music: JSON.parse(activity.music),
            sortIndex: sortindex,
            scheduleIndex: scheduleindex,
        };
    });
    return NextResponse.json({ activities });
}

/**
 * Create a new activity.
 *
 * POST /api/activities
 * {
 *   title: string
 *   description: string,
 *   music: string[]
 * }
 *
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function POST(req) {
    const { title, description = "", music = [] } = await req.json();
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;
    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            return NextResponse.json(
                { message: "No passcode provided" },
                { status: 401 },
            );
        }
        if (error instanceof InvalidPasscodeError) {
            return NextResponse.json(
                { message: "Provided passcode is invalid" },
                { status: 403 },
            );
        }
        throw error;
    }

    if (!title) {
        return NextResponse.json(
            { message: "No title provided" },
            { status: 400 },
        );
    }

    const id = randomUUID();
    const highestSortIndexResponse =
        await sql`SELECT (sortIndex) FROM activities WHERE sortIndex IS NOT NULL ORDER BY sortIndex DESC LIMIT 1`;
    let sortIndex;
    if (!highestSortIndexResponse.rows.length) {
        sortIndex = 0;
    } else {
        sortIndex = highestSortIndexResponse.rows[0].sortindex + 1;
    }
    await Promise.all([
        sql`INSERT INTO activities (id, title, description, music, sortIndex, scheduleIndex) VALUES (${id}, ${title}, ${description}, ${JSON.stringify(music)}, ${sortIndex}, null)`,
        logUpdateByTableName("activities"),
    ]);
    const activities = [
        { id, title, description, music, sortIndex, scheduleIndex: null },
    ];
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
    const passcode = cookieStore.get("passcode")?.value;

    let permissionLevel = null;
    try {
        const isEditor = await validatePasscode(passcode, ["editor"]);
        permissionLevel = isEditor ? "editor" : null;
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            return NextResponse.json(
                { message: "No passcode provided" },
                { status: 401 },
            );
        } else if (error instanceof InvalidPasscodeError) {
            try {
                const isUser = await validatePasscode(passcode, ["user"]);
                permissionLevel = isUser ? "user" : null;
            } catch (error) {
                if (error instanceof InvalidPasscodeError) {
                    return NextResponse.json(
                        { message: "Provided passcode is invalid" },
                        { status: 403 },
                    );
                }
                throw error;
            }
        } else {
            throw error;
        }
    }

    await Promise.all(
        activities.map(async (activity) => {
            if (!activity.id) {
                return;
            }
            await Promise.all([
                patchActivity(activity.id, activity, permissionLevel),
                logUpdateByTableName("activities"),
            ]);
        }),
    );
    return NextResponse.json({});
}

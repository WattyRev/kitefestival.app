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
 * Get all activities for the active event, or all activities if no active event.
 *
 * GET /api/activities?eventId=<eventId>
 *
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");

        let activitiesResponse;

        if (eventId) {
            // Get activities for specific event
            activitiesResponse = await sql`
                SELECT * FROM activities 
                WHERE event_id = ${eventId}
                ORDER BY scheduleIndex ASC, sortIndex ASC
            `;
        } else {
            // Get activities for active event, or all activities if no active event
            const activeEventResponse = await sql`
                SELECT id FROM events WHERE is_active = true LIMIT 1
            `;

            if (activeEventResponse.rows.length > 0) {
                const activeEventId = activeEventResponse.rows[0].id;
                activitiesResponse = await sql`
                    SELECT * FROM activities 
                    WHERE event_id = ${activeEventId}
                    ORDER BY scheduleIndex ASC, sortIndex ASC
                `;
            } else {
                // No active event, get all activities
                activitiesResponse = await sql`
                    SELECT * FROM activities 
                    ORDER BY scheduleIndex ASC, sortIndex ASC
                `;
            }
        }

        const normalizeMusic = (val) => {
            if (val == null) return [];
            if (Array.isArray(val)) return val;
            if (typeof val === "object") {
                // If it's a JSON object but not an array, ignore
                return [];
            }
            if (typeof val === "string") {
                const s = val.trim();
                if (!s) return [];
                // Try to parse JSON; if that fails, treat as a single entry string
                try {
                    const parsed = JSON.parse(s);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (_) {
                    return [s];
                }
            }
            return [];
        };

        const activities = activitiesResponse.rows.map((activity) => {
            const {
                id,
                title,
                description,
                sortindex,
                scheduleindex,
                event_id,
            } = activity;
            return {
                id,
                title,
                description,
                music: normalizeMusic(activity.music),
                sortIndex: sortindex,
                scheduleIndex: scheduleindex,
                eventId: event_id,
            };
        });

        return NextResponse.json({ activities });
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json(
            { message: "Failed to fetch activities" },
            { status: 500 },
        );
    }
}

/**
 * Create a new activity for the active event.
 *
 * POST /api/activities
 * {
 *   title: string
 *   description: string,
 *   music: string[],
 *   eventId?: string
 * }
 *
 * Response:
 * {
 *   activities: Activity[]
 * }
 */
export async function POST(req) {
    const { title, description = "", music = [], eventId } = await req.json();
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;
    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "[activities POST] 401: No passcode cookie present",
                );
            }
            return NextResponse.json(
                { message: "No passcode provided" },
                { status: 401 },
            );
        }
        if (error instanceof InvalidPasscodeError) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "[activities POST] 403: Invalid passcode for editor scope",
                );
            }
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

    try {
        // Determine which event to associate with
        let targetEventId = eventId;

        if (!targetEventId) {
            // Get the active event
            const activeEventResponse = await sql`
                SELECT id FROM events WHERE is_active = true LIMIT 1
            `;

            if (activeEventResponse.rows.length > 0) {
                targetEventId = activeEventResponse.rows[0].id;
            } else {
                // No active event and no eventId provided
                return NextResponse.json(
                    {
                        message:
                            "No active event found. Please create an event first or specify an eventId.",
                    },
                    { status: 400 },
                );
            }
        } else {
            // Verify the provided eventId exists
            const eventExists = await sql`
                SELECT id FROM events WHERE id = ${eventId}
            `;

            if (eventExists.rows.length === 0) {
                return NextResponse.json(
                    { message: "Specified event not found" },
                    { status: 400 },
                );
            }
        }

        // Create the activities table with event_id column if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS activities (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                music JSONB DEFAULT '[]',
                sortIndex INTEGER,
                scheduleIndex INTEGER,
                event_id VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `;

        // Add event_id column if it doesn't exist (for backward compatibility)
        try {
            await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS event_id VARCHAR(36)`;
            await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
            await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
        } catch (error) {
            // Column might already exist, continue
        }

        const id = randomUUID();
        const highestSortIndexResponse = await sql`
            SELECT (sortIndex) FROM activities 
            WHERE sortIndex IS NOT NULL AND event_id = ${targetEventId}
            ORDER BY sortIndex DESC LIMIT 1
        `;

        let sortIndex;
        if (!highestSortIndexResponse.rows.length) {
            sortIndex = 0;
        } else {
            sortIndex = highestSortIndexResponse.rows[0].sortindex + 1;
        }

        await Promise.all([
            sql`
                INSERT INTO activities (
                    id, title, description, music, sortIndex, scheduleIndex, event_id, created_at, updated_at
                ) VALUES (
                    ${id}, ${title}, ${description}, ${JSON.stringify(music)}, ${sortIndex}, null, ${targetEventId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            `,
            logUpdateByTableName("activities"),
        ]);

        const activities = [
            {
                id,
                title,
                description,
                music,
                sortIndex,
                scheduleIndex: null,
                eventId: targetEventId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        return NextResponse.json({ activities });
    } catch (error) {
        console.error("Error creating activity:", error);
        return NextResponse.json(
            { message: "Failed to create activity" },
            { status: 500 },
        );
    }
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

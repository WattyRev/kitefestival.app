import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../crypto";
import logUpdateByTableName from "../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import { cookies } from "next/headers";

export const revalidate = 0;

/**
 * Get all events.
 *
 * GET /api/events
 *
 * Response:
 * {
 *   events: Event[]
 * }
 */
export async function GET() {
    try {
        const eventsResponse = await sql`
            SELECT * FROM events 
            ORDER BY created_at DESC
        `;

        const events = eventsResponse.rows.map((event) => {
            const {
                id,
                name,
                description,
                start_date,
                end_date,
                location,
                is_active,
                created_at,
                updated_at,
            } = event;

            return {
                id,
                name,
                description,
                startDate: start_date,
                endDate: end_date,
                location,
                isActive: is_active,
                createdAt: created_at,
                updatedAt: updated_at,
            };
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { message: "Failed to fetch events" },
            { status: 500 },
        );
    }
}

/**
 * Create a new event.
 *
 * POST /api/events
 * {
 *   name: string
 *   description?: string
 *   startDate?: string
 *   endDate?: string
 *   location?: string
 * }
 *
 * Response:
 * {
 *   event: Event
 * }
 */
export async function POST(req) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    try {
        await validatePasscode(passcode, ["admin", "editor"]);
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

    try {
        const {
            name,
            description = "",
            startDate: rawStartDate = null,
            endDate: rawEndDate = null,
            location = "",
        } = await req.json();

        const toDateOnly = (val) => {
            if (!val) return null;
            const s = String(val).trim();
            if (!s) return null;
            // Accept ISO strings, cut off any time portion
            if (s.includes("T")) return s.split("T")[0];
            if (s.length > 10) return s.slice(0, 10);
            return s; // expected YYYY-MM-DD
        };
        const startDate = toDateOnly(rawStartDate);
        const endDate = toDateOnly(rawEndDate);

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { message: "Event name is required" },
                { status: 400 },
            );
        }

        // Check if an event with this name already exists
        const existingEvent = await sql`
            SELECT id FROM events WHERE LOWER(name) = LOWER(${name.trim()})
        `;

        if (existingEvent.rows.length > 0) {
            return NextResponse.json(
                { message: "An event with this name already exists" },
                { status: 400 },
            );
        }

        const id = randomUUID();

    // Create the events table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                location VARCHAR(255),
                is_active BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

    // Patch existing events table to include any missing columns (for older schemas)
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date TIMESTAMP`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(255)`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

    await sql`
            INSERT INTO events (
                id, name, description, start_date, end_date, location, is_active
            ) VALUES (
                ${id}, ${name.trim()}, ${description}, ${startDate}, ${endDate}, ${location}, false
            )
        `;

        await logUpdateByTableName("events");

        const event = {
            id,
            name: name.trim(),
            description,
            startDate,
            endDate,
            location,
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ event });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { message: "Failed to create event" },
            { status: 500 },
        );
    }
}

/**
 * Update multiple events at once.
 *
 * PATCH /api/events
 * {
 *   events: Partial<Event>[]
 * }
 *
 * Response:
 * {}
 */
export async function PATCH(req) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    try {
        await validatePasscode(passcode, ["admin", "editor"]);
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

    try {
        const { events } = await req.json();

        if (!Array.isArray(events)) {
            return NextResponse.json(
                { message: "Events must be an array" },
                { status: 400 },
            );
        }

        const toDateOnly = (val) => {
            if (!val) return null;
            const s = String(val).trim();
            if (!s) return null;
            if (s.includes("T")) return s.split("T")[0];
            if (s.length > 10) return s.slice(0, 10);
            return s;
        };

        await Promise.all(
            events.map(async (event) => {
                if (!event.id) {
                    return;
                }

                const updateFields = [];
                const updateValues = [];
                let paramIndex = 1;

                if (event.name !== undefined) {
                    updateFields.push(`name = $${paramIndex}`);
                    updateValues.push(event.name.trim());
                    paramIndex++;
                }
                if (event.description !== undefined) {
                    updateFields.push(`description = $${paramIndex}`);
                    updateValues.push(event.description);
                    paramIndex++;
                }
                if (event.startDate !== undefined) {
                    updateFields.push(`start_date = $${paramIndex}`);
                    updateValues.push(toDateOnly(event.startDate));
                    paramIndex++;
                }
                if (event.endDate !== undefined) {
                    updateFields.push(`end_date = $${paramIndex}`);
                    updateValues.push(toDateOnly(event.endDate));
                    paramIndex++;
                }
                if (event.location !== undefined) {
                    updateFields.push(`location = $${paramIndex}`);
                    updateValues.push(event.location);
                    paramIndex++;
                }
                if (event.isActive !== undefined) {
                    updateFields.push(`is_active = $${paramIndex}`);
                    updateValues.push(event.isActive);
                    paramIndex++;
                }

                if (updateFields.length > 0) {
                    updateFields.push(`updated_at = $${paramIndex}`);
                    updateValues.push(new Date().toISOString());
                    updateValues.push(event.id);

                    const query = `
                        UPDATE events 
                        SET ${updateFields.join(", ")} 
                        WHERE id = $${paramIndex + 1}
                    `;

                    await sql.query(query, updateValues);
                }
            }),
        );

        await logUpdateByTableName("events");
        return NextResponse.json({});
    } catch (error) {
        console.error("Error updating events:", error);
        return NextResponse.json(
            { message: "Failed to update events" },
            { status: 500 },
        );
    }
}

/**
 * Delete all events and associated data (admin only).
 *
 * DELETE /api/events
 *
 * Response:
 * {
 *   message: string,
 *   snapshot: { events: Event[], activities: Activity[], comments: Comment[] }
 * }
 */
export async function DELETE() {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    try {
        await validatePasscode(passcode, ["admin"]);
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

    try {
        // Create snapshot before deletion
        const [eventsResponse, activitiesResponse, commentsResponse] =
            await Promise.all([
                sql`SELECT * FROM events ORDER BY created_at DESC`,
                sql`SELECT * FROM activities ORDER BY scheduleIndex ASC, sortIndex ASC`,
                sql`SELECT * FROM comments ORDER BY createtime ASC`,
            ]);

        const snapshot = {
            events: eventsResponse.rows.map((event) => ({
                id: event.id,
                name: event.name,
                description: event.description,
                startDate: event.start_date,
                endDate: event.end_date,
                location: event.location,
                isActive: event.is_active,
                createdAt: event.created_at,
                updatedAt: event.updated_at,
            })),
            activities: activitiesResponse.rows.map((activity) => ({
                id: activity.id,
                title: activity.title,
                description: activity.description,
                music: JSON.parse(activity.music || "[]"),
                sortIndex: activity.sortindex,
                scheduleIndex: activity.scheduleindex,
                eventId: activity.event_id,
            })),
            comments: commentsResponse.rows.map((comment) => ({
                id: comment.id,
                message: comment.message,
                activityId: comment.activityid,
                userId: comment.userid,
                userName: comment.username,
                createTime: comment.createtime,
                edited: comment.edited,
            })),
        };

        // Delete all data in proper order (comments -> activities -> events)
        await Promise.all([
            sql`DELETE FROM comments`,
            sql`DELETE FROM activities`,
            sql`DELETE FROM events`,
            logUpdateByTableName("comments"),
            logUpdateByTableName("activities"),
            logUpdateByTableName("events"),
        ]);

        return NextResponse.json({
            message: "All events and associated data deleted successfully",
            snapshot,
        });
    } catch (error) {
        console.error("Error deleting all events:", error);
        return NextResponse.json(
            { message: "Failed to delete events" },
            { status: 500 },
        );
    }
}

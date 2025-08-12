import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Get a specific event by ID.
 *
 * GET /api/events/:eventId
 *
 * Response:
 * {
 *   event: Event
 * }
 */
export async function GET(_, { params }) {
    const { eventId } = params;

    try {
        const eventResponse = await sql`
            SELECT * FROM events WHERE id = ${eventId}
        `;

        if (eventResponse.rows.length === 0) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 },
            );
        }

        const event = eventResponse.rows[0];
        return NextResponse.json({
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                startDate: event.start_date,
                endDate: event.end_date,
                location: event.location,
                isActive: event.is_active,
                createdAt: event.created_at,
                updatedAt: event.updated_at,
            },
        });
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { message: "Failed to fetch event" },
            { status: 500 },
        );
    }
}

/**
 * Update a specific event.
 *
 * PATCH /api/events/:eventId
 * {
 *   name?: string
 *   description?: string
 *   startDate?: string
 *   endDate?: string
 *   location?: string
 *   isActive?: boolean
 * }
 *
 * Response:
 * {
 *   event: Event
 * }
 */
export async function PATCH(req, { params }) {
    const { eventId } = params;
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
        // Check if event exists
        const existingEventResponse = await sql`
            SELECT * FROM events WHERE id = ${eventId}
        `;

        if (existingEventResponse.rows.length === 0) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 },
            );
        }

        const updateData = await req.json();
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (updateData.name !== undefined) {
            if (!updateData.name || updateData.name.trim() === "") {
                return NextResponse.json(
                    { message: "Event name cannot be empty" },
                    { status: 400 },
                );
            }

            // Check if another event with this name exists
            const nameCheckResponse = await sql`
                SELECT id FROM events 
                WHERE LOWER(name) = LOWER(${updateData.name.trim()}) 
                AND id != ${eventId}
            `;

            if (nameCheckResponse.rows.length > 0) {
                return NextResponse.json(
                    { message: "An event with this name already exists" },
                    { status: 400 },
                );
            }

            updateFields.push(`name = $${paramIndex}`);
            updateValues.push(updateData.name.trim());
            paramIndex++;
        }

        if (updateData.description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            updateValues.push(updateData.description);
            paramIndex++;
        }

        if (updateData.startDate !== undefined) {
            updateFields.push(`start_date = $${paramIndex}`);
            updateValues.push(updateData.startDate);
            paramIndex++;
        }

        if (updateData.endDate !== undefined) {
            updateFields.push(`end_date = $${paramIndex}`);
            updateValues.push(updateData.endDate);
            paramIndex++;
        }

        if (updateData.location !== undefined) {
            updateFields.push(`location = $${paramIndex}`);
            updateValues.push(updateData.location);
            paramIndex++;
        }

        if (updateData.isActive !== undefined) {
            // If setting this event as active, deactivate all other events first
            if (updateData.isActive === true) {
                await sql`UPDATE events SET is_active = false WHERE id != ${eventId}`;
            }

            updateFields.push(`is_active = $${paramIndex}`);
            updateValues.push(updateData.isActive);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return NextResponse.json(
                { message: "No valid fields to update" },
                { status: 400 },
            );
        }

        // Add updated_at timestamp
        updateFields.push(`updated_at = $${paramIndex}`);
        updateValues.push(new Date().toISOString());
        updateValues.push(eventId);

        const query = `
            UPDATE events 
            SET ${updateFields.join(", ")} 
            WHERE id = $${paramIndex + 1}
            RETURNING *
        `;

        const updateResponse = await sql.query(query, updateValues);
        await logUpdateByTableName("events");

        const updatedEvent = updateResponse.rows[0];
        return NextResponse.json({
            event: {
                id: updatedEvent.id,
                name: updatedEvent.name,
                description: updatedEvent.description,
                startDate: updatedEvent.start_date,
                endDate: updatedEvent.end_date,
                location: updatedEvent.location,
                isActive: updatedEvent.is_active,
                createdAt: updatedEvent.created_at,
                updatedAt: updatedEvent.updated_at,
            },
        });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json(
            { message: "Failed to update event" },
            { status: 500 },
        );
    }
}

/**
 * Delete a specific event and all its associated activities and comments.
 *
 * DELETE /api/events/:eventId
 *
 * Response:
 * {
 *   message: string,
 *   deletedData: { event: Event, activities: Activity[], comments: Comment[] }
 * }
 */
export async function DELETE(_, { params }) {
    const { eventId } = params;
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
        // Check if event exists
        const eventResponse = await sql`
            SELECT * FROM events WHERE id = ${eventId}
        `;

        if (eventResponse.rows.length === 0) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 },
            );
        }

        // Get all associated data before deletion
        const [activitiesResponse, commentsResponse] = await Promise.all([
            sql`SELECT * FROM activities WHERE event_id = ${eventId}`,
            sql`
                SELECT c.* FROM comments c 
                INNER JOIN activities a ON c.activityid = a.id 
                WHERE a.event_id = ${eventId}
            `,
        ]);

        const deletedData = {
            event: {
                id: eventResponse.rows[0].id,
                name: eventResponse.rows[0].name,
                description: eventResponse.rows[0].description,
                startDate: eventResponse.rows[0].start_date,
                endDate: eventResponse.rows[0].end_date,
                location: eventResponse.rows[0].location,
                isActive: eventResponse.rows[0].is_active,
                createdAt: eventResponse.rows[0].created_at,
                updatedAt: eventResponse.rows[0].updated_at,
            },
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

        // Delete in proper order: comments -> activities -> event
        await Promise.all([
            sql`
                DELETE FROM comments 
                WHERE activityid IN (
                    SELECT id FROM activities WHERE event_id = ${eventId}
                )
            `,
            sql`DELETE FROM activities WHERE event_id = ${eventId}`,
            sql`DELETE FROM events WHERE id = ${eventId}`,
            logUpdateByTableName("comments"),
            logUpdateByTableName("activities"),
            logUpdateByTableName("events"),
        ]);

        return NextResponse.json({
            message: "Event and all associated data deleted successfully",
            deletedData,
        });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { message: "Failed to delete event" },
            { status: 500 },
        );
    }
}

import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import validatePasscode, {
    InvalidPasscodeError,
    NoPasscodeError,
} from "../../passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Deletes an event by ID.
 *
 * DELETE /api/events/:eventId
 *
 * Response:
 * {
 *   message: string
 * }
 */
export async function DELETE(_, { params }) {
    const { eventId } = params;
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

    // Fetch activity IDs
    let activityIds = [];
    try {
        const activityIdsRequest =
            await sql`SELECT id FROM activities WHERE event_id = ${eventId}`;

        activityIds = activityIdsRequest.rows.map((row) => row.id);
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to fetch activities for the event" },
            { status: 500 },
        );
    }

    console.log("got activities", activityIds);

    // Delete all comments
    if (activityIds.length) {
        console.log("Deleting comments for activities:", activityIds);
        try {
            const inserts = activityIds.map((id, index) => `$${index + 1}`);
            sql.query(
                `DELETE FROM comments WHERE activityid IN (${inserts.join(", ")})`,
                activityIds,
            );
        } catch (error) {
            return NextResponse.json(
                { message: "Failed to delete comments" },
                { status: 500 },
            );
        }
    }

    // Delete all activities
    try {
        await sql`DELETE FROM activities WHERE event_id = ${eventId}`;
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to delete activities" },
            { status: 500 },
        );
    }

    // Delete event
    try {
        await sql`DELETE FROM events WHERE id = ${eventId}`;
    } catch (error) {
        return NextResponse.json(
            { message: "Failed to delete event" },
            { status: 500 },
        );
    }

    return NextResponse.json({
        message: "Event deleted along with all linked activities and comments",
    });
}

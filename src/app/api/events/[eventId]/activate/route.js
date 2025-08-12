import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../../passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Set an event as the active event (deactivates all other events).
 *
 * POST /api/events/:eventId/activate
 *
 * Response:
 * {
 *   message: string,
 *   activeEvent: Event
 * }
 */
export async function POST(_, { params }) {
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
        const eventResponse = await sql`
            SELECT * FROM events WHERE id = ${eventId}
        `;

        if (eventResponse.rows.length === 0) {
            return NextResponse.json(
                { message: "Event not found" },
                { status: 404 },
            );
        }

        // Deactivate all events first
        await sql`UPDATE events SET is_active = false, updated_at = CURRENT_TIMESTAMP`;

        // Activate the specified event
        const activateResponse = await sql`
            UPDATE events 
            SET is_active = true, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${eventId}
            RETURNING *
        `;

        await logUpdateByTableName("events");

        const activeEvent = activateResponse.rows[0];
        return NextResponse.json({
            message: `Event "${activeEvent.name}" is now the active event`,
            activeEvent: {
                id: activeEvent.id,
                name: activeEvent.name,
                description: activeEvent.description,
                startDate: activeEvent.start_date,
                endDate: activeEvent.end_date,
                location: activeEvent.location,
                isActive: activeEvent.is_active,
                createdAt: activeEvent.created_at,
                updatedAt: activeEvent.updated_at,
            },
        });
    } catch (error) {
        console.error("Error activating event:", error);
        return NextResponse.json(
            { message: "Failed to activate event" },
            { status: 500 },
        );
    }
}

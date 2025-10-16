import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
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
        const eventsResponse = await sql`SELECT * FROM events ORDER BY id ASC`;

        const events = eventsResponse.rows.map((event) => {
            const {
                id,
                name,
                slug
            } = event;

            return {
                id,
                name,
                slug
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
 *   slug: string
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

    try {
        const {
            event
        } = await req.json();

        const { name, slug } = event;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { message: "Event name is required" },
                { status: 400 },
            );
        }

        if (!slug || slug.trim() === "") {
            return NextResponse.json(
                { message: "Event slug is required" },
                { status: 400 },
            );
        }

        // Check if an event with this name already exists
        const existingEventName = await sql`SELECT id FROM events WHERE LOWER(name) = LOWER(${name.trim()})`;

        if (existingEventName.rows.length > 0) {
            return NextResponse.json(
                { message: "An event with this name already exists" },
                { status: 400 },
            );
        }

        // Check if an event with this slug already exists
        const existingEventSlug = await sql`SELECT id FROM events WHERE LOWER(slug) = LOWER(${name.trim()})`;

        if (existingEventSlug.rows.length > 0) {
            return NextResponse.json(
                { message: "An event with this slug already exists" },
                { status: 400 },
            );
        }

        await sql.query(
            `INSERT INTO events (name, slug) VALUES ($1, $2)`, 
            [name.trim(), slug.trim()]
        );

        const response = await sql`SELECT * FROM events WHERE name = ${name.trim()}`;

        const savedEvent = {
            id: response.rows[0].id,
            name: response.rows[0].name,
            slug: response.rows[0].slug
        };

        return NextResponse.json({ event: savedEvent });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { message: "Failed to create event" },
            { status: 500 },
        );
    }
}
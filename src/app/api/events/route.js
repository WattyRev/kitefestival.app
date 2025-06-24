import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../crypto";
import logUpdateByTableName from "../logUpdate";
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from "../passcodes/validatePasscode";
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
    const eventsResponse = await sql`SELECT * FROM events ORDER BY startDate ASC`;
    const events = eventsResponse.rows.map(event => {
        const { id, title, description, startdate, enddate, isactive } = event;
        return { id, title, description, startDate: startdate, endDate: enddate, isActive: isactive };
    });
    return NextResponse.json({ events });
}

/**
 * Create a new event.
 *
 * POST /api/events
 * {
 *   title: string
 *   description: string
 *   startDate: string
 *   endDate: string
 * }
 * 
 * Response:
 * {
 *   events: Event[]
 * }
 */
export async function POST(req) {
    const { title, description = '', startDate, endDate } = await req.json();
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
    
    await Promise.all([
        sql`INSERT INTO events (id, title, description, startDate, endDate, isActive) VALUES (${id}, ${title}, ${description}, ${startDate}, ${endDate}, false)`,
        logUpdateByTableName('events')
    ]);
    
    const events = [
        { id, title, description, startDate, endDate, isActive: false },
    ];
    return NextResponse.json({ events });
}

/**
 * Set active event.
 * 
 * PATCH /api/events
 * {
 *   activeEventId: string
 * }
 * 
 * Response:
 * {}
 */
export async function PATCH(req) {
    const { activeEventId } = await req.json();
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

    await Promise.all([
        sql`UPDATE events SET isActive = false`,
        sql`UPDATE events SET isActive = true WHERE id = ${activeEventId}`,
        logUpdateByTableName('events')
    ]);
    
    return NextResponse.json({});
}

"use server";

import { sql } from "@vercel/postgres";
import validatePasscode, {
    InvalidPasscodeError,
    NoPasscodeError,
} from "./passcodes/validatePasscode";
import { cookies } from "next/headers";

const COLUMN_OPTIONS = ["id", "name", "slug", "description"];

/**
 * Retrieves all events from the database.
 *
 * @param {{ columns: string[] }} options - The columns to retrieve from the database. Defaults to all columns.
 * @returns {Promise<Object[]>} An array of objects containing the requested columns for each event.
 * @example
 * const events = await getEvents();
 * console.log(events.map((event) => event.name));
 */
export const getEvents = async ({ columns = COLUMN_OPTIONS, slug }) => {
    const validColumns = columns.filter((col) => COLUMN_OPTIONS.includes(col));
    if (!validColumns.length) {
        throw new Error("No valid columns requested");
    }
    let queryString = `SELECT ${validColumns.join(", ")} FROM events`;
    let queryArgs = [];
    if (slug) {
        queryString += ` WHERE slug = $1`;
        queryArgs.push(slug);
    }
    queryString += " ORDER BY id ASC";
    const response = await sql.query(queryString, queryArgs);

    const events = response.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
    }));

    return { events };
};

/**
 * Creates a new event in the database.
 *
 * @param {{ name: string, slug: string, description: string }} options - The event details to save to the database.
 * @returns {Promise<Object>} An object containing the saved event details.
 * @throws {Error} If no passcode is provided, or if the provided passcode is invalid, or if the event name or slug is missing, or if an event with the same name or slug already exists.
 * @example
 * const event = await createEvent({name: "Test Event", slug: "test-event", description: "This is a test event"});
 * console.log(event.event.name);
 */
export async function createEvent({ name, slug, description }) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            throw new Error("No passcode provided");
        }
        if (error instanceof InvalidPasscodeError) {
            throw new Error("Provided passcode is invalid");
        }
        throw error;
    }

    if (!name || name.trim() === "") {
        throw new Error("Event name is required");
    }

    if (!slug || slug.trim() === "") {
        throw new Error("Event slug is required");
    }

    // Check if an event with this name already exists
    const existingEventName =
        await sql`SELECT id FROM events WHERE LOWER(name) = LOWER(${name.trim()})`;

    if (existingEventName.rows.length > 0) {
        throw new Error("An event with this name already exists");
    }

    // Check if an event with this slug already exists
    const existingEventSlug =
        await sql`SELECT id FROM events WHERE LOWER(slug) = LOWER(${name.trim()})`;

    if (existingEventSlug.rows.length > 0) {
        throw new Error("An event with this slug already exists");
    }

    await sql.query(
        `INSERT INTO events (name, slug, description) VALUES ($1, $2, $3)`,
        [name.trim(), slug.trim(), description],
    );

    const response =
        await sql`SELECT * FROM events WHERE name = ${name.trim()}`;

    const savedEvent = {
        id: response.rows[0].id,
        name: response.rows[0].name,
        slug: response.rows[0].slug,
        description: response.rows[0].description || "",
    };

    return { event: savedEvent };
}

/**
 * Deletes an event along with all linked activities, comments, and logs.
 *
 * @param {string} eventId The ID of the event to delete.
 * @returns {Promise<{message: string}>}
 * @throws {Error} If the passcode is invalid or if there's an error deleting the event.
 */
export async function deleteEvent(eventId) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;
    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            throw new Error("No passcode provided");
        }
        if (error instanceof InvalidPasscodeError) {
            throw new Error("Provided passcode is invalid");
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
        throw new Error("Failed to fetch activities for the event");
    }

    // Delete all comments
    if (activityIds.length) {
        try {
            const inserts = activityIds.map((id, index) => `$${index + 1}`);
            sql.query(
                `DELETE FROM comments WHERE activityid IN (${inserts.join(", ")})`,
                activityIds,
            );
        } catch (error) {
            throw new Error("Failed to delete comments");
        }
    }

    // Delete all activities
    try {
        await sql`DELETE FROM activities WHERE event_id = ${eventId}`;
    } catch (error) {
        throw new Error("Failed to delete activities");
    }

    // Delete event
    try {
        await sql`DELETE FROM events WHERE id = ${eventId}`;
    } catch (error) {
        throw new Error("Failed to delete event");
    }

    // Delete logs
    try {
        await sql`DELETE FROM actionlog WHERE event_id = ${eventId}`;
    } catch (error) {
        throw new Error("Failed to delete logs");
    }

    return {
        message:
            "Event deleted along with all linked activities, comments, and logs",
    };
}

/**
 * Edits an event with the provided patchable keys.
 * @param {string} eventId - The ID of the event to edit.
 * @param {Object} event - The event to edit, with patchable keys.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 * @throws {Error} If no patchable keys are provided.
 * @returns {Promise<Object>} A promise that resolves to an object containing the edited event.
 */
export async function editEvent(eventId, event) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;
    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            throw new Error("No passcode provided");
        }
        if (error instanceof InvalidPasscodeError) {
            throw new Error("Provided passcode is invalid");
        }
        throw error;
    }

    const patchableKeys = ["name", "slug", "description"];

    const setStrings = patchableKeys.reduce(
        (acc, key) => {
            if (!Object.hasOwn(event, key)) {
                return acc;
            }
            let value = event[key];
            return {
                query: `${acc.query}${acc.values.length ? ", " : ""}${key} = $${acc.values.length + 1}`,
                values: [...acc.values, value],
            };
        },
        {
            query: "UPDATE events SET ",
            values: [],
        },
    );

    if (!setStrings.values.length) {
        throw new Error("No patchable keys provided");
    }

    await sql.query(
        `${setStrings.query} WHERE id = $${setStrings.values.length + 1}`,
        [...setStrings.values, eventId],
    );

    const response = await sql`SELECT * FROM events WHERE id = ${eventId}`;

    const savedEvent = {
        id: response.rows[0].id,
        name: response.rows[0].name,
        slug: response.rows[0].slug,
        description: response.rows[0].description || "",
    };

    return { event: savedEvent };
}

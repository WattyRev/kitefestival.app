import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../crypto";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Migration endpoint to update database schema for events system.
 * This creates the events table and adds event_id to activities if needed.
 *
 * POST /api/migrate
 *
 * Response:
 * {
 *   message: string,
 *   migrationResults: object
 * }
 */
export async function POST() {
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
        const migrationResults = {};

        // Step 1: Create events table if it doesn't exist
        try {
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
            migrationResults.eventsTable = "Created or verified events table";
        } catch (error) {
            migrationResults.eventsTable = `Error: ${error.message}`;
        }

        // Step 2: Add event_id column to activities if it doesn't exist
        try {
            await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS event_id VARCHAR(36)`;
            migrationResults.activitiesEventId =
                "Added event_id column to activities";
        } catch (error) {
            migrationResults.activitiesEventId = `Error or already exists: ${error.message}`;
        }

        // Step 3: Add timestamps to activities if they don't exist
        try {
            await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
            await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
            migrationResults.activitiesTimestamps =
                "Added timestamp columns to activities";
        } catch (error) {
            migrationResults.activitiesTimestamps = `Error or already exists: ${error.message}`;
        }

        // Step 4: Create a default event if no events exist and there are activities without event_id
        try {
            const eventsCount = await sql`SELECT COUNT(*) as count FROM events`;
            const activitiesWithoutEvent = await sql`
                SELECT COUNT(*) as count FROM activities WHERE event_id IS NULL
            `;

            if (
                eventsCount.rows[0].count === "0" &&
                activitiesWithoutEvent.rows[0].count > "0"
            ) {
                const defaultEventId = randomUUID();
                await sql`
                    INSERT INTO events (id, name, description, is_active, created_at, updated_at)
                    VALUES (
                        ${defaultEventId}, 
                        'Default Event', 
                        'Automatically created default event for existing activities',
                        true,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                `;

                // Associate all activities without event_id to the default event
                await sql`
                    UPDATE activities 
                    SET event_id = ${defaultEventId}, updated_at = CURRENT_TIMESTAMP 
                    WHERE event_id IS NULL
                `;

                migrationResults.defaultEvent = `Created default event and associated ${activitiesWithoutEvent.rows[0].count} activities`;
            } else if (eventsCount.rows[0].count > "0") {
                migrationResults.defaultEvent =
                    "Events already exist, no default event needed";
            } else {
                migrationResults.defaultEvent =
                    "No activities found, no default event needed";
            }
        } catch (error) {
            migrationResults.defaultEvent = `Error: ${error.message}`;
        }

        // Step 5: Add foreign key constraint if not exists
        try {
            await sql`
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'activities_event_id_fkey' 
                        AND table_name = 'activities'
                    ) THEN
                        ALTER TABLE activities 
                        ADD CONSTRAINT activities_event_id_fkey 
                        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            `;
            migrationResults.foreignKey =
                "Added or verified foreign key constraint";
        } catch (error) {
            migrationResults.foreignKey = `Error: ${error.message}`;
        }

        // Step 6: Update activities table to use JSONB for music if not already
        try {
            await sql`
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'activities' 
                        AND column_name = 'music' 
                        AND data_type != 'jsonb'
                    ) THEN
                        ALTER TABLE activities ALTER COLUMN music TYPE JSONB USING music::JSONB;
                    END IF;
                END $$;
            `;
            migrationResults.musicColumn = "Updated music column to JSONB type";
        } catch (error) {
            migrationResults.musicColumn = `Error or already JSONB: ${error.message}`;
        }

        return NextResponse.json({
            message: "Database migration completed successfully",
            migrationResults,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            {
                message: "Migration failed",
                error: error.message,
            },
            { status: 500 },
        );
    }
}

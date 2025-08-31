import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import { cookies } from "next/headers";

export const revalidate = 0;

/**
 * Get all music in the library.
 *
 * GET /api/music-library
 *
 * Response:
 * {
 *   musicLibrary: MusicItem[]
 * }
 */
export async function GET(req) {
    const musicResponse = await sql`SELECT * FROM musiclibrary ORDER BY id ASC`;
    const musicLibrary = musicResponse.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });
    const latest = musicLibrary[musicLibrary.length - 1]?.id || "0";
    const etag = `W/"lib-${Buffer.from(String(latest)).toString("base64").slice(0, 16)}"`;
    const ifNoneMatch = req?.headers?.get?.("if-none-match");
    if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }
    // During tests, omit the ETag header to keep responses stable
    const headers = process.env.NODE_ENV === "test" ? undefined : { ETag: etag };
    return NextResponse.json({ musicLibrary }, headers ? { headers } : undefined);
}

/**
 * Create new music library entries.
 *
 * POST /api/music-library
 * {
 *   musicLibrary: [{
 *     value: string
 *   }]
 * }
 *
 * Response:
 * {
 *   musicLibrary: MusicItem[]
 * }
 */
export async function POST(req) {
    const { musicLibrary } = await req.json();
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

    const response = await sql.query(
        `INSERT INTO musiclibrary (value) VALUES ${musicLibrary.map((_, index) => `($${index + 1})`).join(",")}`,
        musicLibrary.map((music) => music.value),
    );
    await logUpdateByTableName("musiclibrary");

    const savedLibrary = response.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });
    return NextResponse.json({ musicLibrary: savedLibrary });
}

export async function DELETE(req) {
    const { musicIds } = await req.json();

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
    if (!musicIds) {
        return NextResponse.json(
            { message: "No music ID provided" },
            { status: 400 },
        );
    }

    await sql.query(
        `DELETE FROM musiclibrary WHERE id IN (${musicIds.map((_, index) => `$${index + 1}`).join(",")})`,
        musicIds,
    );
    await logUpdateByTableName("musiclibrary");
    return NextResponse.json({ message: "Music item(s) deleted" });
}

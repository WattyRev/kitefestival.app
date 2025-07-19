import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Patches an existing music item with new values.
 *
 * PATCH /api/music-library/:musicId
 * {
 *   music: Partial<MusicItem>
 * }
 *
 * Response:
 * {
 *   message?: string
 * }
 */
export async function PATCH(req, { params }) {
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

    const { value } = await req.json();
    if (!value) {
        return NextResponse.json(
            { message: "No value provided" },
            { status: 400 },
        );
    }

    await sql.query("UPDATE musiclibrary SET value = $1 WHERE id = $2", [
        value,
        params.musicId,
    ]);
    await logUpdateByTableName("musiclibrary");
    return NextResponse.json({});
}

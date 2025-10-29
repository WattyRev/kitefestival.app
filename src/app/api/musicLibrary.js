"use server";

import { sql } from "@vercel/postgres";
import logUpdateByTableName from "./logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "./passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Retrieves all music library entries.
 *
 * @returns {Promise<Object>} Object containing all music library entries.
 * @example
 * {
 *   musicLibrary: [{
 *     id: number,
 *     value: string
 *   }]
 * }
 */
export async function getMusicLibrary() {
    const musicResponse = await sql`SELECT * FROM musiclibrary ORDER BY id ASC`;
    const musicLibrary = musicResponse.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });
    return { musicLibrary };
}

/**
 * Adds new music library entries.
 *
 * @param {Object[]} musicLibrary List of objects containing the music library entries to be added.
 * @property {number} id The ID of the music library entry.
 * @property {string} value The value of the music library entry.
 * @returns {Promise<Object>} Object containing the newly added music library entries.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 */
export async function addToMusicLibrary(musicLibrary) {
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
    return { musicLibrary: savedLibrary };
}

/**
 * Deletes music library entries by their IDs.
 *
 * @param {number[]} musicIds List of IDs of the music library entries to be deleted.
 * @returns {Promise<Object>} Object containing a success message.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 * @throws {Error} If no music ID is provided.
 */
export async function deleteFromMusicLibrary(musicIds) {
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
    if (!musicIds) {
        throw new Error("No music ID provided");
    }

    await sql.query(
        `DELETE FROM musiclibrary WHERE id IN (${musicIds.map((_, index) => `$${index + 1}`).join(",")})`,
        musicIds,
    );
    await logUpdateByTableName("musiclibrary");
    return { message: "Music item(s) deleted" };
}

/**
 * Edits a music library entry by its ID.
 *
 * @param {number} musicId ID of the music library entry to be edited.
 * @param {string} newValue New value for the music library entry.
 * @returns {Promise<Object>} Object containing a success message.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 * @throws {Error} If no music ID is provided.
 * @throws {Error} If no newValue is provided.
 */
export async function editMusicEntry(musicId, newValue) {
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

    if (!newValue) {
        throw new Error("No newValue provided");
    }

    if (!musicId) {
        throw new Error("No music ID provided");
    }

    await sql.query("UPDATE musiclibrary SET value = $1 WHERE id = $2", [
        newValue,
        musicId,
    ]);
    await logUpdateByTableName("musiclibrary");
    return { message: "Music item edited" };
}

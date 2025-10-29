"use server";

import { sql } from "@vercel/postgres";
import { randomUUID } from "./crypto";
import logUpdateByTableName from "./logUpdate";
import validatePasscode, {
    InvalidPasscodeError,
} from "./passcodes/validatePasscode";
import patchActivity, {
    NoPatchableKeysError,
} from "./activities/patchActivity";
import { cookies } from "next/headers";

/**
 * Retrieves all activities from the database, ordered by scheduleIndex and sortIndex.
 *
 * @returns {Promise<Object>} An object containing an array of all activities.
 * @example
 * const activities = await getActivities();
 * console.log(activities.activities.map((activity) => activity.title));
 */
export async function getActivities() {
    const activitiesResponse =
        await sql`SELECT * FROM activities ORDER BY scheduleIndex ASC, sortIndex ASC`;
    const activities = activitiesResponse.rows.map((activity) => {
        const { id, title, description, sortindex, scheduleindex, event_id } =
            activity;
        return {
            id,
            title,
            description,
            music: JSON.parse(activity.music),
            sortIndex: sortindex,
            scheduleIndex: scheduleindex,
            eventId: event_id,
        };
    });
    return { activities };
}

/**
 * Creates a new activity in the database.
 *
 * @param {{ title: string, description: string, music: string[], eventId: string }} activity The activity to be created.
 * @returns {Promise<Object>} An object containing the newly created activity.
 * @throws {Error} If no title is provided.
 * @throws {Error} If no eventId is provided.
 * @throws {Error} If the provided passcode is invalid.
 */
export async function createActivity({
    title,
    description = "",
    music = [],
    eventId,
}) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    await validatePasscode(passcode, ["editor"]);

    if (!title) {
        throw new Error("No title provided");
    }

    if (!eventId) {
        throw new Error("No eventId provided");
    }

    const id = randomUUID();
    const highestSortIndexResponse =
        await sql`SELECT (sortIndex) FROM activities WHERE sortIndex IS NOT NULL ORDER BY sortIndex DESC LIMIT 1`;
    let sortIndex;
    if (!highestSortIndexResponse.rows.length) {
        sortIndex = 0;
    } else {
        sortIndex = highestSortIndexResponse.rows[0].sortindex + 1;
    }
    await Promise.all([
        sql`INSERT INTO activities (id, title, description, music, sortIndex, scheduleIndex, event_id) VALUES (${id}, ${title}, ${description}, ${JSON.stringify(music)}, ${sortIndex}, null, ${eventId})`,
        logUpdateByTableName("activities"),
    ]);
    const activity = {
        id,
        title,
        description,
        music,
        sortIndex,
        scheduleIndex: null,
    };
    return { activity };
}

/**
 * Edits multiple activities at once.
 *
 * @param {Partial<Activity>[]} activities The activities to be edited.
 * @returns {Promise<Object>} An object containing a message indicating that the activities have been updated.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 */
export async function editActivities(activities) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    let permissionLevel = null;
    try {
        const isEditor = await validatePasscode(passcode, ["editor"]);
        permissionLevel = isEditor ? "editor" : null;
    } catch (error) {
        if (error instanceof InvalidPasscodeError) {
            const isUser = await validatePasscode(passcode, ["user"]);
            permissionLevel = isUser ? "user" : null;
        } else {
            throw error;
        }
    }

    await Promise.all(
        activities.map(async (activity) => {
            if (!activity.id) {
                return;
            }
            await Promise.all([
                patchActivity(activity.id, activity, permissionLevel),
                logUpdateByTableName("activities"),
            ]);
        }),
    );
    return { message: "Activities updated" };
}

/**
 * Deletes an activity and all related comments.
 *
 * @param {string} activityId The ID of the activity to be deleted.
 * @returns {Promise<Object>} An object containing a message indicating that the activity and related comments have been deleted.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 * @throws {Error} If no activity ID is provided.
 */
export async function deleteActivity(activityId) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    await validatePasscode(passcode, ["editor"]);

    if (!activityId) {
        throw new Error("No activity ID provided");
    }
    await Promise.all([
        sql`DELETE FROM activities WHERE id = ${activityId}`,
        sql`DELETE FROM comments WHERE activityId = ${activityId}`,
        logUpdateByTableName("activities"),
        logUpdateByTableName("comments"),
    ]);
    return { message: "Activity and related comments deleted" };
}

/**
 * Edits an activity with the provided patchable keys.
 * @param {string} activityId The ID of the activity to be edited.
 * @param {Object} activity The activity to be edited, with patchable keys.
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating that the activity has been updated.
 * @throws {Error} If no passcode is provided.
 * @throws {Error} If the provided passcode is invalid.
 * @throws {Error} If no patchable keys are provided.
 */
export async function editActivity(activityId, activity) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;
    let permissionLevel = null;
    try {
        const isEditor = await validatePasscode(passcode, ["editor"]);
        permissionLevel = isEditor ? "editor" : null;
    } catch (error) {
        if (error instanceof InvalidPasscodeError) {
            const isUser = await validatePasscode(passcode, ["user"]);
            permissionLevel = isUser ? "user" : null;
        } else {
            throw error;
        }
    }

    try {
        await Promise.all([
            patchActivity(activityId, activity, permissionLevel),
            logUpdateByTableName("activities"),
        ]);
        return { message: "Activity updated" };
    } catch (error) {
        if (error instanceof NoPatchableKeysError) {
            throw new Error(
                `No patchable keys provided for activity ${activityId}`,
            );
        }
        throw error;
    }
}

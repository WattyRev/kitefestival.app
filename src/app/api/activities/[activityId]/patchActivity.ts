import { sql } from "@vercel/postgres";
import { Activity } from "../route";

export const NoPatchableKeysError = new Error('No patchable keys were provided');

/**
 * Patch an existing activity with new values.
 *
 * @param {string} activityId
 * @param {Partial<Activity>} activity
 * @returns {Promise<Activity>}
 * @throws {NoPatchableKeysError} If no patchable keys were provided.
 */
export default async function patchActivity(activityId: string, activity: Partial<Activity>) {
    const patchableKeys = ['title', 'description', 'sortIndex', 'scheduleIndex'];

    const setStrings = patchableKeys.reduce((acc: string[], key) => {
        if (!Object.hasOwn(activity, key)) {
            return acc;
        }
        return [...acc, `${key} = ${activity[key as keyof Activity]}`];
    }, []);

    if (!setStrings.length) {
        throw NoPatchableKeysError;
    }
    const response = await sql`UPDATE activities SET ${setStrings.join(', ')} WHERE id = ${activityId}`;
    return response.rows[0];
}

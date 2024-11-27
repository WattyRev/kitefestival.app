import { sql } from "@vercel/postgres";

export const NoPatchableKeysError = new Error('No patchable keys were provided');

/**
 * Patch an existing activity with new values.
 *
 * @param {string} activityId
 * @param {Partial<Activity>} activity
 * @returns {Promise<void>}
 * @throws {NoPatchableKeysError} If no patchable keys were provided.
 */
export default async function patchActivity(activityId, activity) {
    const patchableKeys = ['title', 'description', 'sortIndex', 'scheduleIndex'];

    const setStrings = patchableKeys.reduce((acc, key) => {
        if (!Object.hasOwn(activity, key)) {
            return acc;
        }
        return [...acc, `${key} = ${activity[key]}`];
    }, []);

    if (!setStrings.length) {
        throw NoPatchableKeysError;
    }
    await sql`UPDATE activities SET ${setStrings.join(', ')} WHERE id = ${activityId}`;
}

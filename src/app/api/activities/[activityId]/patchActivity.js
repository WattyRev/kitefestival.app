import { sql } from "@vercel/postgres";

export class NoPatchableKeysError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoPatchableKeysError';
        this.message = 'No patchable keys were provided';
    }
}

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
        return {
            query: `${acc.query}${acc.values.length ? ', ' : ''}${key} = $${acc.values.length + 1}`,
            values: [...acc.values, activity[key]]
        }
    }, {
        query: 'UPDATE activities SET ',
        values: []
    });

    if (!setStrings.values.length) {
        throw new NoPatchableKeysError;
    }
    await sql.query(`${setStrings.query} WHERE id = $${setStrings.values.length + 1}`, [...setStrings.values, activityId]);
}

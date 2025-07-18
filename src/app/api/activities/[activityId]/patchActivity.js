import { sql } from "@vercel/postgres";

export class NoPatchableKeysError extends Error {
    constructor(message) {
        super(message);
        this.name = "NoPatchableKeysError";
        this.message = "No patchable keys were provided";
    }
}

export class InvalidLevelError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidLevelError";
        this.message = "No valid permission level was provided";
    }
}

/**
 * Patch an existing activity with new values.
 *
 * @param {string} activityId
 * @param {Partial<Activity>} activity
 * @param {string} permissionLevel Options: "editor", "user"
 * @returns {Promise<void>}
 * @throws {NoPatchableKeysError} If no patchable keys were provided.
 * @throws {InvalidLevelError} If an invalid permissionLevel was provided
 */
export default async function patchActivity(
    activityId,
    activity,
    permissionLevel,
) {
    const patchableKeysByLevel = {
        editor: ["title", "description", "music", "sortIndex", "scheduleIndex"],
        user: ["music"],
    };

    if (!patchableKeysByLevel[permissionLevel]?.length) {
        throw new InvalidLevelError();
    };

    const setStrings = patchableKeysByLevel[permissionLevel].reduce(
        (acc, key) => {
            if (!Object.hasOwn(activity, key)) {
                return acc;
            }
            let value = activity[key];
            if (key === "music") {
                value = JSON.stringify(value);
            }
            return {
                query: `${acc.query}${acc.values.length ? ", " : ""}${key} = $${acc.values.length + 1}`,
                values: [...acc.values, value],
            };
        },
        {
            query: "UPDATE activities SET ",
            values: [],
        },
    );

    if (!setStrings.values.length) {
        throw new NoPatchableKeysError();
    }
    await sql.query(
        `${setStrings.query} WHERE id = $${setStrings.values.length + 1}`,
        [...setStrings.values, activityId],
    );
}

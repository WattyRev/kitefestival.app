"use server";

import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import validatePasscode from "./passcodes/validatePasscode";

export const logAction = async ({
    action = "",
    eventId = null,
    activityId = null,
    commentId = null,
}) => {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value || null;

    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        return;
    }

    await sql`
        INSERT INTO actionlog (action, event_id, activity_id, comment_id, timestamp)
        VALUES (${action}, ${eventId}, ${activityId}, ${commentId}, NOW())
    `;
};

export const getLogs = async ({
    limit = 100,
    offset = 0,
    direction = "DESC",
    eventId = null,
    actionContains = null,
}) => {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value || null;

    try {
        await validatePasscode(passcode, ["editor"]);
    } catch (error) {
        return;
    }

    let queryString = `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id`;

    if (eventId || actionContains) {
        queryString += " WHERE ";
    }

    const conditions = [];
    const queryArgs = [];

    if (eventId) {
        conditions.push(`log.event_id = $${queryArgs.length + 1}`);
        queryArgs.push(eventId);
    }
    if (actionContains) {
        conditions.push(`log.action LIKE $${queryArgs.length + 1}`);
        queryArgs.push(`%${actionContains}%`);
    }

    queryString = `${queryString}${conditions.join(" AND ")} ORDER BY log.timestamp ${direction === "DESC" ? "DESC" : "ASC"} LIMIT $${queryArgs.length + 1} OFFSET $${queryArgs.length + 2}`;
    queryArgs.push(limit);
    queryArgs.push(offset);

    const response = await sql.query(queryString, queryArgs);

    const logs = response.rows.map((log) => {
        const {
            id,
            action,
            timestamp,
            eventid,
            eventname,
            activitytitle,
            activityid,
        } = log;
        return {
            id,
            action,
            timestamp: new Date(timestamp),
            eventId: eventid,
            eventName: eventname,
            activityTitle: activitytitle,
            activityId: activityid,
        };
    });

    return logs;
};

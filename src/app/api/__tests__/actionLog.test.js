import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import validatePasscode from "../passcodes/validatePasscode";
import { getLogs, logAction } from "../actionLog";

jest.mock("@vercel/postgres");
jest.mock("next/headers");
jest.mock("../passcodes/validatePasscode");

describe("actionLog", () => {
    beforeEach(() => {
        const mockCookieStore = new Map();
        mockCookieStore.set("passcode", {
            value: "valid-passcode",
        });
        cookies.mockReturnValue(mockCookieStore);

        validatePasscode.mockResolvedValue();

        sql.mockResolvedValue();
    });
    describe("logAction", () => {
        it("logs events from logged in users", async () => {
            await logAction({});

            expect(sql).toHaveBeenCalledWith(
                [
                    `
        INSERT INTO actionlog (action, event_id, activity_id, comment_id, timestamp)
        VALUES (`,
                    ", ",
                    ", ",
                    ", ",
                    `, NOW())
    `,
                ],
                "",
                null,
                null,
                null,
            );
        });
        it("does not log events from unauthenticated users", async () => {});
    });
    describe("getLogs", () => {
        beforeEach(() => {
            sql.query = jest.fn();
            sql.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        action: "Sample Action",
                        timestamp: "2024-01-01T00:00:00Z",
                        eventid: 1,
                        eventname: "Sample Event",
                        activityid: 1,
                        activitytitle: "Sample Activity",
                    },
                ],
            });
        });
        it("retrieves logs for authenticated editors", async () => {
            await getLogs({});

            expect(sql.query).toHaveBeenCalledWith(
                `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id ORDER BY log.timestamp DESC LIMIT $1 OFFSET $2`,
                [100, 0],
            );
        });
        it("does not retrieve logs for unauthenticated users", async () => {
            validatePasscode.mockRejectedValue(new Error("Invalid passcode"));

            await getLogs({});

            expect(sql.query).not.toHaveBeenCalled();
        });
        it("supports changing the page size", async () => {
            await getLogs({ limit: 50 });

            expect(sql.query).toHaveBeenCalledWith(
                `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id ORDER BY log.timestamp DESC LIMIT $1 OFFSET $2`,
                [50, 0],
            );
        });
        it("supports changing the offset", async () => {
            await getLogs({ offset: 20 });

            expect(sql.query).toHaveBeenCalledWith(
                `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id ORDER BY log.timestamp DESC LIMIT $1 OFFSET $2`,
                [100, 20],
            );
        });
        it("supports changing the sort direction", async () => {
            await getLogs({ direction: "ASC" });

            expect(sql.query).toHaveBeenCalledWith(
                `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id ORDER BY log.timestamp ASC LIMIT $1 OFFSET $2`,
                [100, 0],
            );
        });
        it("supports filtering by event ID", async () => {
            await getLogs({ eventId: 1 });

            expect(sql.query).toHaveBeenCalledWith(
                `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id WHERE log.event_id = $1 ORDER BY log.timestamp DESC LIMIT $2 OFFSET $3`,
                [1, 100, 0],
            );
        });
        it("supports filtering by action content", async () => {
            await getLogs({ actionContains: "Update" });

            expect(sql.query).toHaveBeenCalledWith(
                `SELECT 
        log.id, 
        log.action, 
        log.timestamp, 
        event.id AS eventid, 
        event.name AS eventname, 
        activity.id AS activityid,
        activity.title AS activitytitle
    FROM actionlog AS log
    LEFT JOIN events AS event on log.event_id = event.id
    LEFT JOIN activities AS activity on log.activity_id = activity.id WHERE log.action LIKE $1 ORDER BY log.timestamp DESC LIMIT $2 OFFSET $3`,
                ["%Update%", 100, 0],
            );
        });
    });
});

import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { randomUUID } from "../crypto";
import validatePasscode, {
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import {
    createActivity,
    deleteActivity,
    editActivities,
    editActivity,
    getActivities,
} from "../activities";
import patchActivity, {
    NoPatchableKeysError,
} from "../activities/patchActivity";
import logUpdateByTableName from "../logUpdate";

jest.mock("../passcodes/validatePasscode");
jest.mock("../crypto");
jest.mock("../activities/patchActivity");
jest.mock("../logUpdate");
jest.mock("next/headers");

describe("activities", () => {
    let mockGetCookie;
    beforeEach(() => {
        mockGetCookie = jest.fn().mockReturnValue({
            value: "boogers",
        });
        cookies.mockReturnValue({
            get: mockGetCookie,
        });
    });
    describe("getActivities", () => {
        it("should return a list of activities", async () => {
            sql.mockResolvedValue({
                rows: [
                    {
                        id: "1",
                        title: "boogers",
                        description: "green things",
                        music: '["song1","song2"]',
                        sortindex: 1,
                        scheduleindex: null,
                        event_id: 3,
                    },
                ],
            });
            const response = await getActivities();
            expect(response).toEqual({
                activities: [
                    {
                        id: "1",
                        title: "boogers",
                        description: "green things",
                        music: ["song1", "song2"],
                        sortIndex: 1,
                        scheduleIndex: null,
                        eventId: 3,
                    },
                ],
            });
        });
    });
    describe("createActivity", () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue();
            randomUUID.mockReturnValue("uuid");
        });
        it("throws if no title was provided", async () => {
            await expect(() =>
                createActivity({
                    description: "green things",
                }),
            ).rejects.toThrow(new Error("No title provided"));
        });
        it("inserts the activity and returns it", async () => {
            sql.mockResolvedValue({ rows: [] });
            await createActivity({
                title: "boogers",
                description: "green things",
                music: ["song1", "song2"],
                eventId: 3,
            });
            expect(sql).toHaveBeenCalledWith(
                [
                    "INSERT INTO activities (id, title, description, music, sortIndex, scheduleIndex, event_id) VALUES (",
                    ", ",
                    ", ",
                    ", ",
                    ", ",
                    ", null, ",
                    ")",
                ],
                expect.anything(),
                "boogers",
                "green things",
                '["song1","song2"]',
                0,
                3,
            );
        });

        it("sets the sort index based on what already exists in the table", async () => {
            sql.mockResolvedValue({ rows: [{ sortindex: 5 }] });
            await createActivity({
                title: "boogers",
                description: "green things",
                music: ["song1", "song2"],
                eventId: 3,
            });
            expect(sql).toHaveBeenCalledWith(
                [
                    "INSERT INTO activities (id, title, description, music, sortIndex, scheduleIndex, event_id) VALUES (",
                    ", ",
                    ", ",
                    ", ",
                    ", ",
                    ", null, ",
                    ")",
                ],
                expect.anything(),
                "boogers",
                "green things",
                '["song1","song2"]',
                6,
                3,
            );
        });
    });
    describe("editActivities", () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue(true);
            patchActivity.mockResolvedValue();
        });
        it("should throw if the provided passcode does not match the editor or user passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());

            await expect(async () => {
                try {
                    await editActivities([{ foo: "bar" }]);
                } catch (error) {
                    throw new Error(error.message);
                }
            }).rejects.toThrow(new InvalidPasscodeError());

            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
        });
        it("should call patchActivity for each activity and log the update", async () => {
            await editActivities([
                { description: "nothing" },
                { id: "1", description: "test" },
                { id: "2", sortIndex: 2 },
            ]);
            expect(patchActivity).toHaveBeenCalledTimes(2);
            expect(patchActivity).toHaveBeenCalledWith(
                "1",
                {
                    id: "1",
                    description: "test",
                },
                "editor",
            );
            expect(patchActivity).toHaveBeenCalledWith(
                "2",
                {
                    id: "2",
                    sortIndex: 2,
                },
                "editor",
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("activities");
        });
    });
    describe("deleteActivity", () => {
        it("throws if no activity ID was provided", async () => {
            mockGetCookie.mockReturnValue({ value: "editorPasscode" });
            await expect(() => deleteActivity()).rejects.toThrow(
                new Error("No activity ID provided"),
            );
            expect(validatePasscode).toHaveBeenCalledWith("editorPasscode", [
                "editor",
            ]);
        });
        it("deletes the activity from the database", async () => {
            await deleteActivity("1");
            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM activities WHERE id = ", ""],
                "1",
            );
        });
        it("logs the update to the changes table", async () => {
            await deleteActivity("1");
            expect(logUpdateByTableName).toHaveBeenCalledWith("activities");
        });
    });
    describe("editActivity", () => {
        beforeEach(() => {
            patchActivity.mockResolvedValue();
            validatePasscode.mockResolvedValue(true);
        });
        it("throws if the provided passcode does not match the editor passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());

            await expect(async () => {
                try {
                    await editActivity("1", { foo: "bar" });
                } catch (error) {
                    throw new Error(error.message);
                }
            }).rejects.toThrow(new InvalidPasscodeError());
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
        });
        it("throws if the activity did not provide any patchable keys", async () => {
            patchActivity.mockRejectedValue(new NoPatchableKeysError());

            await expect(() =>
                editActivity("1", { foo: "bar" }),
            ).rejects.toThrow(
                new Error("No patchable keys provided for activity 1"),
            );
        });
        it("patches the activity and logs the  update", async () => {
            const response = await editActivity("1", { foo: "bar" });
            expect(patchActivity).toHaveBeenCalledWith(
                "1",
                { foo: "bar" },
                "editor",
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("activities");
            expect(response).toEqual({ message: "Activity updated" });
        });
        it('sends "user" permissionLevel if the user is a user and not an editor', async () => {
            validatePasscode.mockRejectedValueOnce(new InvalidPasscodeError());
            validatePasscode.mockResolvedValueOnce(true);
            await editActivity("1", { foo: "bar" });
            expect(patchActivity).toHaveBeenCalledWith(
                "1",
                { foo: "bar" },
                "user",
            );
        });
    });
});

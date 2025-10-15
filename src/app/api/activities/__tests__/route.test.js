import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { GET, POST, PATCH } from "../route";
import { randomUUID } from "../../crypto";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import patchActivity from "../[activityId]/patchActivity";
import logUpdateByTableName from "../../logUpdate";

jest.mock("../../passcodes/validatePasscode");
jest.mock("../../crypto");
jest.mock("../[activityId]/patchActivity");
jest.mock("../../logUpdate");
jest.mock("next/headers");

describe("activities/route", () => {
    let mockGetCookie;
    beforeEach(() => {
        mockGetCookie = jest.fn().mockReturnValue({
            value: "boogers",
        });
        cookies.mockReturnValue({
            get: mockGetCookie,
        });
    });
    describe("GET", () => {
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
                    },
                ],
            });
            const response = await GET();
            expect(response).toEqual({
                data: {
                    activities: [
                        {
                            id: "1",
                            title: "boogers",
                            description: "green things",
                            music: ["song1", "song2"],
                            sortIndex: 1,
                            scheduleIndex: null,
                        },
                    ],
                },
            });
        });
    });
    describe("POST", () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue();
            randomUUID.mockReturnValue("uuid");
        });
        it("returns a 400 if no passcode was provided", async () => {
            mockGetCookie.mockReturnValue(undefined);
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                }),
            };
            const response = await POST(mockReq);
            expect(validatePasscode).toHaveBeenCalledWith(undefined, [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode does not match the editor passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                }),
            };
            const response = await POST(mockReq);
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
        it("returns a 400 if no title was provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    description: "green things",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No title provided" },
                status: 400,
            });
        });
        it("inserts the activity and returns it", async () => {
            sql.mockResolvedValue({ rows: [] });
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                    music: ["song1", "song2"],
                    eventId: 3
                }),
            };
            await POST(mockReq);
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
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                    music: ["song1", "song2"],
                    eventId: 3,
                }),
            };
            await POST(mockReq);
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
    describe("PATCH", () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue(true);
            patchActivity.mockResolvedValue();
        });
        it("should return a 400 if no passcode was provided", async () => {
            mockGetCookie.mockReturnValue(undefined);
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    activities: [{ foo: "bar" }],
                }),
            };
            const response = await PATCH(mockReq);
            expect(validatePasscode).toHaveBeenCalledWith(undefined, [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("should return a 403 if the provided passcode does not match the editor or user passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    activities: [{ foo: "bar" }],
                }),
            };
            const response = await PATCH(mockReq);
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
        it("should call patchActivity for each activity and log the update", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    activities: [
                        { description: "nothing" },
                        { id: "1", description: "test" },
                        { id: "2", sortIndex: 2 },
                    ],
                }),
            };
            await PATCH(mockReq);
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
});

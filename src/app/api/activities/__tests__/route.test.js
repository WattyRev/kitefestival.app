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

// Mock NextResponse to return a compatible response
jest.mock("next/server", () => ({
    NextResponse: {
        json: (data, options = {}) => ({
            json: async () => data,
            status: options.status || 200,
            ...data,
        }),
    },
}));

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
            // Mock the active event check and activities query
            sql.mockResolvedValueOnce({
                rows: [{ id: "event-1" }], // Active event
            }).mockResolvedValueOnce({
                rows: [
                    {
                        id: "1",
                        title: "boogers",
                        description: "green things",
                        music: '["song1","song2"]',
                        sortindex: 1,
                        scheduleindex: null,
                        event_id: "event-1",
                    },
                ],
            });

            const mockRequest = {
                url: "http://localhost:3000/api/activities",
            };

            const response = await GET(mockRequest);
            const responseData = await response.json();

            expect(responseData).toEqual({
                activities: [
                    {
                        id: "1",
                        title: "boogers",
                        description: "green things",
                        music: ["song1", "song2"],
                        sortIndex: 1,
                        scheduleIndex: null,
                        eventId: "event-1",
                    },
                ],
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
            const responseData = await response.json();
            expect(validatePasscode).toHaveBeenCalledWith(undefined, [
                "editor",
            ]);
            expect(response.status).toBe(401);
            expect(responseData).toEqual({
                message: "No passcode provided",
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
            const responseData = await response.json();
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(response.status).toBe(403);
            expect(responseData).toEqual({
                message: "Provided passcode is invalid",
            });
        });
        it("returns a 400 if no title was provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    description: "green things",
                }),
            };
            const response = await POST(mockReq);
            const responseData = await response.json();
            expect(response.status).toBe(400);
            expect(responseData).toEqual({
                message: "No title provided",
            });
        });

        it("returns a 400 if no active event and no eventId provided", async () => {
            // Mock no active event
            sql.mockResolvedValueOnce({
                rows: [], // No active event
            });

            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                }),
            };

            const response = await POST(mockReq);
            const responseData = await response.json();
            expect(response.status).toBe(400);
            expect(responseData).toEqual({
                message:
                    "No active event found. Please create an event first or specify an eventId.",
            });
        });
        it("inserts the activity and returns it", async () => {
            // Mock active event check
            sql.mockResolvedValueOnce({
                rows: [{ id: "event-1" }], // Active event
            })
                // Mock table creation
                .mockResolvedValueOnce({ rows: [] })
                // Mock column additions
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                // Mock highest sort index check
                .mockResolvedValueOnce({ rows: [] })
                // Mock activity insertion
                .mockResolvedValueOnce({ rows: [] });

            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                    music: ["song1", "song2"],
                }),
            };

            const response = await POST(mockReq);
            const responseData = await response.json();

            expect(responseData).toMatchObject({
                activities: [
                    expect.objectContaining({
                        title: "boogers",
                        description: "green things",
                        music: ["song1", "song2"],
                        sortIndex: 0,
                        scheduleIndex: null,
                        eventId: "event-1",
                    }),
                ],
            });
        });

        it("sets the sort index based on what already exists in the table", async () => {
            // Mock active event check
            sql.mockResolvedValueOnce({
                rows: [{ id: "event-1" }], // Active event
            })
                // Mock table creation
                .mockResolvedValueOnce({ rows: [] })
                // Mock column additions
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                // Mock highest sort index check (existing activity with index 5)
                .mockResolvedValueOnce({ rows: [{ sortindex: 5 }] })
                // Mock activity insertion
                .mockResolvedValueOnce({ rows: [] });

            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    title: "boogers",
                    description: "green things",
                    music: ["song1", "song2"],
                }),
            };

            const response = await POST(mockReq);
            const responseData = await response.json();

            expect(responseData).toMatchObject({
                activities: [
                    expect.objectContaining({
                        title: "boogers",
                        description: "green things",
                        music: ["song1", "song2"],
                        sortIndex: 6,
                        scheduleIndex: null,
                        eventId: "event-1",
                    }),
                ],
            });
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
            const responseData = await response.json();
            expect(validatePasscode).toHaveBeenCalledWith(undefined, [
                "editor",
            ]);
            expect(response.status).toBe(401);
            expect(responseData).toEqual({
                message: "No passcode provided",
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
            const responseData = await response.json();
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(response.status).toBe(403);
            expect(responseData).toEqual({
                message: "Provided passcode is invalid",
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
            const response = await PATCH(mockReq);
            const responseData = await response.json();

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
            expect(responseData).toEqual({});
        });
    });
});

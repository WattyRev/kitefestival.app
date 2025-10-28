import { sql } from "@vercel/postgres";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../../passcodes/validatePasscode";
import { cookies } from "next/headers";
import { DELETE, PATCH } from "../route";

jest.mock("../../../passcodes/validatePasscode");
jest.mock("next/headers");

describe("/api/events/eventId/route", () => {
    let cookieValues;
    beforeEach(() => {
        validatePasscode.mockResolvedValue();
        cookieValues = {
            passcode: "boogers",
            userId: "user id",
            userType: "editor",
            userName: "user name",
        };
        cookies.mockReturnValue({
            get: jest.fn().mockImplementation((key) => {
                return { value: cookieValues[key] };
            }),
        });
        sql.mockImplementation((values) => {
            if (values[0] === "SELECT id FROM activities WHERE event_id = ") {
                return Promise.resolve({
                    rows: [
                        {
                            id: "abc-123",
                        },
                        {
                            id: "abc-345",
                        },
                    ],
                });
            }
            return Promise.resolve();
        });

        sql.query = jest.fn().mockResolvedValue();
    });
    describe("DELETE", () => {
        it("allows an editor to delete an event", async () => {
            cookieValues.userType = "editor";

            const response = await DELETE(null, {
                params: { eventId: 1 },
            });

            expect(sql.query).toHaveBeenCalledWith(
                "DELETE FROM comments WHERE activityid IN ($1, $2)",
                ["abc-123", "abc-345"],
            );
            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM activities WHERE event_id = ", ""],
                1,
            );
            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM events WHERE id = ", ""],
                1,
            );
            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM actionlog WHERE event_id = ", ""],
                1,
            );
            expect(response).toEqual({
                data: {
                    message:
                        "Event deleted along with all linked activities, comments, and logs",
                },
            });
        });
        it("returns a 401 if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const response = await DELETE(null, {
                params: { eventId: "abc" },
            });

            expect(validatePasscode).toHaveBeenCalledWith(null, ["editor"]);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const response = await DELETE(null, {
                params: { eventId: "abc" },
            });

            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
    });

    describe("PATCH", () => {
        beforeEach(() => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT * FROM events WHERE id = ") {
                    return Promise.resolve({
                        rows: [
                            {
                                id: 1,
                                name: "Test Event",
                                slug: "test_event",
                                description: "This is a test event.",
                            },
                        ],
                    });
                }
                return Promise.resolve();
            });
        });
        it("allows an editor to update an event", async () => {
            cookieValues.userType = "editor";
            const updatedEvent = {
                name: "Updated Event Name",
                slug: "updated_slug",
                description: "Updated description",
            };
            const req = {
                json: jest.fn().mockResolvedValue({ event: updatedEvent }),
            };

            const response = await PATCH(req, { params: { eventId: 1 } });

            expect(sql.query).toHaveBeenCalledWith(
                "UPDATE events SET name = $1, slug = $2, description = $3 WHERE id = $4",
                [
                    updatedEvent.name,
                    updatedEvent.slug,
                    updatedEvent.description,
                    1,
                ],
            );

            expect(response).toEqual({
                data: {
                    event: {
                        id: 1,
                        name: "Test Event",
                        slug: "test_event",
                        description: "This is a test event.",
                    },
                },
            });
        });
    });
});

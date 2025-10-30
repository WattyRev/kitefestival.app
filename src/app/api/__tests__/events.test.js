import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import { getEvents, createEvent, deleteEvent, editEvent } from "../events";

jest.mock("../passcodes/validatePasscode");
jest.mock("next/headers");

describe("events", () => {
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
    describe("getEvents", () => {
        beforeEach(() => {
            sql.query = jest.fn();
            sql.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        name: "Event One",
                        slug: "event-one",
                        description: "The first event",
                    },
                    {
                        id: 2,
                        name: "Event Two",
                        slug: "event-two",
                        description: "The second event",
                    },
                ],
            });
        });
        it("retrieves events with all valid columns", async () => {
            const response = await getEvents({});

            expect(sql.query).toHaveBeenCalledWith(
                "SELECT id, name, slug, description FROM events ORDER BY id ASC",
                [],
            );
            expect(response).toEqual({
                events: [
                    {
                        id: 1,
                        name: "Event One",
                        slug: "event-one",
                        description: "The first event",
                    },
                    {
                        id: 2,
                        name: "Event Two",
                        slug: "event-two",
                        description: "The second event",
                    },
                ],
            });
        });
        it("retrieves events with a subset of valid columns", async () => {
            sql.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        name: "Event One",
                    },
                    {
                        id: 2,
                        name: "Event Two",
                    },
                ],
            });
            const response = await getEvents({ columns: ["id", "name"] });
            const { events } = response;

            expect(sql.query).toHaveBeenCalledWith(
                "SELECT id, name FROM events ORDER BY id ASC",
                [],
            );

            expect(events).toEqual([
                {
                    id: 1,
                    name: "Event One",
                    slug: undefined,
                    description: undefined,
                },
                {
                    id: 2,
                    name: "Event Two",
                    slug: undefined,
                    description: undefined,
                },
            ]);
        });
        it("retrieves events based on a provided slug", async () => {
            await getEvents({ slug: "event-one" });
            expect(sql.query).toHaveBeenCalledWith(
                "SELECT id, name, slug, description FROM events WHERE slug = $1 ORDER BY id ASC",
                ["event-one"],
            );
        });
        it("throws an error when no valid columns are requested", async () => {
            await expect(
                getEvents({ columns: ["invalidColumn"] }),
            ).rejects.toThrow("No valid columns requested");
        });
    });
    describe("createEvent", () => {
        let mockRequest;
        beforeEach(() => {
            sql.mockImplementation((values) => {
                if (
                    values[0] ===
                    "SELECT id FROM events WHERE LOWER(name) = LOWER("
                ) {
                    return Promise.resolve({ rows: [] });
                }
                if (
                    values[0] ===
                    "SELECT id FROM events WHERE LOWER(slug) = LOWER("
                ) {
                    return Promise.resolve({ rows: [] });
                }
                if (values[0] === "SELECT * FROM events WHERE name = ") {
                    return Promise.resolve({
                        rows: [{ id: 1, name: "Event 1", slug: "event-1" }],
                    });
                }
                return Promise.resolve({ rows: [] });
            });

            sql.query = jest.fn().mockResolvedValue();

            mockRequest = {
                name: "New Event",
                slug: "new-event",
                description: "Event description",
            };
        });
        it("allows an editor to create an event", async () => {
            cookieValues.userType = "editor";

            const response = await createEvent(mockRequest);

            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(sql.query).toHaveBeenCalledWith(
                "INSERT INTO events (name, slug, description) VALUES ($1, $2, $3)",
                ["New Event", "new-event", "Event description"],
            );
            expect(response).toEqual({
                event: {
                    id: 1,
                    name: "Event 1",
                    slug: "event-1",
                    description: "",
                },
            });
        });
        it("throws if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            await expect(() => createEvent({})).rejects.toThrow(
                new Error("No passcode provided"),
            );

            expect(validatePasscode).toHaveBeenCalledWith(null, ["editor"]);
        });
        it("throws if the provided passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            await expect(() => createEvent({})).rejects.toThrow(
                new Error("Provided passcode is invalid"),
            );

            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
            ]);
        });
        it("throws if no event name is provided", async () => {
            await expect(() =>
                createEvent({ name: "", slug: "new-event" }),
            ).rejects.toThrow(new Error("Event name is required"));
        });
        it("throws if no event slug is provided", async () => {
            await expect(() =>
                createEvent({ name: "New Event", slug: "" }),
            ).rejects.toThrow(new Error("Event slug is required"));
        });
        it("throws if an event with the same name already exists", async () => {
            sql.mockImplementation((values) => {
                if (
                    values[0] ===
                    "SELECT id FROM events WHERE LOWER(name) = LOWER("
                ) {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                if (
                    values[0] ===
                    "SELECT id FROM events WHERE LOWER(slug) = LOWER("
                ) {
                    return Promise.resolve({ rows: [] });
                }
                if (values[0] === "SELECT * FROM events WHERE name = ") {
                    return Promise.resolve({
                        rows: [{ id: 1, name: "Event 1", slug: "event-1" }],
                    });
                }
                return Promise.resolve({ rows: [] });
            });

            await expect(() => createEvent(mockRequest)).rejects.toThrow(
                new Error("An event with this name already exists"),
            );
        });
        it("throws if an event with the same slug already exists", async () => {
            sql.mockImplementation((values) => {
                if (
                    values[0] ===
                    "SELECT id FROM events WHERE LOWER(name) = LOWER("
                ) {
                    return Promise.resolve({ rows: [] });
                }
                if (
                    values[0] ===
                    "SELECT id FROM events WHERE LOWER(slug) = LOWER("
                ) {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                if (values[0] === "SELECT * FROM events WHERE name = ") {
                    return Promise.resolve({
                        rows: [{ id: 1, name: "Event 1", slug: "event-1" }],
                    });
                }
                return Promise.resolve({ rows: [] });
            });

            await expect(() => createEvent(mockRequest)).rejects.toThrow(
                new Error("An event with this slug already exists"),
            );
        });
    });
    describe("deleteEvent", () => {
        it("allows an editor to delete an event", async () => {
            cookieValues.userType = "editor";

            const response = await deleteEvent(1);

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
                message:
                    "Event deleted along with all linked activities, comments, and logs",
            });
        });
        it("throws if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            await expect(() => deleteEvent("abc")).rejects.toThrow(
                new Error("No passcode provided"),
            );

            expect(validatePasscode).toHaveBeenCalledWith(null, ["editor"]);
        });
        it("returns a 403 if the provided passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            await expect(deleteEvent("abc")).rejects.toThrow(
                new Error("Provided passcode is invalid"),
            );

            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
            ]);
        });
    });

    describe("editEvent", () => {
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

            sql.query = jest.fn().mockResolvedValue();
        });
        it("allows an editor to update an event", async () => {
            cookieValues.userType = "editor";
            const updatedEvent = {
                name: "Updated Event Name",
                slug: "updated_slug",
                description: "Updated description",
            };
            const response = await editEvent(1, updatedEvent);

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
                event: {
                    id: 1,
                    name: "Test Event",
                    slug: "test_event",
                    description: "This is a test event.",
                },
            });
        });
    });
});

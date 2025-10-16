import { sql } from "@vercel/postgres";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import { cookies } from "next/headers";
import { GET, POST } from "../route";

jest.mock("../../passcodes/validatePasscode");
jest.mock("next/headers");

describe("/api/events/route", () => {
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
    });
    describe("GET", () => {
        beforeEach(() => {
            sql.mockResolvedValue({
                rows: [
                    { id: 1, name: "Event 1", slug: "event-1" },
                    { id: 2, name: "Event 2", slug: "event-2" },
                ]
            })
        })

        it("returns all events", async () => {
            const response = await GET();
            expect(sql).toHaveBeenCalledWith`SELECT * FROM events ORDER BY id ASC`;
            expect(response).toEqual({ data: { events: [{ id: 1, name: "Event 1", slug: "event-1" }, { id: 2, name: "Event 2", slug: "event-2" }] } });
        });
        
    });

    describe('POST', () => {
        let mockRequest;
        beforeEach(() => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT id FROM events WHERE LOWER(name) = LOWER(") {
                    return Promise.resolve({ rows: [] });
                }
                if (values[0] === "SELECT id FROM events WHERE LOWER(slug) = LOWER(") {
                    return Promise.resolve({ rows: [] });
                }
                if (values[0] === "SELECT * FROM events WHERE name = ") {
                    return Promise.resolve({ rows: [{ id: 1, name: "Event 1", slug: "event-1" }] });
                }
                return Promise.resolve({ rows: [] });
            });

            sql.query = jest.fn().mockResolvedValue();

            mockRequest = {
                json: jest.fn().mockResolvedValue({
                    event: {
                        name: "New Event",
                        slug: "new-event",
                    }
                }),
            }
        })
        it('allows an editor to create an event', async () => {
            cookieValues.userType = "editor";

            const response = await POST(mockRequest);

            expect(validatePasscode).toHaveBeenCalledWith("boogers", ["editor"]);
            expect(sql.query).toHaveBeenCalledWith(
                "INSERT INTO events (name, slug) VALUES ($1, $2)",
                ["New Event", "new-event"],
            );
            expect(response).toEqual({ data: { event: { id: 1, name: "Event 1", slug: "event-1" } } });
        });
        it("returns a 401 if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const response = await POST(null, {
                params: { eventId: "abc" },
            });

            expect(validatePasscode).toHaveBeenCalledWith(null, [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const response = await POST(null, {
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
        it('returns a 400 if no event name is provided', async () => {
            mockRequest.json = jest.fn().mockResolvedValue({ event: { name: "", slug: "new-event" } });

            const response = await POST(mockRequest);

            expect(response).toEqual({
                data: { message: "Event name is required" },
                status: 400,
            });
        });
        it('returns a 400 if no event slug is provided', async () => {
            mockRequest.json = jest.fn().mockResolvedValue({ event: { name: "New Event", slug: "" } });

            const response = await POST(mockRequest);

            expect(response).toEqual({
                data: { message: "Event slug is required" },
                status: 400,
            });
        });
        it('returns a 400 if an event with the same name already exists', async () => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT id FROM events WHERE LOWER(name) = LOWER(") {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                if (values[0] === "SELECT id FROM events WHERE LOWER(slug) = LOWER(") {
                    return Promise.resolve({ rows: [] });
                }
                if (values[0] === "SELECT * FROM events WHERE name = ") {
                    return Promise.resolve({ rows: [{ id: 1, name: "Event 1", slug: "event-1" }] });
                }
                return Promise.resolve({ rows: [] });
            });

            const response = await POST(mockRequest);

            expect(response).toEqual({
                data: { message: "An event with this name already exists" },
                status: 400,
            });
        });
        it('returns a 400 if an event with the same slug already exists', async () => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT id FROM events WHERE LOWER(name) = LOWER(") {
                    return Promise.resolve({ rows: [] });
                }
                if (values[0] === "SELECT id FROM events WHERE LOWER(slug) = LOWER(") {
                    return Promise.resolve({ rows: [{ id: 1 }] });
                }
                if (values[0] === "SELECT * FROM events WHERE name = ") {
                    return Promise.resolve({ rows: [{ id: 1, name: "Event 1", slug: "event-1" }] });
                }
                return Promise.resolve({ rows: [] });
            });

            const response = await POST(mockRequest);

            expect(response).toEqual({
                data: { message: "An event with this slug already exists" },
                status: 400,
            });
        });
    })
});

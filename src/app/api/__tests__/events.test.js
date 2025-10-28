import { sql } from "@vercel/postgres";
import { getEvents } from "../events";

describe("events", () => {
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
            const events = await getEvents({});

            expect(sql.query).toHaveBeenCalledWith(
                "SELECT id, name, slug, description FROM events",
            );
            expect(events).toEqual([
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
            ]);
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
            const events = await getEvents({ columns: ["id", "name"] });

            expect(sql.query).toHaveBeenCalledWith(
                "SELECT id, name FROM events",
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
        it("throws an error when no valid columns are requested", async () => {
            await expect(
                getEvents({ columns: ["invalidColumn"] }),
            ).rejects.toThrow("No valid columns requested");
        });
    });
});

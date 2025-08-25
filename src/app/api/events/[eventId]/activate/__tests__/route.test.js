import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { POST } from "../route";
// Mock the same module path that the route uses
import validatePasscode from "../../../../passcodes/validatePasscode";
import logUpdateByTableName from "../../../../logUpdate";

jest.mock("../../../../passcodes/validatePasscode");
jest.mock("../../../../logUpdate");
jest.mock("next/headers");

jest.mock("next/server", () => ({
    NextResponse: {
        json: (data, options = {}) => ({
            json: async () => data,
            status: options.status || 200,
            ...data,
        }),
    },
}));

describe("events/[eventId]/activate", () => {
    beforeEach(() => {
        cookies.mockReturnValue({
            get: jest.fn().mockReturnValue({ value: "pc" }),
        });
        validatePasscode.mockResolvedValue(true);
    });

    it("activates the event and deactivates others", async () => {
        sql.mockResolvedValueOnce({ rows: [{ id: "e1", name: "X" }] }) // exists
            .mockResolvedValueOnce({ rows: [] }) // deactivate all
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: "e1",
                        name: "X",
                        start_date: null,
                        end_date: null,
                        description: null,
                        location: null,
                        is_active: true,
                        created_at: "",
                        updated_at: "",
                    },
                ],
            }); // activate

        const res = await POST(null, { params: { eventId: "e1" } });
        const data = await res.json();
        expect(data.activeEvent).toMatchObject({
            id: "e1",
            name: "X",
            isActive: true,
        });
        expect(logUpdateByTableName).toHaveBeenCalledWith("events");
    });
});

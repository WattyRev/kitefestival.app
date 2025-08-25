import { GET } from "../route";
import { sql } from "@vercel/postgres";

jest.mock("@vercel/postgres", () => ({ sql: jest.fn() }));
jest.mock("next/server", () => ({
    NextResponse: {
        json: (data, options = {}) => ({
            ...data,
            status: options.status || 200,
        }),
    },
}));

describe("api/test-db", () => {
    it("returns success on healthy DB", async () => {
        sql.mockResolvedValueOnce({ rows: [{ test: 1 }] });
        const res = await GET();
        expect(res).toEqual({
            success: true,
            message: "Database connection successful",
            data: [{ test: 1 }],
            status: 200,
        });
    });

    it("returns 500 on failure", async () => {
        sql.mockRejectedValueOnce(new Error("boom"));
        const res = await GET();
        expect(res.status).toBe(500);
        expect(res.success).toBe(false);
    });
});

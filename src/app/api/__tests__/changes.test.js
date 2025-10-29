import { sql } from "@vercel/postgres";
import { getChanges } from "../changes";

describe("changes/route", () => {
    describe("getChanges", () => {
        it("should return a list of changes", async () => {
            sql.mockResolvedValue({
                rows: [
                    {
                        tablename: "activities",
                        updated: "2023-01-01T00:00:00.000Z",
                    },
                ],
            });
            const response = await getChanges();
            expect(sql).toHaveBeenCalledWith(["SELECT * FROM changes"]);
            expect(response).toEqual({
                changes: [
                    {
                        tablename: "activities",
                        updated: "2023-01-01T00:00:00.000Z",
                    },
                ],
            });
        });
    });
});

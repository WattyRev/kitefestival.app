import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../logUpdate";

describe("logUpdateByTableName", () => {
    it("should update the changes table for the given tableName", async () => {
        sql.mockResolvedValue({ rowCount: 1 });
        await logUpdateByTableName("activities");
        expect(sql).toHaveBeenCalledWith(
            ["UPDATE changes SET updated = now() WHERE tablename = ", ""],
            "activities",
        );
    });
    describe("when there is no relevant row to update", () => {
        it("should insert a new row", async () => {
            sql.mockResolvedValue({ rowCount: 0 });
            await logUpdateByTableName("activities");
            expect(sql).toHaveBeenCalledWith(
                [
                    "INSERT INTO changes (tablename, updated) VALUES (",
                    ", now())",
                ],
                "activities",
            );
        });
    });
});

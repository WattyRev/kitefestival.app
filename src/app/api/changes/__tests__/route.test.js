import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { GET } from "../route";

describe('changes/route', () => {
    describe('GET', () => {
        it('should return a list of changes', async () => {
            sql.mockResolvedValue({ rows: [{
                tablename: 'activities',
                updated: '2023-01-01T00:00:00.000Z'
            }] });
            await GET();
            expect(sql).toHaveBeenCalledWith(['SELECT * FROM changes']);
            expect(NextResponse.json).toHaveBeenCalledWith({ changes: [{ tablename: 'activities', updated: '2023-01-01T00:00:00.000Z' }] });
        });
    });
});
import { sql } from "@vercel/postgres";
import getPasscodeByName from "../getPasscodeByName";

describe('getPasscodeByName', () => {
    beforeEach(() => {
        sql.mockResolvedValue({
            rows: [{ passcode: 'editor' }]
        });
    });
    it('should return a passcode', async () => {
        const passcode = await getPasscodeByName('editor');
        expect(passcode).toBe('editor');
        expect(sql).toHaveBeenCalledWith(['SELECT passcode FROM passcodes WHERE name = ', ''], 'editor');
    });
    it('should throw an error if the passcode is not found', async () => {
        sql.mockResolvedValue({
            rows: []
        });
        await expect(getPasscodeByName('editor')).rejects.toThrow('editor passcode not found');
    });
});
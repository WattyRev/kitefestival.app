import { sql } from "@vercel/postgres";
import patchActivity, { NoPatchableKeysError } from "../patchActivity";

describe('patchActivity', () => {
    beforeEach(() => {
        sql.query = jest.fn().mockResolvedValue();
    })
    it('should throw an error if no patchable keys are provided', async () => {
        await expect(() => patchActivity('1', { foo: 'bar' })).rejects.toThrow(NoPatchableKeysError);
    });

    it('should update the activity with the patchable values and not the non-patchable values', async () => {
        const activity = {
            id: '1',
            foo: 'bar',
            title: 'boogers',
            description: 'green things',
            sortIndex: 1,
            scheduleIndex: null
        };
        await patchActivity('1', activity);

        expect(sql.query).toHaveBeenCalledWith('UPDATE activities SET title = $1, description = $2, sortIndex = $3, scheduleIndex = $4 WHERE id = $5', ['boogers', 'green things', 1, null, '1']);
    });


    it('should update the activity with the patchable values provided and nothing else', async () => {
        const activity = {
            description: 'green things',
        };
        await patchActivity('1', activity);

        expect(sql.query).toHaveBeenCalledWith('UPDATE activities SET description = $1 WHERE id = $2', ['green things', '1']);
    });
});
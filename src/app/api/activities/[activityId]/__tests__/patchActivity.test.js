import { sql } from "@vercel/postgres";
import patchActivity, { NoPatchableKeysError, InvalidLevelError } from "../patchActivity";

describe("patchActivity", () => {
    beforeEach(() => {
        sql.query = jest.fn().mockResolvedValue();
    });
    it("should throw an error if no valid permission level was provided", async () => {
        await expect(() => patchActivity("1", { foo: "bar" }, 'boogers')).rejects.toThrow(
            InvalidLevelError,
        );
    });

    it("should throw an error if no patchable keys are provided", async () => {
        await expect(() => patchActivity("1", { foo: "bar" }, 'editor')).rejects.toThrow(
            NoPatchableKeysError,
        );
    });

    it("should update the activity with the patchable values and not the non-patchable values", async () => {
        const activity = {
            id: "1",
            foo: "bar",
            title: "boogers",
            description: "green things",
            music: ['song1', 'song2'],
            sortIndex: 1,
            scheduleIndex: null,
        };
        await patchActivity("1", activity, 'editor');

        expect(sql.query).toHaveBeenCalledWith(
            "UPDATE activities SET title = $1, description = $2, music = $3, sortIndex = $4, scheduleIndex = $5 WHERE id = $6",
            ["boogers", "green things", '["song1","song2"]', 1, null, "1"],
        );
    });

    it("should update the activity with the patchable values provided and nothing else", async () => {
        const activity = {
            description: "green things",
        };
        await patchActivity("1", activity, 'editor');

        expect(sql.query).toHaveBeenCalledWith(
            "UPDATE activities SET description = $1 WHERE id = $2",
            ["green things", "1"],
        );
    });

    it("should update the activity with the user patchable values and not the editor patchable values when permissionLevel is user", async () => {
        const activity = {
            id: "1",
            title: "boogers",
            description: "green things",
            music: ['song1', 'song2'],
            sortIndex: 1,
            scheduleIndex: null,
        };
        await patchActivity("1", activity, 'user');

        expect(sql.query).toHaveBeenCalledWith(
            "UPDATE activities SET music = $1 WHERE id = $2",
            ['["song1","song2"]', "1"],
        );
    });
});

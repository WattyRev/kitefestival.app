import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import {
    getMusicLibrary,
    addToMusicLibrary,
    deleteFromMusicLibrary,
    editMusicEntry,
} from "../musicLibrary";
import { randomUUID } from "../crypto";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../passcodes/validatePasscode";
import logUpdateByTableName from "../logUpdate";

jest.mock("../passcodes/validatePasscode");
jest.mock("../crypto");
jest.mock("../logUpdate");
jest.mock("next/headers");

describe("musicLibrary", () => {
    let mockGetCookie;
    beforeEach(() => {
        mockGetCookie = jest.fn().mockReturnValue({
            value: "boogers",
        });
        cookies.mockReturnValue({
            get: mockGetCookie,
        });
    });
    describe("getMusicLibrary", () => {
        it("returns the music library", async () => {
            sql.mockResolvedValue({
                rows: [
                    {
                        id: "1",
                        value: "boogers",
                    },
                ],
            });
            const response = await getMusicLibrary();
            expect(response).toEqual({
                musicLibrary: [
                    {
                        id: "1",
                        value: "boogers",
                    },
                ],
            });
            expect(sql).toHaveBeenCalledWith([
                "SELECT * FROM musiclibrary ORDER BY id ASC",
            ]);
        });
    });
    describe("addToMusicLibrary", () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue();
            randomUUID.mockReturnValue("uuid");
            sql.query = jest.fn().mockResolvedValue({
                rows: [],
            });
        });
        it("creates a new music item", async () => {
            await addToMusicLibrary([{ value: "boogers" }]);
            expect(sql.query).toHaveBeenCalledWith(
                "INSERT INTO musiclibrary (value) VALUES ($1)",
                ["boogers"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("creates multiple music items", async () => {
            sql.mockResolvedValue({ rows: [] });
            await addToMusicLibrary([
                { value: "boogers1" },
                { value: "boogers2" },
            ]);
            expect(sql.query).toHaveBeenCalledWith(
                "INSERT INTO musiclibrary (value) VALUES ($1),($2)",
                ["boogers1", "boogers2"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("throws an error if no passcode is provided", async () => {
            mockGetCookie.mockReturnValue(undefined);
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            await expect(() =>
                addToMusicLibrary([{ value: "boogers" }]),
            ).rejects.toThrow(new Error("No passcode provided"));
        });
        it("throws an error if the provided passcode does not match the editor passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());

            await expect(() =>
                addToMusicLibrary([{ value: "boogers" }]),
            ).rejects.toThrow(new Error("Provided passcode is invalid"));
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
        });
    });
    describe("deleteFromMusicLibrary", () => {
        let mockReq;
        beforeEach(() => {
            sql.query = jest.fn().mockResolvedValue();
            mockReq = ["1"];
        });
        it("deletes a single music item", async () => {
            await deleteFromMusicLibrary(mockReq);

            expect(sql.query).toHaveBeenCalledWith(
                `DELETE FROM musiclibrary WHERE id IN ($1)`,
                ["1"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("deletes multiple music items", async () => {
            await deleteFromMusicLibrary(["1", "2"]);
            expect(sql.query).toHaveBeenCalledWith(
                `DELETE FROM musiclibrary WHERE id IN ($1,$2)`,
                ["1", "2"],
            );
        });
        it("throws an error if no passcode is provided", async () => {
            mockGetCookie.mockReturnValue(undefined);
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            await expect(() => deleteFromMusicLibrary(mockReq)).rejects.toThrow(
                new Error("No passcode provided"),
            );
        });
        it("throws an error if the provided passcode does not match the editor passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            await expect(() => deleteFromMusicLibrary(mockReq)).rejects.toThrow(
                new Error("Provided passcode is invalid"),
            );
        });
    });

    describe("editMusicEntry", () => {
        beforeEach(() => {
            sql.query = jest.fn().mockResolvedValue();
        });
        it("Updates the value for the music item and logs the update", async () => {
            await editMusicEntry("1", "boogers");

            expect(sql.query).toHaveBeenCalledWith(
                "UPDATE musiclibrary SET value = $1 WHERE id = $2",
                ["boogers", "1"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("throws an error if no passcode is provided", async () => {
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            mockGetCookie.mockReturnValue(undefined);
            await expect(() => editMusicEntry("1", "boogers")).rejects.toThrow(
                new Error("No passcode provided"),
            );
        });
        it("throws an error if the provided passcode does not match the editor passcode", async () => {
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            mockGetCookie.mockReturnValue({ value: "boogers" });
            await expect(() => editMusicEntry("1", "boogers")).rejects.toThrow(
                new Error("Provided passcode is invalid"),
            );
        });
    });
});

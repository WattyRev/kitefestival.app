import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { GET, POST, DELETE } from "../route";
import { randomUUID } from "../../crypto";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import logUpdateByTableName from "../../logUpdate";

jest.mock("../../passcodes/validatePasscode");
jest.mock("../../crypto");
jest.mock("../../logUpdate");
jest.mock("next/headers");

describe("/api/music-library", () => {
    let mockGetCookie;
    beforeEach(() => {
        mockGetCookie = jest.fn().mockReturnValue({
            value: "boogers",
        });
        cookies.mockReturnValue({
            get: mockGetCookie,
        });
    });
    describe("GET", () => {
        it("returns the music library", async () => {
            sql.mockResolvedValue({
                rows: [
                    {
                        id: "1",
                        value: "boogers",
                    },
                ],
            });
            const response = await GET();
            expect(response).toEqual({
                data: {
                    musicLibrary: [
                        {
                            id: "1",
                            value: "boogers",
                        },
                    ],
                },
            });
            expect(sql).toHaveBeenCalledWith([
                "SELECT * FROM musiclibrary ORDER BY id ASC",
            ]);
        });
    });
    describe("POST", () => {
        beforeEach(() => {
            validatePasscode.mockResolvedValue();
            randomUUID.mockReturnValue("uuid");
            sql.query = jest.fn().mockResolvedValue({
                rows: [],
            });
        });
        it("creates a new music item", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    musicLibrary: [{ value: "boogers" }],
                }),
            };
            await POST(mockReq);
            expect(sql.query).toHaveBeenCalledWith(
                "INSERT INTO musiclibrary (value) VALUES ($1)",
                ["boogers"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("creates multiple music items", async () => {
            sql.mockResolvedValue({ rows: [] });
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    musicLibrary: [
                        { value: "boogers1" },
                        { value: "boogers2" },
                    ],
                }),
            };
            await POST(mockReq);
            expect(sql.query).toHaveBeenCalledWith(
                "INSERT INTO musiclibrary (value) VALUES ($1),($2)",
                ["boogers1", "boogers2"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("returns a 401 if no passcode is provided", async () => {
            mockGetCookie.mockReturnValue(undefined);
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    musicLibrary: [{ value: "boogers" }],
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode does not match the editor passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    musicLibrary: [{ value: "boogers" }],
                }),
            };
            const response = await POST(mockReq);
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
    });
    describe("DELETE", () => {
        let mockReq;
        beforeEach(() => {
            sql.query = jest.fn().mockResolvedValue();
            mockReq = {
                json: jest.fn().mockResolvedValue({
                    musicIds: ["1"],
                }),
            };
        });
        it("deletes a single music item", async () => {
            await DELETE(mockReq);

            expect(sql.query).toHaveBeenCalledWith(
                `DELETE FROM musiclibrary WHERE id IN ($1)`,
                ["1"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("deletes multiple music items", async () => {
            mockReq = {
                json: jest.fn().mockResolvedValue({
                    musicIds: ["1", "2"],
                }),
            };
            await DELETE(mockReq);
            expect(sql.query).toHaveBeenCalledWith(
                `DELETE FROM musiclibrary WHERE id IN ($1,$2)`,
                ["1", "2"],
            );
        });
        it("returns a 401 if no passcode is provided", async () => {
            mockGetCookie.mockReturnValue(undefined);
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const response = await DELETE(mockReq);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode does not match the editor passcode", async () => {
            mockGetCookie.mockReturnValue({ value: "boogers" });
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const response = await DELETE(mockReq);
            expect(validatePasscode).toHaveBeenCalledWith("boogers", [
                "editor",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
    });
});

import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../../logUpdate";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../../passcodes/validatePasscode";
import { cookies } from "next/headers";
import { PATCH } from "../route";

jest.mock("../../../passcodes/validatePasscode");
jest.mock("../../../logUpdate");
jest.mock("next/headers");

describe("/api/music-library/:musicId", () => {
    let mockGetCookie;
    beforeEach(() => {
        validatePasscode.mockResolvedValue(true);
        mockGetCookie = jest.fn().mockReturnValue({
            value: "boogers",
        });
        cookies.mockReturnValue({
            get: mockGetCookie,
        });
    });

    describe("PATCH", () => {
        beforeEach(() => {
            sql.query = jest.fn().mockResolvedValue();
        });
        it("Updates the value for the music item and logs the update", async () => {
            await PATCH(
                {
                    json: jest.fn().mockResolvedValue({ value: "boogers" }),
                },
                { params: { musicId: "1" } },
            );

            expect(sql.query).toHaveBeenCalledWith(
                "UPDATE musiclibrary SET value = $1 WHERE id = $2",
                ["boogers", "1"],
            );
            expect(logUpdateByTableName).toHaveBeenCalledWith("musiclibrary");
        });
        it("returns a 401 if no passcode is provided", async () => {
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            mockGetCookie.mockReturnValue(undefined);
            const response = await PATCH(
                {
                    json: jest
                        .fn()
                        .mockResolvedValue({ music: { value: "boogers" } }),
                },
                { params: { musicId: "1" } },
            );
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode does not match the editor passcode", async () => {
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            mockGetCookie.mockReturnValue({ value: "boogers" });
            const response = await PATCH(
                {
                    json: jest
                        .fn()
                        .mockResolvedValue({ music: { value: "boogers" } }),
                },
                { params: { musicId: "1" } },
            );
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
    });
});

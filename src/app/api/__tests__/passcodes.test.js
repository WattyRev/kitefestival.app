import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import getPasscodeByName from "../passcodes/getPasscodeByName";
import { changePasscodes, validatePasscode } from "../passcodes";
import { randomUUID } from "../crypto";

jest.mock("../passcodes/getPasscodeByName");
jest.mock("next/headers");
jest.mock("../crypto");

describe("passcodes", () => {
    let mockHasCookie;
    let mockSetCookie;
    beforeEach(() => {
        mockHasCookie = jest.fn().mockReturnValue(true);
        mockSetCookie = jest.fn();
        cookies.mockReturnValue({
            has: mockHasCookie,
            set: mockSetCookie,
        });
        randomUUID.mockReturnValue("uuid");
    });
    describe("changePasscodes", () => {
        let mockPayload;
        beforeEach(() => {
            getPasscodeByName.mockResolvedValue("admin");
            mockPayload = {
                adminPasscode: "adminNew",
                editorPasscode: "boogers",
                userPasscode: "abcd",
                authentication: "admin",
            };
        });
        it("changes the provided passcodes", async () => {
            const response = await changePasscodes(mockPayload);
            expect(sql).toHaveBeenCalledTimes(3);
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'admin'"],
                "adminNew",
            );
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'editor'"],
                "boogers",
            );
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'user'"],
                "abcd",
            );
            expect(response).toEqual({
                message: "Admin, Editor, User passcodes have been updated",
            });
        });
        it("throws an error if no authentication is provided", async () => {
            await expect(() =>
                changePasscodes({ ...mockPayload, authentication: null }),
            ).rejects.toThrow(new Error("No authentication provided"));
        });
        it("throws an error if the provided authentication does not match the admin passcode", async () => {
            await expect(() =>
                changePasscodes({
                    ...mockPayload,
                    authentication: "not-admin",
                }),
            ).rejects.toThrow(new Error("Provided authentication is invalid"));
        });
        it("only updates the admin passcode if that is all that was provided", async () => {
            const response = await changePasscodes({
                adminPasscode: "adminNew",
                authentication: "admin",
            });
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'admin'"],
                "adminNew",
            );
            expect(sql).toHaveBeenCalledTimes(1);
            expect(response).toEqual({
                message: "Admin passcode has been updated",
            });
        });
        it("only updates the editor passcode if that is all that was provided", async () => {
            const response = await changePasscodes({
                editorPasscode: "boogers",
                authentication: "admin",
            });
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'editor'"],
                "boogers",
            );
            expect(sql).toHaveBeenCalledTimes(1);
            expect(response).toEqual({
                message: "Editor passcode has been updated",
            });
        });
        it("only updates the user passcode if that is all that was provided", async () => {
            const response = await changePasscodes({
                userPasscode: "abcd",
                authentication: "admin",
            });
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'user'"],
                "abcd",
            );
            expect(sql).toHaveBeenCalledTimes(1);
            expect(response).toEqual({
                message: "User passcode has been updated",
            });
        });
    });
    describe("validatePasscode", () => {
        beforeEach(() => {
            getPasscodeByName.mockImplementation((userType) => {
                if (userType === "editor") {
                    return "boogers";
                }
                if (userType === "user") {
                    return "abcd";
                }
            });
        });
        it("returns editor userType if editor passcode is provided", async () => {
            const response = await validatePasscode("boogers");
            expect(response).toEqual({ userType: "editor" });
        });
        it("returns user userType if user passcode is provided", async () => {
            const response = await validatePasscode("abcd");
            expect(response).toEqual({ userType: "user" });
        });
        it("returns a 400 if no passcode was provided", async () => {
            await expect(() => validatePasscode()).rejects.toThrow(
                new Error("No passcode provided"),
            );
        });
        it("returns a 401 if the passcode does not match a user type", async () => {
            await expect(() => validatePasscode("nothing")).rejects.toThrow(
                new Error("Invalid passcode"),
            );
        });
        it("sets a userId cookie if one does not exist", async () => {
            mockHasCookie.mockReturnValue(false);
            await validatePasscode("boogers");
            expect(mockSetCookie).toHaveBeenCalledWith("userId", "uuid", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("sets a userName cookie if a name is provided", async () => {
            await validatePasscode("boogers", "Stubby");
            expect(mockSetCookie).toHaveBeenCalledWith("userName", "Stubby", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("sets a passcode cookie if the passcode was valid", async () => {
            await validatePasscode("boogers");
            expect(mockSetCookie).toHaveBeenCalledWith("passcode", "boogers", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("does not set a passcode cookie if the passcode was not valid", async () => {
            await validatePasscode("nothing").catch(() => {});
            expect(mockSetCookie).not.toHaveBeenCalledWith(
                "passcode",
                "boogers",
                {
                    expires: expect.any(Date),
                    sameSite: "strict",
                    secure: true,
                },
            );
        });
        it("sets a userType to editor if the passcode validated as an editor", async () => {
            await validatePasscode("boogers");
            expect(mockSetCookie).toHaveBeenCalledWith("userType", "editor", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("sets a userType to user if the passcode validated as a user", async () => {
            await validatePasscode("abcd");
            expect(mockSetCookie).toHaveBeenCalledWith("userType", "user", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
    });
});

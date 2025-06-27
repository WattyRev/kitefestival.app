import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import getPasscodeByName from "../getPasscodeByName";
import { PUT, POST } from "../route";
import { randomUUID } from "../../crypto";

jest.mock("../getPasscodeByName");
jest.mock("next/headers");
jest.mock("../../crypto");

describe("passcodes/route", () => {
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
    describe("PUT", () => {
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
            const mockReq = {
                json: jest.fn().mockResolvedValue(mockPayload),
            };
            const response = await PUT(mockReq);
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
                data: {
                    message: "Admin, Editor, User passcodes have been updated",
                },
            });
        });
        it("returns a 401 if no authentication is provided", async () => {
            const mockReq = {
                json: jest
                    .fn()
                    .mockResolvedValue({ mockPayload, authentication: null }),
            };
            const response = await PUT(mockReq);
            expect(response).toEqual({
                data: { message: "No authentication provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided authentication does not match the admin passcode", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    mockPayload,
                    authentication: "not-admin",
                }),
            };
            const response = await PUT(mockReq);
            expect(response).toEqual({
                data: { message: "Provided authentication is invalid" },
                status: 403,
            });
        });
        it("only updates the admin passcode if that is all that was provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    adminPasscode: "adminNew",
                    authentication: "admin",
                }),
            };
            const response = await PUT(mockReq);
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'admin'"],
                "adminNew",
            );
            expect(sql).toHaveBeenCalledTimes(1);
            expect(response).toEqual({
                data: { message: "Admin passcode has been updated" },
            });
        });
        it("only updates the editor passcode if that is all that was provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    editorPasscode: "boogers",
                    authentication: "admin",
                }),
            };
            const response = await PUT(mockReq);
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'editor'"],
                "boogers",
            );
            expect(sql).toHaveBeenCalledTimes(1);
            expect(response).toEqual({
                data: { message: "Editor passcode has been updated" },
            });
        });
        it("only updates the user passcode if that is all that was provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    userPasscode: "abcd",
                    authentication: "admin",
                }),
            };
            const response = await PUT(mockReq);
            expect(sql).toHaveBeenCalledWith(
                ["UPDATE passcodes SET passcode = ", " WHERE name = 'user'"],
                "abcd",
            );
            expect(sql).toHaveBeenCalledTimes(1);
            expect(response).toEqual({
                data: { message: "User passcode has been updated" },
            });
        });
    });
    describe("POST", () => {
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
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "boogers",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({ data: { userType: "editor" } });
        });
        it("returns user userType if user passcode is provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "abcd",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({ data: { userType: "user" } });
        });
        it("returns a 400 if no passcode was provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({}),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 400,
            });
        });
        it("returns a 401 if the passcode does not match a user type", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "nothing",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "Invalid passcode" },
                status: 401,
            });
        });
        it("sets a userId cookie if one does not exist", async () => {
            mockHasCookie.mockReturnValue(false);
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "boogers",
                }),
            };
            await POST(mockReq);
            expect(mockSetCookie).toHaveBeenCalledWith("userId", "uuid", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("sets a userName cookie if a name is provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "boogers",
                    name: "Stubby",
                }),
            };
            await POST(mockReq);
            expect(mockSetCookie).toHaveBeenCalledWith("userName", "Stubby", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("sets a passcode cookie if the passcode was valid", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "boogers",
                }),
            };
            await POST(mockReq);
            expect(mockSetCookie).toHaveBeenCalledWith("passcode", "boogers", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("does not set a passcode cookie if the passcode was not valid", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "nothing",
                }),
            };
            await POST(mockReq);
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
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "boogers",
                }),
            };
            await POST(mockReq);
            expect(mockSetCookie).toHaveBeenCalledWith("userType", "editor", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
        it("sets a userType to user if the passcode validated as a user", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    passcode: "abcd",
                }),
            };
            await POST(mockReq);
            expect(mockSetCookie).toHaveBeenCalledWith("userType", "user", {
                expires: expect.any(Date),
                sameSite: "strict",
                secure: true,
            });
        });
    });
});

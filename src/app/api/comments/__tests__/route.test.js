import { cookies } from "next/headers";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../../crypto";
import { GET, POST } from "../route";

jest.mock("../../passcodes/validatePasscode");
jest.mock("../../crypto");
jest.mock("../../logUpdate");
jest.mock("next/headers");

describe("api/comments/route", () => {
    let cookieValues;
    beforeEach(() => {
        validatePasscode.mockResolvedValue();
        cookieValues = {
            passcode: "boogers",
            userId: "user id",
            userType: "editor",
            userName: "user name",
        };
        cookies.mockReturnValue({
            get: jest.fn().mockImplementation((key) => {
                return { value: cookieValues[key] };
            }),
        });
        randomUUID.mockReturnValue("uuid");
    });
    describe("GET", () => {
        it("should return a list of comments", async () => {
            sql.mockResolvedValue({
                rows: [
                    {
                        id: "1",
                        message: "boogers",
                        activityid: "1",
                        userid: "1",
                        username: "boogers",
                        createtime: "2023-01-01T00:00:00.000Z",
                        edited: false,
                    },
                    {
                        id: "2",
                        message: "boogers",
                        activityid: "1",
                        userid: "1",
                        username: "boogers",
                        createtime: "2023-01-01T00:00:00.000Z",
                        edited: false,
                    },
                ],
            });

            const response = await GET();
            expect(sql).toHaveBeenCalledWith([
                "SELECT * FROM comments ORDER BY createtime ASC",
            ]);
            expect(response).toEqual({
                data: {
                    comments: [
                        {
                            id: "1",
                            message: "boogers",
                            activityId: "1",
                            userId: "1",
                            userName: "boogers",
                            createTime: "2023-01-01T00:00:00.000Z",
                            edited: false,
                        },
                        {
                            id: "2",
                            message: "boogers",
                            activityId: "1",
                            userId: "1",
                            userName: "boogers",
                            createTime: "2023-01-01T00:00:00.000Z",
                            edited: false,
                        },
                    ],
                },
            });
        });
        it("should return a 401 if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const response = await GET();
            expect(sql).not.toHaveBeenCalledWith([
                "SELECT * FROM comments ORDER BY createtime ASC",
            ]);
            expect(validatePasscode).toHaveBeenCalledWith(null, [
                "editor",
                "user",
            ]);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("should return a 403 if the passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const response = await GET();
            expect(sql).not.toHaveBeenCalledWith([
                "SELECT * FROM comments ORDER BY createtime ASC",
            ]);
            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
                "user",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
    });
    describe("POST", () => {
        beforeEach(() => {
            sql.mockResolvedValue({
                rows: [
                    {
                        id: "1",
                        message: "boogers",
                        activityid: "2",
                        userid: "3",
                        username: "boogers",
                        createtime: "2023-01-01T00:00:00.000Z",
                        edited: false,
                    },
                ],
            });
        });
        it("should create a new comment", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    message: "booger message",
                    activityId: "2",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: {
                    comments: [
                        {
                            id: "1",
                            message: "boogers",
                            activityId: "2",
                            userId: "3",
                            userName: "boogers",
                            createTime: "2023-01-01T00:00:00.000Z",
                            edited: false,
                        },
                    ],
                },
            });
            expect(sql).toHaveBeenCalledWith(
                [
                    "INSERT INTO comments (id, message, activityid, userid, username, createtime) VALUES (",
                    ", ",
                    ", ",
                    ", ",
                    ", ",
                    ", now())",
                ],
                "uuid",
                "booger message",
                "2",
                "user id",
                "user name",
            );
        });
        it("should return a 401 if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    message: "booger message",
                    activityId: "2",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
            expect(validatePasscode).toHaveBeenCalledWith(null, [
                "editor",
                "user",
            ]);
        });
        it("should return a 403 if the passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    message: "booger message",
                    activityId: "2",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
                "user",
            ]);
        });
        it("should return a 400 if no userId is set", async () => {
            cookieValues.userId = null;
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    message: "booger message",
                    activityId: "2",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No user ID or name set" },
                status: 400,
            });
        });
        it("should return a 400 if no userName is set", async () => {
            cookieValues.userName = null;
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    message: "booger message",
                    activityId: "2",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No user ID or name set" },
                status: 400,
            });
        });
        it("should return a 400 if no message is set", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    activityId: "2",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No message provided" },
                status: 400,
            });
        });
        it("should return a 400 if no activityId is set", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    message: "booger message",
                }),
            };
            const response = await POST(mockReq);
            expect(response).toEqual({
                data: { message: "No activityId provided" },
                status: 400,
            });
        });
    });
});

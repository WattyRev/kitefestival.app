import { sql } from "@vercel/postgres";
import validatePasscode, {
    NoPasscodeError,
    InvalidPasscodeError,
} from "../../../passcodes/validatePasscode";
import { cookies } from "next/headers";
import { DELETE, PATCH } from "../route";

jest.mock("../../../passcodes/validatePasscode");
jest.mock("../../../logUpdate");
jest.mock("next/headers");

describe("/api/comments/commentId/route", () => {
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
        sql.mockImplementation((values) => {
            if (values[0] === "SELECT * FROM comments WHERE id = ") {
                return Promise.resolve({
                    rows: [
                        {
                            userid: "user id",
                        },
                    ],
                });
            }
            return Promise.resolve();
        });
    });
    describe("DELETE", () => {
        it("allows an editor to delete a comment", async () => {
            cookieValues.userType = "editor";

            const response = await DELETE(null, {
                params: { commentId: "abc" },
            });

            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM comments WHERE id = ", ""],
                "abc",
            );
            expect(response).toEqual({ data: { message: "Comment deleted" } });
        });
        it("allows a comment author to delete a comment", async () => {
            cookieValues.userType = "user";

            const response = await DELETE(null, {
                params: { commentId: "abc" },
            });

            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM comments WHERE id = ", ""],
                "abc",
            );
            expect(response).toEqual({ data: { message: "Comment deleted" } });
        });
        it("returns a 401 if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const response = await DELETE(null, {
                params: { commentId: "abc" },
            });

            expect(validatePasscode).toHaveBeenCalledWith(null, [
                "editor",
                "user",
            ]);
            expect(response).toEqual({
                data: { message: "No passcode provided" },
                status: 401,
            });
        });
        it("returns a 403 if the provided passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const response = await DELETE(null, {
                params: { commentId: "abc" },
            });

            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
                "user",
            ]);
            expect(response).toEqual({
                data: { message: "Provided passcode is invalid" },
                status: 403,
            });
        });
        it("returns a 403 if the user is not the comment author", async () => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT * FROM comments WHERE id = ") {
                    return Promise.resolve({
                        rows: [
                            {
                                userid: "not user id",
                            },
                        ],
                    });
                }
                return Promise.resolve();
            });
            cookieValues.userType = "user";

            const response = await DELETE(null, {
                params: { commentId: "abc" },
            });

            expect(response).toEqual({
                data: {
                    message: "You are not authorized to delete this comment",
                },
                status: 403,
            });
        });
    });
    describe("PATCH", () => {
        it("allows a comment creator to edit a comment", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    comment: {
                        message: "updated message",
                    },
                }),
            };
            const mockOptions = {
                params: {
                    commentId: "abc-comment-id",
                },
            };

            const response = await PATCH(mockReq, mockOptions);

            expect(sql).toHaveBeenCalledWith(
                [
                    "UPDATE comments SET message = ",
                    ", edited = true, userName = ",
                    " WHERE id = ",
                    "",
                ],
                "updated message",
                "user name",
                "abc-comment-id",
            );
            expect(response).toEqual({ data: {} });
        });
        it("returns a 400 if there is no userName cookie", async () => {
            cookieValues.userName = null;
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    comment: {
                        message: "updated message",
                    },
                }),
            };
            const mockOptions = {
                params: {
                    commentId: "abc-comment-id",
                },
            };

            const response = await PATCH(mockReq, mockOptions);

            expect(sql).not.toHaveBeenCalledWith(
                [
                    "UPDATE comments SET message = ",
                    ", edited = true, userName = ",
                    " WHERE id = ",
                    "",
                ],
                "updated message",
                "user name",
                "abc-comment-id",
            );
            expect(response).toEqual({
                data: { message: "No user name set" },
                status: 400,
            });
        });
        it("returns a 400 is no message is provided", async () => {
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    comment: {},
                }),
            };
            const mockOptions = {
                params: {
                    commentId: "abc-comment-id",
                },
            };

            const response = await PATCH(mockReq, mockOptions);

            expect(sql).not.toHaveBeenCalledWith(
                [
                    "UPDATE comments SET message = ",
                    ", edited = true, userName = ",
                    " WHERE id = ",
                    "",
                ],
                "updated message",
                "user name",
                "abc-comment-id",
            );
            expect(response).toEqual({
                data: { message: "No message provided" },
                status: 400,
            });
        });
        it("returns a 401 if no passcode is provided", async () => {
            cookieValues.passcode = null;
            validatePasscode.mockRejectedValue(new NoPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    comment: {
                        message: "updated message",
                    },
                }),
            };
            const mockOptions = {
                params: {
                    commentId: "abc-comment-id",
                },
            };

            const response = await PATCH(mockReq, mockOptions);

            expect(sql).not.toHaveBeenCalledWith(
                [
                    "UPDATE comments SET message = ",
                    ", edited = true, userName = ",
                    " WHERE id = ",
                    "",
                ],
                "updated message",
                "user name",
                "abc-comment-id",
            );
            expect(response).toEqual({
                data: {
                    message: "No passcode provided",
                },
                status: 401,
            });
            expect(validatePasscode).toHaveBeenCalledWith(null, [
                "editor",
                "user",
            ]);
        });
        it("returns a 403 if the provided passcode is invalid", async () => {
            cookieValues.passcode = "invalid";
            validatePasscode.mockRejectedValue(new InvalidPasscodeError());
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    comment: {
                        message: "updated message",
                    },
                }),
            };
            const mockOptions = {
                params: {
                    commentId: "abc-comment-id",
                },
            };

            const response = await PATCH(mockReq, mockOptions);

            expect(sql).not.toHaveBeenCalledWith(
                [
                    "UPDATE comments SET message = ",
                    ", edited = true, userName = ",
                    " WHERE id = ",
                    "",
                ],
                "updated message",
                "user name",
                "abc-comment-id",
            );
            expect(response).toEqual({
                data: {
                    message: "Provided passcode is invalid",
                },
                status: 403,
            });
            expect(validatePasscode).toHaveBeenCalledWith("invalid", [
                "editor",
                "user",
            ]);
        });
        it("returns a 403 if the user is not the comment author", async () => {
            cookieValues.userId = "different-user-id";
            const mockReq = {
                json: jest.fn().mockResolvedValue({
                    comment: {
                        message: "updated message",
                    },
                }),
            };
            const mockOptions = {
                params: {
                    commentId: "abc-comment-id",
                },
            };

            const response = await PATCH(mockReq, mockOptions);

            expect(sql).not.toHaveBeenCalledWith(
                [
                    "UPDATE comments SET message = ",
                    ", edited = true, userName = ",
                    " WHERE id = ",
                    "",
                ],
                "updated message",
                "user name",
                "abc-comment-id",
            );
            expect(response).toEqual({
                data: {
                    message: "You are not authorized to edit this comment",
                },
                status: 403,
            });
        });
    });
});

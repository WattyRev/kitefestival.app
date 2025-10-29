import { sql } from "@vercel/postgres";
import validatePasscode from "../passcodes/validatePasscode";
import { cookies } from "next/headers";
import { randomUUID } from "../crypto";
import {
    createComment,
    deleteComment,
    editComment,
    getComments,
} from "../comments";

jest.mock("@vercel/postgres");
jest.mock("../passcodes/validatePasscode");
jest.mock("next/headers");
jest.mock("../crypto");
jest.mock("../logUpdate");

describe("comments", () => {
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
    describe("getComments", () => {
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

            const response = await getComments();
            expect(sql).toHaveBeenCalledWith([
                "SELECT * FROM comments ORDER BY createtime ASC",
            ]);
            expect(response).toEqual({
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
            });
        });
    });
    describe("createComment", () => {
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
            const response = await createComment({
                message: "booger message",
                activityId: "2",
            });
            expect(response).toEqual({
                comment: {
                    id: "1",
                    message: "boogers",
                    activityId: "2",
                    userId: "3",
                    userName: "boogers",
                    createTime: "2023-01-01T00:00:00.000Z",
                    edited: false,
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
        it("throw if no userId is set", async () => {
            cookieValues.userId = null;
            await expect(() =>
                createComment({
                    message: "booger message",
                    activityId: "2",
                }),
            ).rejects.toThrow("No user ID or name set");
        });
        it("should throw if no userName is set", async () => {
            cookieValues.userName = null;
            await expect(() =>
                createComment({
                    message: "booger message",
                    activityId: "2",
                }),
            ).rejects.toThrow("No user ID or name set");
        });
        it("should throw if no message is set", async () => {
            await expect(() =>
                createComment({
                    activityId: "2",
                }),
            ).rejects.toThrow("No message provided");
        });
        it("should throw if no activityId is set", async () => {
            await expect(() =>
                createComment({
                    message: "booger message",
                }),
            ).rejects.toThrow("No activityId provided");
        });
    });
    describe("deleteComment", () => {
        beforeEach(() => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT * FROM comments WHERE id = ") {
                    return Promise.resolve({
                        rows: [
                            {
                                id: "abc",
                                activityid: "activity id",
                                username: "user name",
                                createtime: "2023-01-01T00:00:00.000Z",
                                edited: false,
                                message: "message",
                                userid: "user id",
                            },
                        ],
                        rowCount: 1,
                    });
                }
                return Promise.resolve();
            });
        });
        it("allows an editor to delete a comment", async () => {
            cookieValues.userType = "editor";

            const response = await deleteComment("abc");

            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM comments WHERE id = ", ""],
                "abc",
            );
            expect(response).toEqual({ message: "Comment deleted" });
        });
        it("allows a comment author to delete a comment", async () => {
            cookieValues.userType = "user";

            const response = await deleteComment("abc");

            expect(sql).toHaveBeenCalledWith(
                ["DELETE FROM comments WHERE id = ", ""],
                "abc",
            );
            expect(response).toEqual({ message: "Comment deleted" });
        });
        it("throws if the user is not the comment author", async () => {
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

            await expect(() => deleteComment("abc")).rejects.toThrow(
                "You are not authorized to delete this comment",
            );
        });
    });
    describe("editComment", () => {
        beforeEach(() => {
            sql.mockImplementation((values) => {
                if (values[0] === "SELECT * FROM comments WHERE id = ") {
                    return Promise.resolve({
                        rows: [
                            {
                                id: "abc",
                                activityid: "activity id",
                                username: "user name",
                                createtime: "2023-01-01T00:00:00.000Z",
                                edited: false,
                                message: "message",
                                userid: "user id",
                            },
                        ],
                        rowCount: 1,
                    });
                }
                return Promise.resolve();
            });
        });
        it("allows a comment creator to edit a comment", async () => {
            const response = await editComment("abc-comment-id", {
                message: "updated message",
            });

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
            expect(response).toEqual({
                comment: {
                    id: "abc",
                    activityId: "activity id",
                    userName: "user name",
                    createTime: "2023-01-01T00:00:00.000Z",
                    edited: false,
                    message: "message",
                    userId: "user id",
                },
            });
        });
        it("throws if there is no userName cookie", async () => {
            cookieValues.userName = null;

            await expect(() =>
                editComment("abc-comment-id", {
                    message: "updated message",
                }),
            ).rejects.toThrow("No user name set");

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
        });
        it("throws if no message is provided", async () => {
            await expect(() =>
                editComment("abc-comment-id", {
                    comment: {},
                }),
            ).rejects.toThrow("No message provided");

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
        });
        it("throws if the user is not the comment author", async () => {
            cookieValues.userId = "different-user-id";

            await expect(() =>
                editComment("abc-comment-id", {
                    message: "updated message",
                }),
            ).rejects.toThrow("You are not authorized to edit this comment");
        });
    });
});

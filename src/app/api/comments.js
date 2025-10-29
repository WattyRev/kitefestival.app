"use server";

import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";
import validatePasscode from "./passcodes/validatePasscode";
import { randomUUID } from "./crypto";
import logUpdateByTableName from "./logUpdate";

/**
 * Retrieves a list of all comments.
 *
 * The comments are returned in the order they were created.
 *
 * The function requires a valid passcode to be provided in the "passcode" cookie.
 * The passcode must be valid for either the "editor" or "user" roles.
 *
 * @returns {comments: Array<Comment>}
 * @throws {InvalidPasscodeError} if the provided passcode is invalid
 * @throws {NoPasscodeError} if no passcode is provided
 */
export async function getComments() {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    await validatePasscode(passcode, ["editor", "user"]);

    const commentsResponse =
        await sql`SELECT * FROM comments ORDER BY createtime ASC`;
    const comments = commentsResponse.rows.map((comment) => {
        const {
            id,
            message,
            activityid,
            userid,
            username,
            createtime,
            edited,
        } = comment;
        return {
            id,
            message,
            activityId: activityid,
            userId: userid,
            userName: username,
            createTime: createtime,
            edited,
        };
    });
    return { comments };
}

/**
 * Creates a new comment with the given message and activity ID.
 *
 * The comment is created with the user ID and name associated with the request.
 * The comment is created with the current time as the create time.
 * The comment is inserted into the database in the order it was created.
 *
 * The function requires a valid passcode to be provided in the "passcode" cookie.
 * The passcode must be valid for either the "editor" or "user" roles.
 *
 * @param {Object} req.body - The request body.
 * @param {string} req.body.message - The message of the comment.
 * @param {string} req.body.activityId - The ID of the activity associated with the comment.
 * @returns {comment: Comment} - The newly created comment.
 * @throws {InvalidPasscodeError} if the provided passcode is invalid.
 * @throws {NoPasscodeError} if no passcode is provided.
 * @throws {Error} if no message or activity ID is provided.
 */
export async function createComment({ message, activityId }) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    await validatePasscode(passcode, ["editor", "user"]);

    const userId = cookieStore.get("userId")?.value;
    const userName = cookieStore.get("userName")?.value;

    if (!userId || !userName) {
        throw new Error("No user ID or name set");
    }

    if (!message) {
        throw new Error("No message provided");
    }
    if (!activityId) {
        throw new Error("No activityId provided");
    }

    const id = randomUUID();

    await Promise.all([
        sql`INSERT INTO comments (id, message, activityid, userid, username, createtime) VALUES (${id}, ${message}, ${activityId}, ${userId}, ${userName}, now())`,
        logUpdateByTableName("comments"),
    ]);

    const commentResponse = await sql`SELECT * FROM comments WHERE id = ${id}`;
    const rawComment = commentResponse.rows[0];
    const comment = {
        id: rawComment.id,
        message: rawComment.message,
        activityId: rawComment.activityid,
        userId: rawComment.userid,
        userName: rawComment.username,
        createTime: rawComment.createtime,
        edited: rawComment.edited,
    };
    return { comment };
}

/**
 * Deletes a comment by ID.
 *
 * The function requires a valid passcode to be provided in the "passcode" cookie.
 * The passcode must be valid for either the "editor" or "user" roles.
 *
 * If the user is not the comment author, an error is thrown.
 *
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<{message: string}>}
 * @throws {Error} If the passcode is invalid or if there's an error deleting the comment.
 */
export async function deleteComment(commentId) {
    const cookieStore = cookies();
    const passcode = cookieStore.get("passcode")?.value;

    await validatePasscode(passcode, ["editor", "user"]);

    if (cookieStore.get("userType")?.value === "user") {
        const userId = cookieStore.get("userId")?.value;
        const commentResponse =
            await sql`SELECT * FROM comments WHERE id = ${commentId}`;
        const comment = commentResponse.rows[0];
        if (comment.userid !== userId) {
            throw new Error("You are not authorized to delete this comment");
        }
    }
    await Promise.all([
        sql`DELETE FROM comments WHERE id = ${commentId}`,
        logUpdateByTableName("comments"),
    ]);
    return { message: "Comment deleted" };
}

/**
 * Edits a comment with the given message and ID.
 *
 * The function requires a valid passcode to be provided in the "passcode" cookie.
 * The passcode must be valid for either the "editor" or "user" roles.
 *
 * If the user is not the comment author, an error is thrown.
 *
 * @param {string} commentId - The ID of the comment to edit.
 * @param {Object} comment - The comment to edit.
 * @returns {Promise<{comment: Comment}>}
 * @throws {Error} If the passcode is invalid or if there's an error editing the comment.
 */
export async function editComment(commentId, comment) {
    if (!comment?.message) {
        throw new Error("No message provided");
    }
    if (!commentId) {
        throw new Error("No comment ID provided");
    }

    const cookieStore = cookies();
    const userName = cookieStore.get("userName")?.value;
    if (!userName) {
        throw new Error("No user name set");
    }

    const passcode = cookieStore.get("passcode")?.value;

    await validatePasscode(passcode, ["editor", "user"]);

    const userId = cookieStore.get("userId")?.value;
    const commentResponse =
        await sql`SELECT * FROM comments WHERE id = ${commentId}`;
    const fetchedComment = commentResponse.rows[0];
    if (fetchedComment.userid !== userId) {
        throw new Error("You are not authorized to edit this comment");
    }

    await Promise.all([
        sql`UPDATE comments SET message = ${comment.message}, edited = true, userName = ${userName} WHERE id = ${commentId}`,
        logUpdateByTableName("comments"),
    ]);

    const updatedCommentResponse =
        await sql`SELECT * FROM comments WHERE id = ${commentId}`;
    const updatedComment = updatedCommentResponse.rows[0];

    return {
        comment: {
            id: updatedComment.id,
            message: updatedComment.message,
            activityId: updatedComment.activityid,
            userId: updatedComment.userid,
            userName: updatedComment.username,
            createTime: updatedComment.createtime,
            edited: updatedComment.edited,
        },
    };
}

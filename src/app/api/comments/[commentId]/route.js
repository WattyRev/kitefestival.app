import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import logUpdateByTableName from "../../logUpdate";
import validatePasscode, { InvalidPasscodeError, NoPasscodeError } from "../../passcodes/validatePasscode";
import { cookies } from "next/headers";

/**
 * Deletes a comment by ID.
 *
 * DELETE /api/comments/:commentId
 *
 * Response:
 * {
 *   message: string
 * }
 */
export async function DELETE(_, { params }) {
    const { commentId } = params;
    const cookieStore = cookies();
    const passcode = cookieStore.get('passcode')?.value;
    try {
        await validatePasscode(passcode, ['editor', 'user']);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            return NextResponse.json({ message: 'No passcode provided'}, { status: 401 });
        }
        if (error instanceof InvalidPasscodeError) {
            return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
        }
        throw error;
    }
    if (cookieStore.get('userType')?.value === 'user') {
        const userId = cookieStore.get('userId')?.value;
        const commentResponse = await sql`SELECT * FROM comments WHERE id = ${commentId}`;
        const comment = commentResponse.rows[0];
        if (comment.userid !== userId) {
            return NextResponse.json({ message: 'You are not authorized to delete this comment'}, { status: 403 });
        }
    }
    await Promise.all([sql`DELETE FROM comments WHERE id = ${commentId}`, logUpdateByTableName('comments')]);
    return NextResponse.json({ message: 'Comment deleted'});
}

/**
 * Patches an existing comment with new values.
 *
 * PATCH /api/comments/:commentId
 * {
 *   comment: Partial<Comment>
 * }
 *
 * Response:
 * {
 *   message?: string
 * }
 */
export async function PATCH(req, { params }) {
    const { commentId } = params;
    const { comment } = await req.json();
    if (!comment?.message) {
        return NextResponse.json({ message: 'No message provided'}, { status: 400 });
    }

    const cookieStore = cookies();
    const userName = cookieStore.get('userName')?.value;
    if (!userName) {
        return NextResponse.json({ message: 'No user name set'}, { status: 400 });
    }

    const passcode = cookieStore.get('passcode')?.value;
    try {
        await validatePasscode(passcode, ['editor', 'user']);
    } catch (error) {
        if (error instanceof NoPasscodeError) {
            return NextResponse.json({ message: 'No passcode provided'}, { status: 401 });
        }
        if (error instanceof InvalidPasscodeError) {
            return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
        }
        throw error;
    }
    const userId = cookieStore.get('userId')?.value;
    const commentResponse = await sql`SELECT * FROM comments WHERE id = ${commentId}`;
    const fetchedComment = commentResponse.rows[0];
    if (fetchedComment.userid !== userId) {
        return NextResponse.json({ message: 'You are not authorized to edit this comment'}, { status: 403 });
    }

    await Promise.all([
        sql`UPDATE comments SET message = ${comment.message}, edited = true, userName = ${userName} WHERE id = ${commentId}`,
        logUpdateByTableName('comments')
    ]);

    return NextResponse.json({});
}
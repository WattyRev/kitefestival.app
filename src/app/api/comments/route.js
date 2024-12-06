import { cookies } from "next/headers";
import validatePasscode, { InvalidPasscodeError, NoPasscodeError } from "../passcodes/validatePasscode";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { randomUUID } from "../crypto";
import logUpdateByTableName from "../logUpdate";

export const revalidate = 0;

export async function GET() {
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

    const commentsResponse = await sql`SELECT * FROM comments ORDER BY createtime ASC`;
    const comments = commentsResponse.rows.map(comment => {
        const { id, message, activityid, userid, username, createtime, edited } = comment;
        return { 
            id, 
            message, 
            activityId: activityid, 
            userId: userid, 
            userName: username, 
            createTime: createtime,
            edited
        };
    });
    return NextResponse.json({ comments });
}

export async function POST(req) {
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
    const userId = cookieStore.get('userId')?.value;
    const userName = cookieStore.get('userName')?.value;

    if (!userId || !userName) {
        return NextResponse.json({ message: 'No user ID or name set'}, { status: 400 });
    }

    const { message, activityId} = await req.json();
    if (!message) {
        return NextResponse.json({ message: 'No message provided'}, { status: 400 });
    }
    if (!activityId) {
        return NextResponse.json({ message: 'No activityId provided'}, { status: 400 });
    }

    const id = randomUUID();

    await Promise.all([
        sql`INSERT INTO comments (id, message, activityid, userid, username, createtime) VALUES (${id}, ${message}, ${activityId}, ${userId}, ${userName}, now())`,
        logUpdateByTableName('comments')
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
        edited: rawComment.edited
    }
    return NextResponse.json({ comments: [comment] });
}
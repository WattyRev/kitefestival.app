import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import getPasscodeByName from "./getPasscodeByName";
import { cookies } from "next/headers";
import { randomUUID } from "../crypto";

/**
 * Change passcodes
 * 
 * PUT /api/passcodes
 * {
 *   adminPasscode?: string
 *   editorPasscode?: string
 *   userPasscode?: string
 *   authentication: string // The current admin passcode is required
 * }
 * 
 * Response:
 * {
 *   message: string
 * }
 */
export async function PUT(req) {
    const {
        adminPasscode,
        editorPasscode,
        userPasscode,
        authentication
    } = await req.json();
    if (!authentication) {
        return NextResponse.json({ message: 'No authentication provided'}, { status: 401 });
    }

    const currentPasscode = await getPasscodeByName('admin');
    
    if (authentication !== currentPasscode) {
        return NextResponse.json({ message: 'Provided authentication is invalid'}, { status: 403 });
    }

    const promises = [];
    const passcodesUpdated = []
    if (adminPasscode) {
        promises.push(sql`UPDATE passcodes SET passcode = ${adminPasscode} WHERE name = 'admin'`);
        passcodesUpdated.push('Admin');
    }
    if (editorPasscode) {
        promises.push(sql`UPDATE passcodes SET passcode = ${editorPasscode} WHERE name = 'editor'`);
        passcodesUpdated.push('Editor');
    }
    if (userPasscode) {
        promises.push(sql`UPDATE passcodes SET passcode = ${userPasscode} WHERE name = 'user'`);
        passcodesUpdated.push('User');
    }
    await Promise.all(promises);

    return NextResponse.json({ message: `${passcodesUpdated.join(', ')} passcode${passcodesUpdated.length > 1 ? 's have' : ' has'} been updated`});
}

/**
 * Validate a passcode
 * 
 * POST /api/passcodes
 * {
 *   passcode: string
 *   name: string
 * }
 * 
 * Response:
 * {
 *    userType: 'editor' | 'user' // The user type matched by the provided passcode
 * }
 */
export async function POST(req) {
    const identifyCookieExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    const cookieStore = cookies();
    if (!cookieStore.has('userId')) {
        const userId = randomUUID();
        cookieStore.set('userId', userId, {
            expires: identifyCookieExpiration,
            sameSite: 'strict',
            secure: true
        });
    }
    const {
        passcode,
        name
    } = await req.json();

    if (name) {
        cookieStore.set('userName', name, {
            expires: identifyCookieExpiration,
            sameSite: 'strict',
            secure: true
        });
    }

    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }
    const authCookieExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    const editorPasscode = await getPasscodeByName('editor');
    if (passcode === editorPasscode) {
        cookieStore.set('passcode', passcode, {
            expires: authCookieExpiration,
            sameSite: 'strict',
            secure: true
        });
        cookieStore.set('userType', 'editor', {
            expires: authCookieExpiration,
            sameSite: 'strict',
            secure: true
        });
        return NextResponse.json({ userType: 'editor' });
    }
    const userPasscode = await getPasscodeByName('user');
    if (passcode === userPasscode) {
        cookieStore.set('passcode', passcode, {
            expires: authCookieExpiration,
            sameSite: 'strict',
            secure: true
        });
        cookieStore.set('userType', 'user', {
            expires: authCookieExpiration,
            sameSite: 'strict',
            secure: true
        });
       return NextResponse.json({ userType: 'user' });
    }

    return NextResponse.json({ message: 'Invalid passcode'}, { status: 401 });
}
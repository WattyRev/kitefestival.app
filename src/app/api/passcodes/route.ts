import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

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
export async function PUT(req: Request) {
    const {
        adminPasscode,
        editorPasscode,
        userPasscode,
        authentication
    } = await req.json();
    
    if (!authentication) {
        NextResponse.json({ message: 'No authentication provided'}, { status: 401 });
    }

    const fetchedPasscodes = await sql`SELECT passcode FROM passcodes WHERE name = 'admin'`;
    if (!fetchedPasscodes.rows.length) {
        throw new Error('Admin passcode not found');
    }
    const currentPasscode = fetchedPasscodes.rows[0].passcode;
    
    if (authentication !== currentPasscode) {
        NextResponse.json({ message: 'Provided authentication is invalid'}, { status: 403 });
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
 * }
 * 
 * Response:
 * {
 *    userType: 'editor' | 'user' // The user type matched by the provided passcode
 * }
 */
export async function POST(req: Request) {
    const {
        passcode
    } = await req.json();

    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }

    const editorPasscodeResponse = await sql`SELECT passcode FROM passcodes WHERE name = 'editor'`;
    if (!editorPasscodeResponse.rows.length) {
        throw new Error('Editor passcode not found');
    }
    const editorPasscode = editorPasscodeResponse.rows[0].passcode;
    if (passcode === editorPasscode) {
        return NextResponse.json({ userType: 'editor' });
    }
    const userPasscodeResponse = await sql`SELECT passcode FROM passcodes WHERE name = 'user'`;
    if (!userPasscodeResponse.rows.length) {
        throw new Error('Editor passcode not found');
    }
    const userPasscode = userPasscodeResponse.rows[0].passcode;
    if (passcode === userPasscode) {
       return NextResponse.json({ userType: 'user' });
    }

    return NextResponse.json({ message: 'Invalid passcode'}, { status: 401 });
}
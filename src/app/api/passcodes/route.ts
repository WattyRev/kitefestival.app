import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

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

    const currentPasscode = await kv.get('adminPasscode');
    if (authentication !== currentPasscode) {
        NextResponse.json({ message: 'Provided authentication is invalid'}, { status: 403 });
    }

    const promises = [];
    const passcodesUpdated = []
    if (adminPasscode) {
       promises.push(kv.set('adminPasscode', adminPasscode));
       passcodesUpdated.push('Admin');
    }
    if (editorPasscode) {
       promises.push(kv.set('editorPasscode', editorPasscode));
       passcodesUpdated.push('Editor');
    }
    if (userPasscode) {
       promises.push(kv.set('userPasscode', userPasscode));
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

    const editorPasscode = await kv.get('editorPasscode');
    if (passcode === editorPasscode) {
        return NextResponse.json({ userType: 'editor' });
    }
    const userPasscode = await kv.get('userPasscode');
    if (passcode === userPasscode) {
       return NextResponse.json({ userType: 'user' });
    }

    return NextResponse.json({ message: 'Invalid passcode'}, { status: 401 });
}
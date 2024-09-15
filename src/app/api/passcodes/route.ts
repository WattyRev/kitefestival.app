import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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

    // const newAdminPasscode = await kv.get('adminPasscode');
    return NextResponse.json({ message: `${passcodesUpdated.join(', ')} passcode${passcodesUpdated.length > 1 ? 's have' : ' has'} been updated`});
}
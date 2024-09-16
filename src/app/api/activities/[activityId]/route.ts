import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: { activityId: string } }) {
    console.log('delete activity');
    const { activityId } = params;
    const { passcode } = await req.json();
    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }
    const editorPasscode = await kv.get('editorPasscode');
    if (passcode !== editorPasscode) {
        return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
    }
    if (!activityId) {
        return NextResponse.json({ message: 'No activity ID provided'}, { status: 400 });
    }
    await kv.hdel('activities', activityId);
    return NextResponse.json({ message: 'Activity deleted'});
}

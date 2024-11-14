import { NextResponse } from "next/server";

export type Activity = {
    title: string;
    description: string;
}

export async function POST(req: Request) {
    const { title, description, passcode } = await req.json();
    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }
    const editorPasscode = 'editor'; //await kv.get('editorPasscode');
    if (passcode !== editorPasscode) {
        return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
    }

    if (!title || !description) {
        return NextResponse.json({ message: 'No title or description provided'}, { status: 400 });
    }

    const id = crypto.randomUUID();
    const activities = {
        [id]: JSON.stringify({ title, description, }),
    }
    // await kv.hset('activities', activities);
    return NextResponse.json({ activities });
}

export async function GET() {
    const activities: Activity[] = []; //await kv.hgetall('activities');
    return NextResponse.json({ activities });
}

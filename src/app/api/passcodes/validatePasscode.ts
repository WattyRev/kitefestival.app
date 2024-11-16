import { NextResponse } from "next/server";
import getPasscodeByName from "./getPasscodeByName";

export enum PasscodeLevel {
    ADMIN = 'admin',
    EDITOR = 'editor',
    USER = 'user',
}
export default async function validatePasscode(passcode: string, levels: PasscodeLevel[]) {
    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }

    const validPasscodes = await Promise.all(levels.map(level => getPasscodeByName(level)));
    if (!validPasscodes.includes(passcode)) {
        return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
    }
    return true;
}
import { NextResponse } from "next/server";
import getPasscodeByName from "./getPasscodeByName";

export default async function validatePasscode(passcode, levels) {
    if (!passcode) {
        return NextResponse.json({ message: 'No passcode provided'}, { status: 400 });
    }

    const validPasscodes = await Promise.all(levels.map(level => getPasscodeByName(level)));
    if (!validPasscodes.includes(passcode)) {
        return NextResponse.json({ message: 'Provided passcode is invalid'}, { status: 403 });
    }
    return true;
}
import getPasscodeByName from "./getPasscodeByName";

export class NoPasscodeError extends Error {
    constructor(message) {
        super(message);
        this.name = "NoPasscodeError";
        this.message = "No passcode provided";
    }
}

export class InvalidPasscodeError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidPasscodeError";
        this.message = "Provided passcode is invalid";
    }
}

export default async function validatePasscode(passcode, levels) {
    if (!passcode) {
        throw new NoPasscodeError();
    }

    const validPasscodes = await Promise.all(
        levels.map((level) => getPasscodeByName(level)),
    );
    if (!validPasscodes.includes(passcode)) {
        throw new InvalidPasscodeError();
    }
    return true;
}

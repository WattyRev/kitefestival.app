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

/**
 *
 * @param {String} passcode
 * @param {String[]} levels Options: "admin", "editor", "user"
 * @returns true if passcode matches levels
 */
export default async function validatePasscode(passcode, levels) {
    if (passcode == null || passcode === "") {
        throw new NoPasscodeError();
    }

    // Normalize and decode cookie-provided passcodes (which may be URL-encoded)
    let provided = String(passcode);
    try {
        provided = decodeURIComponent(provided);
    } catch (_) {
        // ignore decode errors and use raw string
    }
    provided = provided.trim();

    const validPasscodes = await Promise.all(
        levels.map((level) => getPasscodeByName(level)),
    );
    const normalizedValid = validPasscodes.map((p) =>
        typeof p === "string" ? p.trim() : p,
    );
    if (!normalizedValid.includes(provided)) {
        throw new InvalidPasscodeError();
    }
    return true;
}

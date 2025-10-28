"use server";

import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";
import getPasscodeByName from "./passcodes/getPasscodeByName";
import { randomUUID } from "./crypto";

/**
 * Changes the provided passcodes.
 *
 * @param {Object} config - An object containing the admin, editor, and user passcodes, as well as the authentication.
 * @throws {Error} - If the authentication is invalid or no authentication is provided.
 * @returns {Object} - An object containing a message indicating which passcodes have been updated.
 */
export async function changePasscodes(config) {
    const { adminPasscode, editorPasscode, userPasscode, authentication } =
        config;
    if (!authentication) {
        throw new Error("No authentication provided");
    }

    const currentPasscode = await getPasscodeByName("admin");

    if (authentication !== currentPasscode) {
        throw new Error("Provided authentication is invalid");
    }

    const promises = [];
    const passcodesUpdated = [];

    if (adminPasscode) {
        promises.push(
            sql`UPDATE passcodes SET passcode = ${adminPasscode} WHERE name = 'admin'`,
        );
        passcodesUpdated.push("Admin");
    }
    if (editorPasscode) {
        promises.push(
            sql`UPDATE passcodes SET passcode = ${editorPasscode} WHERE name = 'editor'`,
        );
        passcodesUpdated.push("Editor");
    }
    if (userPasscode) {
        promises.push(
            sql`UPDATE passcodes SET passcode = ${userPasscode} WHERE name = 'user'`,
        );
        passcodesUpdated.push("User");
    }
    await Promise.all(promises);

    return {
        message: `${passcodesUpdated.join(", ")} passcode${passcodesUpdated.length > 1 ? "s have" : " has"} been updated`,
    };
}

/**
 * Validates a passcode and returns the associated user type.
 *
 * @param {string} passcode - The passcode to validate.
 * @param {string} name - The name associated with the passcode.
 * @throws {Error} - If the passcode is invalid or if no passcode is provided.
 * @returns {Object} - An object containing the user type associated with the passcode.
 */
export async function validatePasscode(passcode, name) {
    const identifyCookieExpiration = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 365,
    );
    const cookieStore = cookies();
    if (!cookieStore.has("userId")) {
        const userId = randomUUID();
        cookieStore.set("userId", userId, {
            expires: identifyCookieExpiration,
            sameSite: "strict",
            secure: true,
        });
    }

    if (name) {
        cookieStore.set("userName", name, {
            expires: identifyCookieExpiration,
            sameSite: "strict",
            secure: true,
        });
    }

    if (!passcode) {
        throw new Error("No passcode provided");
    }
    const authCookieExpiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    const editorPasscode = await getPasscodeByName("editor");
    if (passcode === editorPasscode) {
        cookieStore.set("passcode", passcode, {
            expires: authCookieExpiration,
            sameSite: "strict",
            secure: true,
        });
        cookieStore.set("userType", "editor", {
            expires: authCookieExpiration,
            sameSite: "strict",
            secure: true,
        });
        return { userType: "editor" };
    }
    const userPasscode = await getPasscodeByName("user");
    if (passcode === userPasscode) {
        cookieStore.set("passcode", passcode, {
            expires: authCookieExpiration,
            sameSite: "strict",
            secure: true,
        });
        cookieStore.set("userType", "user", {
            expires: authCookieExpiration,
            sameSite: "strict",
            secure: true,
        });
        return { userType: "user" };
    }

    throw new Error("Invalid passcode");
}

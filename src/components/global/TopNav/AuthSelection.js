"use client";

import { css } from "../../../../styled-system/css";
import { useAuth } from "../Auth";
import { useAlert } from "../../ui/Alert";
import fetch from "../../../util/fetch";
import { useState } from "react";
import Modal from "../../ui/Modal";
import LogInForm from "./LogInForm";
import PlainButton from "../../ui/PlainButton";
import { usePrompt } from "../../ui/Prompt";
import { validatePasscode } from "../../../app/api/passcodes";

/**
 * Controls the Log In / Log Out buttons in the top nav
 */
const AuthSelection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { auth, setAuthentication, clearAuthentication } = useAuth();
    const [isPending, setIsPending] = useState(false);
    const { openAlert } = useAlert();
    const { openPrompt } = usePrompt();

    // Prompt for passcode and log in with it
    async function logIn({ name, passcode }) {
        setIsPending(true);
        let response;
        try {
            response = await validatePasscode(passcode, name);
        } catch (error) {
            openAlert(error.message, "error");
            setIsPending(false);
            return;
        }

        setIsPending(false);
        setIsModalOpen(false);
        setAuthentication({ userType: response.userType, passcode });
    }

    async function logOut() {
        try {
            await openPrompt("Are you sure you want to log out?", "confirm");
        } catch {
            return;
        }
        clearAuthentication();
    }

    if (!auth?.userType) {
        return (
            <>
                <PlainButton
                    className={css({ cursor: "pointer" })}
                    data-testid="log-in"
                    onClick={() => setIsModalOpen(true)}
                >
                    Log In
                </PlainButton>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                >
                    <LogInForm
                        isPending={isPending}
                        onSubmit={logIn}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            </>
        );
    }
    return (
        <span>
            {auth.userName}&nbsp;
            <PlainButton
                className={css({ cursor: "pointer" })}
                data-testid="log-out"
                onClick={logOut}
            >
                <i className="fa-solid fa-right-from-bracket"></i>
            </PlainButton>
        </span>
    );
};

export default AuthSelection;

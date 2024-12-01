'use client'

import { useAuth } from '../Auth';
import { useAlert } from '../../ui/Alert';
import { usePrompt } from '../../ui/Prompt';
import fetch from '../../../util/fetch';

/**
 * Controls the Log In / Log Out buttons in the top nav
 */
const AuthSelection = () => {
    const { auth, setAuthentication, clearAuthentication } = useAuth();
    const { openAlert } = useAlert();
    const { openPrompt } = usePrompt();

    // Prompt for passcode and log in with it
    async function logIn() {
        let passcode;
        try {
            passcode = await openPrompt("Enter the passcode.", 'password');
        } catch {
            return;
        }

        const response = await fetch('/api/passcodes', {
            method: 'POST',
            body: JSON.stringify({ passcode })
        });

        if (!response.ok) {
            openAlert('Invalid passcode', 'error');
            return;
        }

        const { userType } = await response.json();
        setAuthentication({ userType, passcode });
    }

    function logOut() {
        clearAuthentication();
    }

    if (!auth?.userType) {
        return (
            <a data-testid="log-in" onClick={logIn}>
                Log In
            </a>
        );
    }
    return (
        <a data-testid="log-out" onClick={logOut}>
            Log Out
        </a>
    );
}

export default AuthSelection;
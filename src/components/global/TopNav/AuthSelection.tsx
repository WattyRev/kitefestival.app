'use client'

import { useContext } from 'react';
import { AuthContext, AuthenticatonContext } from '@/components/global/Auth';

/**
 * Controls the Log In / Log Out buttons in the top nav
 */
const AuthSelection = () => {
    const { auth, setAuthentication, clearAuthentication }: AuthenticatonContext = useContext(AuthContext);

    // Prompt for passcode and log in with it
    async function logIn() {
        const passcode = prompt("Enter the passcode.") || '';

        const response = await fetch('/api/passcodes', {
            method: 'POST',
            body: JSON.stringify({ passcode })
        });

        if (!response.ok) {
            alert('Invalid passcode');
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
            <a onClick={logIn}>
                Log In
            </a>
        );
    }
    return (
        <a onClick={logOut}>
            Log Out
        </a>
    );
}

export default AuthSelection;
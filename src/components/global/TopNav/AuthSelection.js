'use client'

import { css } from '../../../../styled-system/css';
import { useAuth } from '../Auth';
import { useAlert } from '../../ui/Alert';
import fetch from '../../../util/fetch';
import { useState } from 'react';
import Modal from '../../ui/Model';
import LogInForm from './LogInForm';

/**
 * Controls the Log In / Log Out buttons in the top nav
 */
const AuthSelection = () => {
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const { auth, setAuthentication, clearAuthentication } = useAuth();
    const [ isPending, setIsPending ] = useState(false);
    const { openAlert } = useAlert();

    // Prompt for passcode and log in with it
    async function logIn({name, passcode}) {
        setIsPending(true);
        const response = await fetch('/api/passcodes', {
            method: 'POST',
            body: JSON.stringify({
                passcode,
                name
             })
        });

        if (!response.ok) {
            openAlert('Invalid passcode', 'error');
            setIsPending(false);
            return;
        }

        const { userType } = await response.json();
        setIsPending(false);
        setIsModalOpen(false);
        setAuthentication({ userType, passcode });
    }

    function logOut() {
        clearAuthentication();
    }

    if (!auth?.userType) {
        return (
            <>
                <button 
                    className={css({ cursor: 'pointer' })}
                    data-testid="log-in"
                    onClick={() => setIsModalOpen(true)}
                >
                    Log In
                </button>
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
        <button className={css({ cursor: 'pointer' })} data-testid="log-out" onClick={logOut}>
            Log Out
        </button>
    );
}

export default AuthSelection;
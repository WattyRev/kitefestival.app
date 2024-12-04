'use client'

import { css } from '../../../../styled-system/css';
import { useAuth } from '../Auth';
import { useAlert } from '../../ui/Alert';
import fetch from '../../../util/fetch';
import { useState } from 'react';
import Modal from '../../ui/Model';
import H1 from '../../ui/H1';
import Panel from '../../ui/Panel';
import TextInput from '../../ui/TextInput';
import Button from '../../ui/Button';

/**
 * Controls the Log In / Log Out buttons in the top nav
 */
const AuthSelection = () => {
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const { auth, setAuthentication, clearAuthentication } = useAuth();
    const [ name, setName ] = useState('');
    const [ passcode, setPasscode ] = useState();
    const [ isPending, setIsPending ] = useState(false);
    const { openAlert } = useAlert();

    // Prompt for passcode and log in with it
    async function logIn() {
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
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        logIn();
                    }}>
                        <H1>Log In</H1>
                        <Panel>
                            <label htmlFor="name">Name</label>
                            <TextInput 
                                data-testid="name-input"
                                id="name" 
                                placeholder="What should we call you?" 
                                required 
                                autoFocus
                                value={name} 
                                onChange={e => setName(e.target.value)}
                            />
                            <label htmlFor="passcode">Passcode</label>
                            <TextInput 
                                data-testid="passcode-input"
                                id="passcode" 
                                type="password" 
                                required 
                                value={passcode} 
                                onChange={e => setPasscode(e.target.value)}
                            />
                        </Panel>
                        <Button
                            data-testid="submit-log-in"
                            type="submit"
                            disabled={isPending}
                        >Log In</Button>
                        <Button 
                            type="button" 
                            className="secondary" 
                            onClick={() => setIsModalOpen(false)}
                        >Cancel</Button>
                    </form>
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
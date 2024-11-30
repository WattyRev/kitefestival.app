'use client'

import { createContext, useContext, useState } from "react";
import Button from "./Button";
import { css } from '../../../styled-system/css';
import Input from "./Input";

export const PromptContext = createContext({});

export const usePrompt = () => {
    return useContext(PromptContext);
}

export const PromptProvider = ({ children }) => {
    const [ isPromptOpen, setIsPromptOpen ] = useState(false);
    const [ prompt, setPrompt ] = useState(null);
    const [ promptType, setPromptType ] = useState('text');

    async function openPrompt(prompt, promptType = 'text') {
        return new Promise((resolve, reject) => {
            setIsPromptOpen(true);
            setPrompt(prompt);
            setPromptType(promptType);
            window.kf_prompt_resolve = resolve;
            window.kf_prompt_reject = reject;
        });
    }
    function submitPrompt(response) {
        window.kf_prompt_resolve(response);
        setIsPromptOpen(false);
        setPrompt(null);
        window.kf_prompt_resolve = null;
        window.kf_prompt_reject = null;
    }
    function cancelPrompt() {
        window.kf_prompt_reject();
        setIsPromptOpen(false);
        setPrompt(null);
        window.kf_prompt_resolve = null;
        window.kf_prompt_reject = null;
    }
    return (
        <PromptContext.Provider value={{ openPrompt }}>
            {children}
            {isPromptOpen && <Prompt prompt={prompt} promptType={promptType} onSubmit={submitPrompt} onCancel={cancelPrompt} />}
        </PromptContext.Provider>
    )
};

export const Prompt = ({ prompt, promptType, onSubmit, onCancel }) => {
    const [ value, setValue ] = useState('');
    return (
        <>
            <div className={css({ 
                position: 'fixed',
                opacity: 0.5,
                background: 'black',
                width: '100vw',
                height: '100vh',
                top: 0,
                left: 0,
                cursor: 'pointer',
            })} onClick={onCancel} />
            <form 
                className={css({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '16px',
                    borderRadius: '4px',
                    width: '80%',
                    maxWidth: '400px',
                    border: '1px solid black',
                })}
                onSubmit={e => {e.preventDefault(); onSubmit(value);}}
            >
                <p className={css({ textAlign: 'center', marginBottom: '16px' })}>{prompt}</p>
                <Input type={promptType} value={value} onChange={e => setValue(e.target.value)} />
                <div className={css({ marginTop: '16px' })}>
                    <Button type="submit">Submit</Button>
                    <Button className="secondary" type="button" onClick={onCancel}>Cancel</Button>
                </div>
            </form>
        </>
    );
}
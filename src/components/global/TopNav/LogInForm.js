import { useState } from "react";
import Button from "../../ui/Button";
import H1 from "../../ui/H1";
import Panel from "../../ui/Panel";
import TextInput from "../../ui/TextInput";
import { useAuth } from "../Auth";

const LogInForm = ({
    isPending,
    onSubmit,
    onCancel
}) => {
    const { auth } = useAuth();
    const [ name, setName ] = useState(auth.userName || '');
    const [ passcode, setPasscode ] = useState('');
    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, passcode });
        }}>
            <H1>Log In</H1>
            <Panel>
                <label htmlFor="name">Name</label>
                <TextInput 
                    data-testid="name-input"
                    id="name" 
                    placeholder="What should we call you?" 
                    required 
                    autoFocus={!name}
                    value={name} 
                    onChange={e => setName(e.target.value)}
                />
                <label htmlFor="passcode">Passcode</label>
                <TextInput 
                    data-testid="passcode-input"
                    id="passcode" 
                    type="password" 
                    autoFocus={!!name}
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
                onClick={() => onCancel()}
            >Cancel</Button>
        </form>
    )
}

export default LogInForm;
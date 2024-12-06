import { useState } from "react"
import Button from "../ui/Button"
import TextInput from "../ui/TextInput"

const CommentForm = ({ onSubmit, onCancel, initialMessage = '', ...props }) => {
    const [ message, setMessage ] = useState(initialMessage);
    const [ isPending, setIsPending ] = useState(false);
    return (
        <form {...props} onSubmit={async e => {
            e.preventDefault();
            setIsPending(true);
            try {
                await onSubmit(message);
            } catch {
                setIsPending(false);
                return;
            }
            setIsPending(false);
            setMessage('');
        }}>
            <TextInput 
                data-testid="message-input"
                type="text"
                placehodler="Add comment"
                value={message}
                onChange={e => setMessage(e.target.value)}
            />
            <Button data-testid="submit-comment" type="submit" disabled={isPending}>Send</Button>
            {onCancel && <Button data-testid="cancel-comment" onClick={onCancel} className="secondary">Cancel</Button>}
        </form>
    )
}

export default CommentForm;
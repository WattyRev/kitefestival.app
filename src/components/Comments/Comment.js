import TimeAgo from "../ui/TimeAgo"
import Button from "../ui/Button";
import { usePrompt } from "../ui/Prompt";
import { useAuth } from "../global/Auth";
import { useState } from "react";
import { css } from "../../../styled-system/css";
import CommentForm from "./CommentForm";

const Comment = ({ comment, onDelete, onEdit }) => {
    const { auth } = useAuth();
    const { openPrompt } = usePrompt();
    const [ isPending, setIsPending ] = useState(false);
    const [ isEditing, setIsEditing ] = useState(false);

    const handleDelete = async (commentId) => {
        await openPrompt('Are you sure you want to delete this comment?', 'confirm');
        setIsPending(true);
        await onDelete(commentId);
        setIsPending(false);
    }
    return (
        <div key={comment.id}>
            {!isEditing && (
                <>
                    <p><strong>{comment.userName}</strong> <TimeAgo className={css({ fontSize: 'sm'})} timestamp={comment.createTime} /></p>
                    <p data-testid="comment-message">{comment.message}{comment.edited && <em className={css({ fontSize: 'sm'})}> (edited)</em>}</p>
                    {comment.userId === auth.userId && (
                        <Button 
                            data-testid="edit-comment"
                            onClick={() => setIsEditing(true)}
                        >Edit</Button>
                    )}
                    {(comment.userId === auth.userId || auth.userType === 'editor') && (
                        <Button 
                            data-testid="delete-comment"
                            onClick={() => handleDelete(comment.id)} 
                            className="danger"
                            disabled={isPending}
                        >Delete</Button>
                    )}
                </>
            )}
            {isEditing && (
                <CommentForm 
                    initialMessage={comment.message}
                    onSubmit={async message => {
                        await onEdit(comment.id, message);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            )}
        </div>
    )
}

export default Comment;
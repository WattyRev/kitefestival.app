import { useAuth } from "./global/Auth";
import Button from "./ui/Button";
import CommentForm from "./Comments/CommentForm";
import { useState } from "react";
import Comment from "./Comments/Comment";

const Comments = ({ comments = [], onCreate, onDelete, onEdit }) => {
    const { isPublic } = useAuth();
    const [ isOpen, setIsOpen ] = useState(false);
    if (isPublic()) {
        return null;
    }

    return (
        <>
            <Button data-testid="toggle-comments" onClick={() => setIsOpen(!isOpen)}>Comments ({comments.length})</Button>
            {isOpen && (
                <div>
                    {!comments.length && (
                        <p data-testid="no-comments"><em>No Comments</em></p>
                    )} 
                    {comments.map(comment => (
                        <Comment key={comment.id} comment={comment} onDelete={onDelete} onEdit={onEdit} />
                    ))}
                    <CommentForm onSubmit={onCreate} />
                </div>
            )}
        </>
    )
}

export default Comments;
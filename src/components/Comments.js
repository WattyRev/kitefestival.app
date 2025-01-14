import { useAuth } from "./global/Auth";
import Button from "./ui/Button";
import CommentForm from "./Comments/CommentForm";
import Comment from "./Comments/Comment";
import { css } from "../../styled-system/css";
import Pane from "./ui/Pane";
import H1 from "./ui/H1";

const Comments = ({ comments = [], onCreate, onDelete, onEdit, activityTitle }) => {
    const { isPublic } = useAuth();
    if (isPublic()) {
        return null;
    }

    return (
        <Pane
            trigger={({ openPane, closePane, isOpen }) => (
                <Button 
                    data-testid="toggle-comments"
                    onClick={isOpen ? closePane : openPane}
                    title="Comments"
                    className={`secondary ${isOpen ? 'active' : ''}`}
                >
                    <i className="fa-solid fa-comment" /> ({comments.length})
                </Button>
            )}
        >
            <div>
                <H1><i className="fa-solid fa-comments"></i> {activityTitle}</H1>
                {!comments.length && (
                    <p data-testid="no-comments"><em>No Comments</em></p>
                )} 
                {comments.map(comment => (
                    <Comment key={comment.id} comment={comment} onDelete={onDelete} onEdit={onEdit} />
                ))}
                <div className={css({ marginTop: '8px' })} />
                <CommentForm onSubmit={onCreate} />
            </div>
        </Pane>
    )
}

export default Comments;
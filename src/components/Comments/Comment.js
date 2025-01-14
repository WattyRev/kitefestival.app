import TimeAgo from "../ui/TimeAgo"
import { usePrompt } from "../ui/Prompt";
import { useAuth } from "../global/Auth";
import { useState } from "react";
import { css } from "../../../styled-system/css";
import CommentForm from "./CommentForm";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import PlainButton from "../ui/PlainButton";

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
        <div 
            key={comment.id} 
            className={`${comment.userId === auth.userId ? 'my-comment' : ''} ${css({ 
                padding: '8px',
                '&.my-comment': {
                    background: 'sectionBackground',
                }
            })}`}
        >
            {!isEditing && (
                <>
                    <div className={css({ display: 'flex', justifyContent: 'space-between' })}>
                        <p><strong>{comment.userName}</strong> <TimeAgo className={css({ fontSize: 'sm'})} timestamp={comment.createTime} /></p>
                        {(comment.userId === auth.userId || auth.userType === 'editor') && (
                            <Dropdown
                                dropdownContent={(() => (
                                    <>
                                        {comment.userId === auth.userId && (
                                            <DropdownItem data-testid="edit-comment" onClick={() => setIsEditing(true)} disabled={isPending}><i className="fa-solid fa-pen"/> Edit Comment</DropdownItem>
                                        )}
                                        <DropdownItem data-testid="delete-comment" onClick={() => handleDelete(comment.id)} disabled={isPending}><i className="fa-solid fa-trash"/> Delete Comment</DropdownItem>
                                    </>
                                ))}
                            >
                                {({ open, close, isOpen }) => (
                                    <PlainButton data-testid="comment-dropdown" className={css({ cursor: 'pointer' })} onClick={isOpen ? close : open}><i className="fa-solid fa-ellipsis"></i></PlainButton>
                                )}
                            </Dropdown>
                        )}
                    </div>
                    <p data-testid="comment-message">{comment.message}{comment.edited && <em className={css({ fontSize: 'sm'})}> (edited)</em>}</p>
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
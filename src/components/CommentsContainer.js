import {
    createContext,
    useEffect,
    useReducer,
    useState,
    useCallback,
} from "react";
import fetch from "../util/fetch";
import { useAlert } from "./ui/Alert";
import { useChangePolling } from "./ChangePollingContainer";
import { useAuth } from "./global/Auth";

export const CommentsContext = createContext({
    comments: [],
    commentsByActivityId: {},
});

export const CommentsDispatchContext = createContext(null);

function sortComments(comments) {
    const sortedComments = [...comments];
    sortedComments.sort((a, b) => {
        return new Date(a.createTime) - new Date(b.createTime);
    });
    return sortedComments;
}

function buildCommentsState(comments) {
    const sortedComments = sortComments(comments);
    const newState = sortedComments.reduce(
        (acc, comment) => {
            acc.comments.push(comment);
            const { activityId } = comment;
            if (!acc.commentsByActivityId[activityId]) {
                acc.commentsByActivityId[activityId] = [];
            }
            acc.commentsByActivityId[activityId].push(comment);
            return acc;
        },
        { comments: [], commentsByActivityId: {} },
    );
    return newState;
}

const CommentsReducer = (state, action) => {
    switch (action.type) {
        case "delete": {
            if (!action.id) {
                throw new Error(
                    "No id provided to comment activity from state",
                );
            }
            return buildCommentsState(
                state.comments.filter((comment) => comment.id !== action.id),
            );
        }
        case "create": {
            if (!action.comment) {
                throw new Error("No comment provided to create");
            }
            const newState = {
                comments: [...state.comments, action.comment],
                commentsByActivityId: {
                    ...state.commentsByActivityId,
                    [action.comment.activityId]: [
                        ...(state.commentsByActivityId[
                            action.comment.activityId
                        ] || []),
                        action.comment,
                    ],
                },
            };
            return newState;
        }
        case "patch": {
            if (!action.comment?.id) {
                throw new Error("No id provided to patch comment from state");
            }
            const comment = state.comments.find(
                (comment) => comment.id === action.comment.id,
            );
            if (!comment) {
                throw new Error("No comment found to patch");
            }
            const updatedComments = state.comments.map((comment) => {
                if (comment.id !== action.comment.id) {
                    return comment;
                }
                return {
                    ...comment,
                    message: action.comment.message,
                    edited: true,
                };
            });
            return buildCommentsState(updatedComments);
        }
        case "refresh": {
            return action.newState;
        }
        default: {
            throw new Error(`Unhandled comments action type: ${action.type}`);
        }
    }
};

const CommentsContainer = ({ children }) => {
    const [commentsData, dispatch] = useReducer(CommentsReducer, {
        comments: [],
        commentsByActivityId: {},
    });
    const [lastUpdate, setLastUpdate] = useState(null);
    const { auth } = useAuth();
    // Fallback userType from document.cookie to reduce transient unauth states on cold load
    const computedUserType =
        auth.userType ||
        (typeof document !== "undefined"
            ? /(?:^|; )userType=([^;]+)/.exec(document.cookie)?.[1]
            : undefined);
    const [isLoading, setIsLoading] = useState(false);
    const { openAlert } = useAlert();
    const { changes } = useChangePolling();
    const [nextAllowedFetchAt, setNextAllowedFetchAt] = useState(0);

    const fetchComments = useCallback(async () => {
        if (!["editor", "user"].includes(computedUserType)) {
            return;
        }
        const now = Date.now();
        if (now < nextAllowedFetchAt) {
            return;
        }
        setIsLoading(true);
        try {
            const commentsResponse = await fetch("/api/comments");
            if (
                commentsResponse.status === 401 ||
                commentsResponse.status === 403
            ) {
                // Not authorized to view comments; don't keep polling until auth changes
                dispatch({ type: "refresh", newState: buildCommentsState([]) });
                setLastUpdate(new Date().getTime());
                // Back off for 10s on auth failure
                setNextAllowedFetchAt(Date.now() + 10_000);
                return;
            }
            if (!commentsResponse.ok) {
                dispatch({ type: "refresh", newState: buildCommentsState([]) });
                setLastUpdate(new Date().getTime());
                // Short backoff for other errors
                setNextAllowedFetchAt(Date.now() + 5_000);
                return;
            }
            const commentsJson = await commentsResponse.json();
            const list = Array.isArray(commentsJson?.comments)
                ? commentsJson.comments
                : [];
            dispatch({ type: "refresh", newState: buildCommentsState(list) });
            setLastUpdate(new Date().getTime());
            // Allow immediate next check after a successful fetch
            setNextAllowedFetchAt(0);
        } catch (_) {
            // On error, reset to empty without crashing
            dispatch({ type: "refresh", newState: buildCommentsState([]) });
            setLastUpdate(new Date().getTime());
            setNextAllowedFetchAt(Date.now() + 5_000);
        } finally {
            setIsLoading(false);
        }
    }, [computedUserType, nextAllowedFetchAt]);

    const checkForUpdates = useCallback(async () => {
        if (!lastUpdate) {
            return fetchComments();
        }
        const newerChanges = changes.filter(
            (change) =>
                new Date(change.updated).getTime() > lastUpdate &&
                change.tablename === "comments",
        );
        if (!newerChanges.length) {
            return;
        }
        return fetchComments();
    }, [changes, lastUpdate, fetchComments]);

    useEffect(() => {
        checkForUpdates();
    }, [computedUserType, changes, lastUpdate, checkForUpdates]);

    const childData = {
        comments: commentsData.comments,
        commentsByActivityId: commentsData.commentsByActivityId,
        isLoading,
        createComment: async ({ message, activityId }) => {
            const response = await fetch("/api/comments", {
                method: "POST",
                body: JSON.stringify({ message, activityId }),
            });
            if (!response.ok) {
                let msg = "Failed to create comment";
                if (response.status === 401) {
                    msg =
                        "Please sign in to comment (enter editor or user passcode).";
                } else if (response.status === 403) {
                    msg =
                        "Your passcode is invalid or expired. Please re-enter it.";
                } else {
                    try {
                        const err = await response.json();
                        if (err?.message) msg = err.message;
                    } catch (_) {}
                }
                openAlert(msg, "error");
                return;
            }
            const updatedCommentJson = await response.json();
            const updatedComment = updatedCommentJson.comments[0];
            dispatch({ type: "create", comment: updatedComment });
        },
        deleteComment: async (id) => {
            const response = await fetch(`/api/comments/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                let msg = "Failed to delete comment";
                if (response.status === 401) {
                    msg = "Please sign in to delete your comment.";
                } else if (response.status === 403) {
                    msg = "You can only delete your own comment.";
                }
                openAlert(msg, "error");
                return;
            }
            dispatch({ type: "delete", id });
        },
        editComment: async (id, message) => {
            const response = await fetch(`/api/comments/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ comment: { message } }),
            });
            if (!response.ok) {
                let msg = "Failed to edit comment";
                if (response.status === 401) {
                    msg = "Please sign in to edit your comment.";
                } else if (response.status === 403) {
                    msg = "You can only edit your own comment.";
                }
                openAlert(msg, "error");
                return;
            }
            dispatch({ type: "patch", comment: { id, message } });
        },
    };
    return (
        <CommentsContext.Provider value={commentsData}>
            <CommentsDispatchContext.Provider value={dispatch}>
                {children(childData)}
            </CommentsDispatchContext.Provider>
        </CommentsContext.Provider>
    );
};

export default CommentsContainer;

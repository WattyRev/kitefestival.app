import {
    createContext,
    useEffect,
    useReducer,
    useState,
    useCallback,
} from "react";
import { useAlert } from "./ui/Alert";
import { useChangePolling } from "./ChangePollingContainer";
import { useAuth } from "./global/Auth";
import {
    createComment,
    deleteComment,
    editComment,
    getComments,
} from "../app/api/comments";

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
    const [isLoading, setIsLoading] = useState(false);
    const { openAlert } = useAlert();
    const { changes } = useChangePolling();

    const fetchComments = useCallback(async () => {
        if (!["editor", "user"].includes(auth.userType)) {
            return;
        }
        setIsLoading(true);
        const { comments } = await getComments();
        dispatch({
            type: "refresh",
            newState: {
                comments,
                commentsByActivityId: comments.reduce((acc, comment) => {
                    if (!acc[comment.activityId]) {
                        acc[comment.activityId] = [];
                    }
                    acc[comment.activityId].push(comment);
                    return acc;
                }, {}),
            },
        });
        setLastUpdate(new Date().getTime());
        setIsLoading(false);
    }, [auth.userType]);

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
    }, [auth.userType, changes, lastUpdate, checkForUpdates]);

    const childData = {
        comments: commentsData.comments,
        commentsByActivityId: commentsData.commentsByActivityId,
        isLoading,
        createComment: async ({ message, activityId }) => {
            let createResponse;
            try {
                createResponse = await createComment({ message, activityId });
            } catch (error) {
                openAlert("Failed to create comment", "error");
                return;
            }
            dispatch({ type: "create", comment: createResponse.comment });
        },
        deleteComment: async (id) => {
            try {
                await deleteComment(id);
            } catch (error) {
                openAlert("Failed to delete comment", "error");
                return;
            }
            dispatch({ type: "delete", id });
        },
        editComment: async (id, message) => {
            try {
                await editComment(id, { message });
            } catch (error) {
                openAlert("Failed to edit comment", "error");
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

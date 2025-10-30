import {
    createContext,
    useEffect,
    useReducer,
    useState,
    useCallback,
} from "react";
import { useAlert } from "./ui/Alert";
import { useChangePolling } from "./ChangePollingContainer";
import {
    createActivity,
    deleteActivity,
    editActivities,
    editActivity,
    getActivities,
} from "../app/api/activities";

export const ActivitiesContext = createContext({
    activities: [],
    scheduledActivities: [],
    unscheduledActivities: [],
});

export const ActivitiesDispatchContext = createContext(null);

let lastUpdate = new Date().getTime() - 15000;

function sortActivities(activities) {
    const sortedActivities = [...activities];
    const aBeforeB = -1;
    const bBeforeA = 1;
    sortedActivities.sort((a, b) => {
        if (a.scheduleIndex !== null && b.scheduleIndex === null) {
            return aBeforeB;
        }
        if (a.scheduleIndex === null && b.scheduleIndex !== null) {
            return bBeforeA;
        }
        if (a.scheduleIndex !== null && b.scheduleIndex !== null) {
            return a.scheduleIndex - b.scheduleIndex;
        }
        return a.sortIndex - b.sortIndex;
    });
    return sortedActivities;
}

function buildActivitiesState(activities) {
    const sortedActivities = sortActivities(activities);
    const newState = sortedActivities.reduce(
        (acc, activity) => {
            acc.activities.push(activity);
            if (
                activity.scheduleIndex !== null &&
                activity.sortIndex === null
            ) {
                acc.scheduledActivities.push(activity);
            }
            if (
                activity.sortIndex !== null &&
                activity.scheduleIndex === null
            ) {
                acc.unscheduledActivities.push(activity);
            }
            return acc;
        },
        { activities: [], unscheduledActivities: [], scheduledActivities: [] },
    );
    return newState;
}

const ActivitiesReducer = (state, action) => {
    switch (action.type) {
        case "delete": {
            if (!action.id) {
                throw new Error("No id provided to delete activity from state");
            }
            return buildActivitiesState(
                state.activities.filter(
                    (activity) => activity.id !== action.id,
                ),
            );
        }
        case "patch": {
            if (!action?.activity?.id) {
                throw new Error("No id provided to patch activity from state");
            }
            return buildActivitiesState(
                state.activities.map((activity) => {
                    if (activity.id === action.activity.id) {
                        Object.assign(activity, action.activity);
                    }
                    return activity;
                }),
            );
        }
        case "create": {
            if (!action.activity) {
                throw new Error("No activity provided to create");
            }
            const newState = {
                ...state,
                activities: [...state.activities, action.activity],
                unscheduledActivities: [
                    ...state.unscheduledActivities,
                    action.activity,
                ],
            };
            return newState;
        }
        case "bulkUpdate": {
            return buildActivitiesState(action.activities);
        }
        case "refresh": {
            return action.newState;
        }
        default: {
            throw new Error(`Unhandled activities action type: ${action.type}`);
        }
    }
};

function reindexActivities(activities) {
    let changedActivities = [];
    const sortedActivities = sortActivities(activities);
    let scheduleIndex = 0;
    let sortIndex = 0;
    const newActivities = sortedActivities.map((activity, index) => {
        if (activity.scheduleIndex !== null) {
            if (activity.scheduleIndex !== index) {
                changedActivities.push(activity);
            }
            activity.scheduleIndex = scheduleIndex;
            scheduleIndex = scheduleIndex + 1;
            return activity;
        }
        if (activity.sortIndex !== index) {
            changedActivities.push(activity);
        }
        activity.sortIndex = sortIndex;
        sortIndex = sortIndex + 1;
        return activity;
    });

    return { changedActivities, newActivities };
}

const ActivitiesContainer = ({ children, initialActivities, eventId }) => {
    const [activitiesData, dispatch] = useReducer(ActivitiesReducer, {
        activities: initialActivities,
        scheduledActivities: initialActivities.filter(
            (activity) => activity.scheduleIndex !== null,
        ),
        unscheduledActivities: initialActivities.filter(
            (activity) => activity.scheduleIndex === null,
        ),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [undoState, setUndoState] = useState(null);
    const { openAlert } = useAlert();
    const { changes } = useChangePolling();

    const fetchActivities = useCallback(async () => {
        setIsLoading(true);
        const { activities } = await getActivities(eventId);
        dispatch({
            type: "refresh",
            newState: {
                activities,
                scheduledActivities: activities.filter(
                    (activity) => activity.scheduleIndex !== null,
                ),
                unscheduledActivities: activities.filter(
                    (activity) => activity.scheduleIndex === null,
                ),
            },
        });
        setIsLoading(false);
    }, []);

    const checkForUpdates = useCallback(async () => {
        const newerChanges = changes.filter(
            (change) =>
                new Date(change.updated).getTime() > lastUpdate &&
                change.tablename === "activities",
        );
        if (!newerChanges.length) {
            return;
        }
        lastUpdate = new Date().getTime();
        return fetchActivities();
    }, [changes, fetchActivities]);

    useEffect(() => {
        checkForUpdates();
    }, [changes, checkForUpdates]);

    const childData = {
        activities: activitiesData.activities,
        scheduledActivities: activitiesData.scheduledActivities,
        unscheduledActivities: activitiesData.unscheduledActivities,
        isLoading,
        createActivity: async ({ title, description, music, eventId }) => {
            let creationResponse;
            try {
                creationResponse = await createActivity({
                    title,
                    description,
                    music,
                    eventId,
                });
            } catch (error) {
                openAlert("Failed to create activity", "error");
                return;
            }
            dispatch({ type: "create", activity: creationResponse.activity });
            // Clear undo since creating an activity changes the list
            setUndoState(null);
        },
        deleteActivity: async (id) => {
            try {
                await deleteActivity(id);
            } catch (error) {
                openAlert("Failed to delete activity", "error");
                return;
            }
            dispatch({ type: "delete", id });
            // Clear undo since deleting an activity changes the list
            setUndoState(null);
        },
        editActivity: async (activity) => {
            try {
                await editActivity(activity.id, activity);
            } catch (error) {
                openAlert("Failed to edit activity", "error");
                return;
            }
            dispatch({ type: "patch", activity });
            // Clear undo since editing an activity changes the data
            setUndoState(null);
        },
        moveActivity: async (id, bucketName, index) => {
            // Capture current state for undo (only store essential positioning data)
            const previousState = {
                activities: activitiesData.activities.map((activity) => ({
                    id: activity.id,
                    sortIndex: activity.sortIndex,
                    scheduleIndex: activity.scheduleIndex,
                })),
                timestamp: Date.now(),
            };

            const activitiesClone = [...activitiesData.activities];
            // Set activity's new position
            const currentActivity = activitiesClone.find(
                (activity) => activity.id === id,
            );
            if (bucketName === "schedule") {
                currentActivity.sortIndex = null;
                currentActivity.scheduleIndex = index - 0.5;
            } else if (bucketName === "unschedule") {
                currentActivity.sortIndex = index - 0.5;
                currentActivity.scheduleIndex = null;
            }

            // Reindex all activities
            const { changedActivities, newActivities } =
                reindexActivities(activitiesClone);

            // Patch changed activities (fire and forget for responsive UI, but handle errors)
            // Don't wait for request to complete before updating state
            editActivities(changedActivities).catch(() => {
                openAlert("Failed to move activities", "error");
            });

            // Store undo state after successful server update
            setUndoState(previousState);

            // Dispatch state update
            dispatch({ type: "bulkUpdate", activities: newActivities });
        },
        undoLastMove: async () => {
            if (!undoState) {
                return;
            }

            // Store the undo state before clearing it
            const previousState = undoState;

            // Restore previous positions by merging with current activities
            const restoredActivities = activitiesData.activities.map(
                (activity) => {
                    const previousActivity = previousState.activities.find(
                        (prev) => prev.id === activity.id,
                    );
                    if (previousActivity) {
                        return {
                            ...activity,
                            sortIndex: previousActivity.sortIndex,
                            scheduleIndex: previousActivity.scheduleIndex,
                        };
                    }
                    return activity;
                },
            );

            // Restore previous state immediately for responsive UI
            dispatch({ type: "bulkUpdate", activities: restoredActivities });

            // Clear the undo state after use
            setUndoState(null);

            // Patch all activities back to their previous state (fire and forget)
            // Don't wait for request to complete before updating state
            editActivities(previousState.activities).catch(() => {
                openAlert("Failed to undo move", "error");
            });
        },
        hasUndo: !!undoState,
        clearUndo: () => setUndoState(null),
    };

    return (
        <ActivitiesContext.Provider value={activitiesData}>
            <ActivitiesDispatchContext.Provider value={dispatch}>
                {children(childData)}
            </ActivitiesDispatchContext.Provider>
        </ActivitiesContext.Provider>
    );
};

export default ActivitiesContainer;

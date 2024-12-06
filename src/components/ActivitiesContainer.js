import { createContext, useEffect, useReducer, useState } from "react";
import fetch from '../util/fetch';
import { useAlert } from "./ui/Alert";
import { useChangePolling } from "./ChangePollingContainer";

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
            return aBeforeB
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
            if (activity.scheduleIndex !== null && activity.sortIndex === null) {
                acc.scheduledActivities.push(activity);
            }
            if (activity.sortIndex !== null && activity.scheduleIndex === null) {
                acc.unscheduledActivities.push(activity);
            }
            return acc;
        }, 
        {activities: [], unscheduledActivities: [], scheduledActivities: []}
    );
    return newState;
}

const ActivitiesReducer = (state, action) => {
    switch (action.type) {
        case 'delete' : {
            if (!action.id) {
                throw new Error('No id provided to delete activity from state');
            }
            return buildActivitiesState(state.activities.filter(activity => activity.id !== action.id));
        }
        case 'patch' : {
            if (!action?.activity?.id) {
                throw new Error('No id provided to patch activity from state');
            }
            return buildActivitiesState(state.activities.map(activity => {
                if (activity.id === action.activity.id) {
                    Object.assign(activity, action.activity);
                }
                return activity;
            }))
        }
        case 'create' : {
            if (!action.activity) {
                throw new Error('No activity provided to create');
            }
            const newState = { 
                ...state,
                activities: [...state.activities, action.activity],
                unscheduledActivities: [...state.unscheduledActivities, action.activity],
            };
            return newState;
        }
        case 'bulkUpdate': {
            return buildActivitiesState(action.activities);
        }
        case 'refresh': {
            return action.newState;
        }
        default: {
            throw new Error(`Unhandled activities action type: ${action.type}`);
        }
    }
}

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

const ActivitiesContainer = ({ children, initialActivities }) => {
    const [activitiesData, dispatch] = useReducer(ActivitiesReducer, {
        activities: initialActivities,
        scheduledActivities: initialActivities.filter(activity => activity.scheduleIndex !== null),
        unscheduledActivities: initialActivities.filter(activity => activity.scheduleIndex === null),
    });
    const [isLoading, setIsLoading] = useState(false);
    const { openAlert } = useAlert();
    const { changes } = useChangePolling();

    const fetchActivities = async () => {
        setIsLoading(true);
        const activitiesResponse = await fetch('/api/activities')
        const activitiesJson = await activitiesResponse.json();
        const { activities } = activitiesJson;
        dispatch({ type: 'refresh', newState: {
            activities, 
            scheduledActivities: activities.filter(activity => activity.scheduleIndex !== null), 
            unscheduledActivities: activities.filter(activity => activity.scheduleIndex === null)
        }});
        setIsLoading(false);
    }

    const checkForUpdates = async () => {
        const newerChanges = changes.filter(change => new Date(change.updated).getTime() > lastUpdate && change.tablename === 'activities');
        if (!newerChanges.length) {
            return;
        }
        lastUpdate = new Date().getTime();
        return fetchActivities();
    }

    useEffect(() => {
        checkForUpdates();
    }, [changes])

    const childData = {
        activities: activitiesData.activities,
        scheduledActivities: activitiesData.scheduledActivities,
        unscheduledActivities: activitiesData.unscheduledActivities,
        isLoading,
        createActivity: async ({ title, description }) => {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            })
            if (!response.ok) {
                openAlert('Failed to create activity', 'error');
                return;
            }
            const updatedActivityJson = await response.json();
            const updatedActivity = updatedActivityJson.activities[0];
            dispatch({ type: 'create', activity: updatedActivity });
        },
        deleteActivity: async (id) => {
            const response = await fetch(`/api/activities/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                openAlert('Failed to delete activity', 'error');
                return;
            }
            dispatch({ type: 'delete', id });
        },
        scheduleActivity: async (id) => {
            const highestScheduleIndex = activitiesData.scheduledActivities.sort((a, b) => b.scheduleIndex - a.scheduleIndex)[0]?.scheduleIndex;
            const scheduleIndex = highestScheduleIndex + 1 || 0;
            const activity = {
                id,
                scheduleIndex,
                sortIndex: null
            }
            const response = await fetch(`/api/activities/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    activity
                })
            });
            if (!response.ok) {
                openAlert('Failed to schedule activity', 'error');
                return;
            }
            dispatch({ type: 'patch', activity})
        },
        unscheduleActivity: async (id) => {
            const highestSortIndex = activitiesData.unscheduledActivities.sort((a, b) => b.sortIndex - a.sortIndex)[0]?.sortIndex;
            const sortIndex = highestSortIndex + 1 || 0;
            const activity = {
                id,
                sortIndex,
                scheduleIndex: null
            }
            const response = await fetch(`/api/activities/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    activity
                })
            });
            if (!response.ok) {
                openAlert('Failed to unschedule activity', 'error');
                return;
            }
            dispatch({ type: 'patch', activity})
        },
        moveActivityUp: async (id) => {
            // Find the activity above the current activity
            let overtakingActivity;
            const activitiesClone = [...activitiesData.activities];
            const currentActivity = activitiesClone.find((activity) => {
                if (activity.id === id) {
                    return true;
                }
                overtakingActivity = activity;
            });
            if (!overtakingActivity ||
                (currentActivity.scheduleIndex === null && overtakingActivity.scheduleIndex !== null) ||
                (currentActivity.sortIndex === null && overtakingActivity.sortIndex !== null)) {
                console.error('Cannnot move activity up because it is already at the top of its list');
                return;
            }

            // Set the current activity's index slightly lower than the higher ranking activity
            if(currentActivity.scheduleIndex !== null) {
                currentActivity.scheduleIndex = overtakingActivity.scheduleIndex - 0.1;
            } else if (currentActivity.sortIndex !== null) {
                currentActivity.sortIndex = overtakingActivity.sortIndex - 0.1;
            }

            // Reindex all activities
            const { changedActivities, newActivities } = reindexActivities(activitiesClone);

            // Patch changed activities
            await fetch('/api/activities', { 
                method: 'PATCH',
                body: JSON.stringify({
                    activities: changedActivities
                })
            })

            // Dispatch state update
            dispatch({ type: 'bulkUpdate', activities: newActivities });
        },
        moveActivityDown: async (id) => {
            // Find the current activity and the activity below the current activity
            let overtakingActivity;
            const activitiesClone = [...activitiesData.activities];
            const currentActivity = activitiesClone.find((activity, index) => {
                if (activity.id === id) {
                    overtakingActivity = activitiesClone[index + 1];
                    return true;
                }
            });
            if (!overtakingActivity ||
                (currentActivity.scheduleIndex === null && overtakingActivity.scheduleIndex !== null) ||
                (currentActivity.sortIndex === null && overtakingActivity.sortIndex !== null)) {
                console.error('Cannnot move activity down because it is already at the bottom of its list');
                return;
            }

            // Set the current activity's index slightly lower than the lower ranking activity
            if(currentActivity.scheduleIndex !== null) {
                currentActivity.scheduleIndex = overtakingActivity.scheduleIndex + 0.1;
            } else if (currentActivity.sortIndex !== null) {
                currentActivity.sortIndex = overtakingActivity.sortIndex + 0.1;
            }

            // Reindex all activities
            const { changedActivities, newActivities } = reindexActivities(activitiesClone);

            // Patch changed activities
            await fetch('/api/activities', { 
                method: 'PATCH',
                body: JSON.stringify({
                    activities: changedActivities
                })
            })

            // Dispatch state update
            dispatch({ type: 'bulkUpdate', activities: newActivities });
        }
    }

    return (
        <ActivitiesContext.Provider value={activitiesData}>
            <ActivitiesDispatchContext.Provider value={dispatch}>
                {children?.(childData)}
            </ActivitiesDispatchContext.Provider>
        </ActivitiesContext.Provider>
    )
};

export default ActivitiesContainer;
import { createContext, useEffect, useReducer, useState } from "react";
import fetch from '../util/fetch';
import setInterval from '../util/setInterval';
import clearInterval from '../util/clearInterval';
import { useAuth } from "./global/Auth";
import { useAlert } from "./ui/Alert";

export const ActivitiesContext = createContext({
    activities: [],
    scheduledActivities: [],
    unscheduledActivities: [],
});

export const ActivitiesDispatchContext = createContext(null);

let lastUpdate = new Date().getTime() - 15000;

function buildActivitiesState(activities) {
    const newState = activities.reduce(
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
    const aBeforeB = -1;
    const bBeforeA = 1;
    let changedActivities = [];
    activities.sort((a, b) => {
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
    const newActivities = activities.map((activity, index) => {
        if (activity.scheduleIndex !== null) {
            if (activity.scheduleIndex !== index) {
                changedActivities.push(activity);
            }
            activity.scheduleIndex = index;
            return activity;
        } 
        if (activity.sortIndex !== index) {
            changedActivities.push(activity);
        }
        activity.sortIndex = index;
        return activity;
    });

    return { changedActivities, newActivities };
}

const ActivitiesContainer = ({ children, initialActivities }) => {
    const { auth } = useAuth();
    const [activitiesData, dispatch] = useReducer(ActivitiesReducer, {
        activities: initialActivities,
        scheduledActivities: initialActivities.filter(activity => activity.scheduleIndex !== null),
        unscheduledActivities: initialActivities.filter(activity => activity.scheduleIndex === null),
    });
    const [isLoading, setIsLoading] = useState(false);
    const { openAlert } = useAlert();

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
        const changesResponse = await fetch('/api/changes');
        if (!changesResponse.ok) {
            return;
        }
        const changesJson = await changesResponse.json();
        const { changes } = changesJson;
        if (!changes?.length) {
            return;
        }
        const newerChanges = changes.filter(change => new Date(change.updated).getTime() > lastUpdate);
        if (!newerChanges.length) {
            return;
        }
        lastUpdate = new Date().getTime();
        const refreshPromises = newerChanges.map(change => {
            if (change.tablename === 'activities') {
                return fetchActivities();
            }
            return Promise.resolve();
        });
        return Promise.all(refreshPromises);
    }

    useEffect(() => {
        checkForUpdates();
        const interval = setInterval(() => {
            checkForUpdates();
        }, 5000);
        return () => clearInterval(interval);
      }, [])

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
                body: JSON.stringify({ title, description, passcode: auth?.passcode })
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
                method: 'DELETE',
                body: JSON.stringify({
                    passcode: auth?.passcode
                })
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
                    passcode: auth?.passcode,
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
                    passcode: auth?.passcode,
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
                    activities: changedActivities,
                    passcode: auth?.passcode
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
                    activities: changedActivities,
                    passcode: auth?.passcode
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
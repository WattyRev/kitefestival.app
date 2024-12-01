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

const ActivitiesReducer = (state, action) => {
    switch (action.type) {
        case 'delete' : {
            if (!action.id) {
                throw new Error('No id provided to delete activity from state');
            }
            const newState = state.activities.reduce(
                (acc, activity) => {
                    if (activity.id === action.id) {
                        return acc;
                    }
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
        case 'patch' : {
            if (!action?.activity?.id) {
                throw new Error('No id provided to patch activity from state');
            }
            const newState = state.activities.reduce(
                (acc, activity) => {
                    if (activity.id === action.activity.id) {
                        Object.assign(activity, action.activity);
                    }
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
        case 'refresh': {
            return action.newState;
        }
        default: {
            throw new Error(`Unhandled activities action type: ${action.type}`);
        }
    }
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
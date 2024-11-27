import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { AuthContext } from "./global/Auth";

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
    const { auth } = useContext(AuthContext);
    const [activitiesData, dispatch] = useReducer(ActivitiesReducer, {
        activities: initialActivities,
        scheduledActivities: initialActivities.filter(activity => activity.scheduleIndex !== null),
        unscheduledActivities: initialActivities.filter(activity => activity.scheduleIndex === null),
    });
    const [isLoading, setIsLoading] = useState(false);

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
    }

    const checkForUpdates = async () => {
        const changesResponse = await fetch('/api/changes');
        const changesJson = await changesResponse.json();
        const { changes } = changesJson;
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
                alert('Failed to create activity');
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
                alert('Failed to delete activity');
                return;
            }
            dispatch({ type: 'delete', id });
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
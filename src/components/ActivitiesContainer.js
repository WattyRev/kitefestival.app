import { createContext, useReducer } from "react";

export const ActivitiesContext = createContext({
    activities: [],
    scheduledActivities: [],
    unscheduledActivities: [],
});

export const ActivitiesDispatchContext = createContext(null);

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
        default: {
            throw new Error(`Unhandled activities action type: ${action.type}`);
        }
    }
}

export const ActivitiedProvider = ({ children, initialActivities }) => {
    const [activitiesData, dispatch] = useReducer(ActivitiesReducer, {
        activities: initialActivities,
        scheduledActivities: initialActivities.filter(activity => activity.scheduleIndex !== null),
        unscheduledActivities: initialActivities.filter(activity => activity.scheduleIndex === null),
    })

    return (
        <ActivitiesContext.Provider value={activitiesData}>
            <ActivitiesDispatchContext.Provider value={dispatch}>
                {children}
            </ActivitiesDispatchContext.Provider>
        </ActivitiesContext.Provider>
    )
};
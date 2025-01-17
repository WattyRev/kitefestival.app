import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetch from '../../util/fetch';
import setInterval from '../../util/setInterval';
import { useAuth } from '../global/Auth';
import { useAlert } from '../ui/Alert';
import { useChangePolling } from "../ChangePollingContainer";
import ActivitiesContainer from '../ActivitiesContainer';

jest.mock('../../util/fetch');
jest.mock('../../util/setInterval');
jest.mock('../../util/clearInterval');
jest.mock('../global/Auth');
jest.mock('../ui/Alert');
jest.mock('../ChangePollingContainer');

describe('ActivitiesContainer', () => {
    let initialActivities;
    let mockOpenAlert;
    beforeEach(() => {
        useChangePolling.mockReturnValue({
            changes: []
        })
        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({})
        });
        setInterval.mockReturnValue(1);
        initialActivities = [
            {
                id: '1',
                name: 'Activity 1',
                description: 'Description 1',
                sortIndex: null,
                scheduleIndex: 0
            },
            {
                id: '2',
                name: 'Activity 2',
                description: 'Description 2',
                sortIndex: null,
                scheduleIndex: 1
            },
            {
                id: '3',
                name: 'Activity 3',
                description: 'Description 3',
                sortIndex: 0,
                scheduleIndex: null
            },
            {
                id: '4',
                name: 'Activity 4',
                description: 'Description 4',
                sortIndex: 1,
                scheduleIndex: null
            }
        ];
        useAuth.mockReturnValue({
            auth: {
                passcode: 'boogers-passcode'
            }
        });
        mockOpenAlert = jest.fn();
        useAlert.mockReturnValue({
            openAlert: mockOpenAlert
        });
    });
    it('provides activities', async () => {
        render(<ActivitiesContainer initialActivities={initialActivities} >
            {({ activities }) => (
                <>
                    {activities.map(activity => (
                        <div data-testid="activity" key={activity.id}>{activity.name}</div>
                    ))}
                </>
            )}
        </ActivitiesContainer>);

        expect(screen.queryAllByTestId('activity')).toHaveLength(4);
    });
    it('provides scheduledActivities', async () => {
        render(<ActivitiesContainer initialActivities={initialActivities} >
            {({ scheduledActivities }) => (
                <>
                    {scheduledActivities.map(activity => (
                        <div data-testid="activity" key={activity.id}>{activity.name}</div>
                    ))}
                </>
            )}
        </ActivitiesContainer>);

        expect(screen.queryAllByTestId('activity')).toHaveLength(2);
        expect(screen.getAllByTestId('activity')[0]).toHaveTextContent('Activity 1');
    });
    it('provides unscheduledActivities', async () => {
        render(<ActivitiesContainer initialActivities={initialActivities} >
            {({ unscheduledActivities }) => (
                <>
                    {unscheduledActivities.map(activity => (
                        <div data-testid="activity" key={activity.id}>{activity.name}</div>
                    ))}
                </>
            )}
        </ActivitiesContainer>);

        expect(screen.queryAllByTestId('activity')).toHaveLength(2);
        expect(screen.queryAllByTestId('activity')[0]).toHaveTextContent('Activity 3');
    });
    it('indicates when it is loading new activity data', async () => {
        useChangePolling.mockReturnValue({
            changes: [{
                tablename: 'activities',
                updated: new Date().toISOString()
            }]
        })
        let activitiesResolver;
        fetch.mockImplementation(url => {
            if (url === '/api/activities') {
                return new Promise(resolve => {
                    activitiesResolver = () => resolve({
                        ok: true,
                        json: jest.fn().mockResolvedValue({
                            activities: initialActivities
                        })
                    });
                })
            }
        });

        render(<ActivitiesContainer initialActivities={initialActivities} >
            {({ isLoading }) => (
                <>
                    {<div data-testid="loading">{isLoading ? 'loading' : 'not loading'}</div>}
                </>
            )}
        </ActivitiesContainer>);

        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('loading'));

        activitiesResolver();

        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('not loading'));
    });
    describe('activity creation', () => {
        it('allows a user to create an activity', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities' && options.method === 'POST') {
                    const { title, description } = JSON.parse(options.body);
                    return Promise.resolve({
                        ok: true,
                        json: jest.fn().mockResolvedValue({
                            activities: [
                                {
                                    id: '5',
                                    name: title,
                                    description,
                                    sortIndex: 1,
                                    scheduleIndex: null
                                }
                            ]
                        })
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ createActivity, activities }) => (
                    <>
                        {activities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button data-testid="create-activity" onClick={() => createActivity({
                            title: 'Activity 5',
                            description: 'Description 5'
                        })}>Create Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            expect(screen.queryAllByTestId('activity')).toHaveLength(4);

            await userEvent.click(screen.getByTestId('create-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Activity 5',
                    description: 'Description 5'
                })
            });

            expect(screen.queryAllByTestId('activity')).toHaveLength(5);
        });
        it('alerts if activity creation fails', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities' && options.method === 'POST') {
                    return Promise.resolve({
                        ok: false,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ createActivity }) => (
                    <>
                        <button data-testid="create-activity" onClick={() => createActivity({
                            title: 'Activity 5',
                            description: 'Description 5'
                        })}>Create Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            await userEvent.click(screen.getByTestId('create-activity'));

            expect(mockOpenAlert).toHaveBeenCalledWith('Failed to create activity', 'error');
        });
    });
    describe('activity deletion', () => {
        it('allows a user to delete an activity', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities/2' && options.method === 'DELETE') {
                    return Promise.resolve({
                        ok: true,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ deleteActivity, activities }) => (
                    <>
                        {activities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button data-testid="delete-activity" onClick={() => deleteActivity('2')}>Delete Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            expect(screen.queryAllByTestId('activity')).toHaveLength(4);

            await userEvent.click(screen.getByTestId('delete-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities/2', {
                method: 'DELETE'
            });

            expect(screen.queryAllByTestId('activity')).toHaveLength(3);
        });
        it('alerts if activity deletion fails', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities/2' && options.method === 'DELETE') {
                    return Promise.resolve({
                        ok: false,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ deleteActivity }) => (
                    <>
                        <button data-testid="delete-activity" onClick={() => deleteActivity('2')}>Delete Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            await userEvent.click(screen.getByTestId('delete-activity'));

            expect(mockOpenAlert).toHaveBeenCalledWith('Failed to delete activity', 'error');
        });
    });
    describe('activity editing', () => {
        it('allows a user to edit an activity', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities/2' && options.method === 'PATCH') {
                    return Promise.resolve({
                        ok: true,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ editActivity, activities }) => (
                    <>
                        {activities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button 
                            data-testid="edit-activity" 
                            onClick={() => 
                                editActivity({
                                    id: '2',
                                    title: 'edited',
                                    description: 'also edited',
                                })
                            }
                        >Edit Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            await userEvent.click(screen.getByTestId('edit-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities/2', {
                method: 'PATCH',
                body: JSON.stringify({
                    activity: {
                        id: '2',
                        title: 'edited',
                        description: 'also edited',
                    }
                })
            });
        });
        it('alerts if activity deletion fails', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities/2' && options.method === 'PATCH') {
                    return Promise.resolve({
                        ok: false,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ editActivity }) => (
                    <>
                        <button 
                            data-testid="edit-activity"
                            onClick={() => editActivity({
                                    id: '2',
                                    title: 'edited',
                                    description: 'also edited',
                                })
                            }
                        >Edit Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            await userEvent.click(screen.getByTestId('edit-activity'));

            expect(mockOpenAlert).toHaveBeenCalledWith('Failed to update activity', 'error');
        });
    });
    describe('scheduling an activity', () => {
        it('allows a user to schedule an activity', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities' && options.method === 'PATCH') {
                    return Promise.resolve({
                        ok: true,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities}>
                {
                    ({ 
                        moveActivity,
                        scheduledActivities,
                        unscheduledActivities
                    }) => (
                        <>
                            {scheduledActivities.map(activity => (
                                <div data-testid="scheduled" key={activity.id}>{activity.name}</div>
                            ))}
                            {unscheduledActivities.map(activity => (
                                <div data-testid="unscheduled" key={activity.id}>{activity.name}</div>
                            ))}
                            <button data-testid="schedule-activity" onClick={() => moveActivity('3', 'schedule', 3)}>Schedule Activity</button>
                        </>
                    )
                }
            </ActivitiesContainer>);

            expect(screen.queryAllByTestId('scheduled')).toHaveLength(2);
            expect(screen.queryAllByTestId('unscheduled')).toHaveLength(2);

            await userEvent.click(screen.getByTestId('schedule-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities', {
                method: 'PATCH',
                body: JSON.stringify({
                    "activities":[
                        {
                            "id":"3",
                            "name":"Activity 3",
                            "description":"Description 3",
                            "sortIndex":null,
                            "scheduleIndex":2
                        },
                        {
                            "id":"4",
                            "name":"Activity 4",
                            "description":"Description 4",
                            "sortIndex":0,
                            "scheduleIndex":null
                        }
                    ]
                })
            });

            expect(screen.queryAllByTestId('scheduled')).toHaveLength(3);
            expect(screen.queryAllByTestId('scheduled')[2]).toHaveTextContent('Activity 3');
            expect(screen.queryAllByTestId('unscheduled')).toHaveLength(1);
        });
        it('alerts if activity scheduling fails', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities' && options.method === 'PATCH') {
                    return Promise.resolve({
                        ok: false,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities}>
                {
                    ({ 
                        moveActivity,
                    }) => (
                        <>
                            <button data-testid="schedule-activity" onClick={() => moveActivity('2', 'schedule', 3)}>Schedule Activity</button>
                        </>
                    )
                }
            </ActivitiesContainer>);

            await userEvent.click(screen.getByTestId('schedule-activity'));

            expect(mockOpenAlert).toHaveBeenCalledWith('Failed to move activities', 'error');
        });
    });
    describe('unscheduling an activity', () => {
        it('allows a user to unschedule an activity', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities' && options.method === 'PATCH') {
                    return Promise.resolve({
                        ok: true,
                    })
                }
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities}>
                {
                    ({ 
                        moveActivity,
                        scheduledActivities,
                        unscheduledActivities
                    }) => (
                        <>
                            {scheduledActivities.map(activity => (
                                <div data-testid="scheduled" key={activity.id}>{activity.name}</div>
                            ))}
                            {unscheduledActivities.map(activity => (
                                <div data-testid="unscheduled" key={activity.id}>{activity.name}</div>
                            ))}
                            <button data-testid="unschedule-activity" onClick={() => moveActivity('1', 'unschedule', 0)}>Unschedule Activity</button>
                        </>
                    )
                }
            </ActivitiesContainer>);

            expect(screen.queryAllByTestId('scheduled')).toHaveLength(2);
            expect(screen.queryAllByTestId('unscheduled')).toHaveLength(2);

            await userEvent.click(screen.getByTestId('unschedule-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities', {
                method: 'PATCH',
                body: JSON.stringify({
                    activities: [
                        {
                            "id": "2",
                            "name":"Activity 2",
                            "description":"Description 2",
                            "sortIndex":null,
                            "scheduleIndex":0
                        },
                        {
                            "id":"1",
                            "name":"Activity 1",
                            "description":"Description 1",
                            "sortIndex":0,
                            "scheduleIndex":null
                        },
                        {
                            "id":"3",
                            "name":"Activity 3",
                            "description":"Description 3",
                            "sortIndex":1,
                            "scheduleIndex":null
                        },
                        {
                            "id":"4",
                            "name":"Activity 4",
                            "description":"Description 4",
                            "sortIndex":2,
                            "scheduleIndex":null
                        }
                    ]
                })
            });

            expect(screen.queryAllByTestId('scheduled')).toHaveLength(1);
            expect(screen.queryAllByTestId('unscheduled')).toHaveLength(3);
            expect(screen.queryAllByTestId('unscheduled')[0]).toHaveTextContent('Activity 1');
        });
        it('alerts if activity unscheduling fails', async () => {
            fetch.mockImplementation((url, options) => {
                if (url === '/api/activities' && options.method === 'PATCH') {
                    return Promise.resolve({
                        ok: false,
                    })
                }
                console.log('unexpected fetch', url, options);
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({})
                })
            })
            render(<ActivitiesContainer initialActivities={initialActivities}>
                {
                    ({ 
                        moveActivity,
                    }) => (
                        <>
                            <button data-testid="unschedule-activity" onClick={() => moveActivity('1', 'unschedule', 0)}>Unschedule Activity</button>
                        </>
                    )
                }
            </ActivitiesContainer>);

            await userEvent.click(screen.getByTestId('unschedule-activity'));

            expect(mockOpenAlert).toHaveBeenCalledWith('Failed to move activities', 'error');
        });
    });
    describe('moving a scheduled activity', () => {
        it('allows the user to move a scheduled activity up', async () => {
            initialActivities = [
                {
                    id: '1',
                    name: 'Activity 1',
                    description: 'Description 1',
                    sortIndex: null,
                    scheduleIndex: 0
                },
                {
                    id: '2',
                    name: 'Activity 2',
                    description: 'Description 2',
                    sortIndex: null,
                    scheduleIndex: 1
                },
                {
                    id: '3',
                    name: 'Activity 3',
                    description: 'Description 3',
                    sortIndex: null,
                    scheduleIndex: 2
                },
                {
                    id: '4',
                    name: 'Activity 4',
                    description: 'Description 4',
                    sortIndex: 3,
                    scheduleIndex: null
                }
            ];

            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ scheduledActivities, moveActivity }) => (
                    <>
                        {scheduledActivities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button data-testid="move-activity-up" onClick={() => moveActivity('3', 'schedule', 1)}>Move Activity Up</button>
                    </>
                )}
            </ActivitiesContainer>);

            let activities = screen.queryAllByTestId('activity');
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent('Activity 1');
            expect(activities[1]).toHaveTextContent('Activity 2');
            expect(activities[2]).toHaveTextContent('Activity 3');

            await userEvent.click(screen.getByTestId('move-activity-up'));

            activities = screen.queryAllByTestId('activity');
            expect(activities[0]).toHaveTextContent('Activity 1');
            expect(activities[1]).toHaveTextContent('Activity 3');
            expect(activities[2]).toHaveTextContent('Activity 2');
        });
        it('allows the user to move a scheduled activity down', async () => {
            initialActivities = [
                {
                    id: '1',
                    name: 'Activity 1',
                    description: 'Description 1',
                    sortIndex: null,
                    scheduleIndex: 0
                },
                {
                    id: '2',
                    name: 'Activity 2',
                    description: 'Description 2',
                    sortIndex: null,
                    scheduleIndex: 1
                },
                {
                    id: '3',
                    name: 'Activity 3',
                    description: 'Description 3',
                    sortIndex: null,
                    scheduleIndex: 2
                },
                {
                    id: '4',
                    name: 'Activity 4',
                    description: 'Description 4',
                    sortIndex: 3,
                    scheduleIndex: null
                }
            ];

            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ scheduledActivities, moveActivity }) => (
                    <>
                        {scheduledActivities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button data-testid="move-activity-down" onClick={() => moveActivity('1', 'schedule', 2)}>Move Activity Down</button>
                    </>
                )}
            </ActivitiesContainer>);

            let activities = screen.queryAllByTestId('activity');
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent('Activity 1');
            expect(activities[1]).toHaveTextContent('Activity 2');
            expect(activities[2]).toHaveTextContent('Activity 3');

            await userEvent.click(screen.getByTestId('move-activity-down'));

            activities = screen.queryAllByTestId('activity');
            expect(activities[0]).toHaveTextContent('Activity 2');
            expect(activities[1]).toHaveTextContent('Activity 1');
            expect(activities[2]).toHaveTextContent('Activity 3');
        });
    });
    describe('moving an unscheduled activity', () => {
        it('allows the user to move an unscheduled activity up', async () => {
            initialActivities = [
                {
                    id: '1',
                    name: 'Activity 1',
                    description: 'Description 1',
                    sortIndex: null,
                    scheduleIndex: 0
                },
                {
                    id: '2',
                    name: 'Activity 2',
                    description: 'Description 2',
                    sortIndex: 1,
                    scheduleIndex: null
                },
                {
                    id: '3',
                    name: 'Activity 3',
                    description: 'Description 3',
                    sortIndex: 2,
                    scheduleIndex: null
                },
                {
                    id: '4',
                    name: 'Activity 4',
                    description: 'Description 4',
                    sortIndex: 3,
                    scheduleIndex: null
                }
            ];

            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ unscheduledActivities, moveActivity }) => (
                    <>
                        {unscheduledActivities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button data-testid="move-activity-up" onClick={() => moveActivity('4', 'unschedule', 2)}>Move Activity Up</button>
                    </>
                )}
            </ActivitiesContainer>);

            let activities = screen.queryAllByTestId('activity');
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent('Activity 2');
            expect(activities[1]).toHaveTextContent('Activity 3');
            expect(activities[2]).toHaveTextContent('Activity 4');

            await userEvent.click(screen.getByTestId('move-activity-up'));

            activities = screen.queryAllByTestId('activity');
            expect(activities[0]).toHaveTextContent('Activity 2');
            expect(activities[1]).toHaveTextContent('Activity 4');
            expect(activities[2]).toHaveTextContent('Activity 3');
        });
        it('allows the user to move an unscheduled activity down', async () => {
            initialActivities = [
                {
                    id: '1',
                    name: 'Activity 1',
                    description: 'Description 1',
                    sortIndex: null,
                    scheduleIndex: 0
                },
                {
                    id: '2',
                    name: 'Activity 2',
                    description: 'Description 2',
                    sortIndex: 1,
                    scheduleIndex: null
                },
                {
                    id: '3',
                    name: 'Activity 3',
                    description: 'Description 3',
                    sortIndex: 2,
                    scheduleIndex: null
                },
                {
                    id: '4',
                    name: 'Activity 4',
                    description: 'Description 4',
                    sortIndex: 3,
                    scheduleIndex: null
                }
            ];

            render(<ActivitiesContainer initialActivities={initialActivities} >
                {({ unscheduledActivities, moveActivity }) => (
                    <>
                        {unscheduledActivities.map(activity => (
                            <div data-testid="activity" key={activity.id}>{activity.name}</div>
                        ))}
                        <button data-testid="move-activity-down" onClick={() => moveActivity('2', 'unschedule', 3)}>Move Activity Down</button>
                    </>
                )}
            </ActivitiesContainer>);

            let activities = screen.queryAllByTestId('activity');
            expect(activities).toHaveLength(3);
            expect(activities[0]).toHaveTextContent('Activity 2');
            expect(activities[1]).toHaveTextContent('Activity 3');
            expect(activities[2]).toHaveTextContent('Activity 4');

            await userEvent.click(screen.getByTestId('move-activity-down'));

            activities = screen.queryAllByTestId('activity');
            expect(activities[0]).toHaveTextContent('Activity 3');
            expect(activities[1]).toHaveTextContent('Activity 2');
            expect(activities[2]).toHaveTextContent('Activity 4');
        });
    });
});
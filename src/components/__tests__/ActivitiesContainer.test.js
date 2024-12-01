import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetch from '../../util/fetch';
import setInterval from '../../util/setInterval';
import { useAuth } from '../global/Auth';
import { useAlert } from '../ui/Alert';
import ActivitiesContainer from '../ActivitiesContainer';

jest.mock('../../util/fetch');
jest.mock('../../util/setInterval');
jest.mock('../../util/clearInterval');
jest.mock('../global/Auth');
jest.mock('../ui/Alert');

describe('ActivitiesContainer', () => {
    let initialActivities;
    let mockOpenAlert;
    beforeEach(() => {
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
                sortIndex: 0,
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

        expect(screen.getAllByTestId('activity')).toHaveLength(2);
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

        expect(screen.getAllByTestId('activity')).toHaveLength(1);
        expect(screen.getByTestId('activity')).toHaveTextContent('Activity 1');
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

        expect(screen.getAllByTestId('activity')).toHaveLength(1);
        expect(screen.getByTestId('activity')).toHaveTextContent('Activity 2');
    });
    it('indicates when it is loading new activity data', async () => {
        let activitiesResolver;
        fetch.mockImplementation(url => {
            if (url === '/api/changes') {
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        changes: [
                            {
                                tablename: 'activities',
                                updated: new Date().toISOString()
                            }
                        ]
                    })
                });
            }
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

        expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
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
                                    id: '3',
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
                            title: 'Activity 3',
                            description: 'Description 3'
                        })}>Create Activity</button>
                    </>
                )}
            </ActivitiesContainer>);

            expect(screen.getAllByTestId('activity')).toHaveLength(2);

            await userEvent.click(screen.getByTestId('create-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Activity 3',
                    description: 'Description 3',
                    passcode: 'boogers-passcode'
                })
            });

            expect(screen.getAllByTestId('activity')).toHaveLength(3);
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
                            title: 'Activity 3',
                            description: 'Description 3'
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

            expect(screen.getAllByTestId('activity')).toHaveLength(2);

            await userEvent.click(screen.getByTestId('delete-activity'));

            expect(fetch).toHaveBeenCalledWith('/api/activities/2', {
                method: 'DELETE',
                body: JSON.stringify({
                    passcode: 'boogers-passcode'
                })
            });

            expect(screen.getAllByTestId('activity')).toHaveLength(1);
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
});
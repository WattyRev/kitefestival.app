import { render, screen } from '@testing-library/react';
import ActivitiesContainer from "../ActivitiesContainer";
import ChangePollingContainer from '../ChangePollingContainer';
import CommentsContainer from '../CommentsContainer';
import ActivityDisplay from "../ActivityDisplay";
import Comments from "../Comments";
import ActivityForm from "../ActivityForm";
import { useAuth } from "../global/Auth";
import HomePage from '../HomePage';

jest.mock('../ActivitiesContainer');
jest.mock('../ChangePollingContainer');
jest.mock('../CommentsContainer');
jest.mock('../ActivityDisplay');
jest.mock('../Comments');
jest.mock('../ActivityForm');
jest.mock('../global/Auth');


describe('HomePage', () => {
    beforeEach(() => {
        ChangePollingContainer.mockImplementation(({ children }) => <>{children}</>);
        ActivitiesContainer.mockImplementation(({ children }) => {
            return children({
                scheduledActivities: [],
                unscheduledActivities: [],
                activities: [],
                isLoading: false,
                createActivity: jest.fn(),
                deleteActivity: jest.fn(),
                moveActivityUp: jest.fn(),
                moveActivityDown: jest.fn(),
            });
        });
        CommentsContainer.mockImplementation(({ children }) => {
            return children({
                commentsByActivityId: {},
                isLoading: false,
                createComment: jest.fn(),
                deleteComment: jest.fn(),
                editComment: jest.fn(),
            });
        });
        ActivityDisplay.mockImplementation(({ children }) => (<div data-testid="activity-display" >{children}</div>));
        Comments.mockReturnValue(<div data-testid="comments" />);
        ActivityForm.mockReturnValue(<div data-testid="create-activity-form" />);
        useAuth.mockReturnValue({ isPublic: jest.fn().mockReturnValue(false), isEditor: jest.fn().mockReturnValue(true) });
    })
    it('renders', async () => {
        render(<HomePage />);
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
    it('renders an empty state when there are no unscheduledActivities', async () => {
        render(<HomePage />);
        expect(screen.getByTestId('empty-unscheduled')).toBeInTheDocument();
        expect(screen.queryByTestId('activity-display')).not.toBeInTheDocument();
    });
    it('renders an ActivityDisplay for each unscheduledActivity', async () => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            const scheduledActivities = [];
            const unscheduledActivities = [{
                id: 1,
                name: 'Activity 1',
                description: 'Description 1'
            }, {
                id: 2,
                name: 'Activity 2',
                description: 'Description 2'
            }];
            return children({
                scheduledActivities,
                unscheduledActivities,
                activities: [...scheduledActivities, ...unscheduledActivities],
                isLoading: false,
                createActivity: jest.fn(),
                deleteActivit: jest.fn(),
            });
        });

        render(<HomePage />);

        expect(screen.getAllByTestId('activity-display')).toHaveLength(2);
        expect(screen.getAllByTestId('comments')).toHaveLength(2);
    });

    it('renders an ActivityDisplay for each scheduledActivity', async () => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            const scheduledActivities = [{
                id: 1,
                name: 'Activity 1',
                description: 'Description 1'
            }, {
                id: 2,
                name: 'Activity 2',
                description: 'Description 2'
            }];
            const unscheduledActivities = [];
            return children({
                scheduledActivities,
                unscheduledActivities,
                activities: [...scheduledActivities, ...unscheduledActivities],
                isLoading: false,
                createActivity: jest.fn(),
                deleteActivit: jest.fn(),
            });
        });

        render(<HomePage />);

        expect(screen.getAllByTestId('activity-display')).toHaveLength(2);
        expect(screen.getAllByTestId('comments')).toHaveLength(2);
    });
    
    describe('move up', () => {
        beforeEach(() => {
            ActivitiesContainer.mockImplementation(({ children }) => {
                return children({
                    scheduledActivities: [
                        {
                            id: 1,
                            name: 'Activity 1',
                            description: 'Description 1',
                            scheduleIndex: 0
                        },
                        {
                            id: 2,
                            name: 'Activity 2',
                            description: 'Description 2',
                            scheduleIndex: 1
                        }
                    ],
                    unscheduledActivities: [
                        {
                            id: 3,
                            name: 'Activity 3',
                            description: 'Description 3',
                            sortIndex: 2
                        },
                        {
                            id: 4,
                            name: 'Activity 4',
                            description: 'Description 4',
                            sortIndex: 3
                        }
                    ],
                    isLoading: false,
                    createActivity: jest.fn(),
                    deleteActivit: jest.fn(),
                    moveActivityUp: jest.fn(),
                    moveActivityDown: jest.fn(),
                });
            });
            ActivityDisplay.mockImplementation(({ onMoveUp }) => {
                return <div data-testid="hasMoveUp">{onMoveUp ? 'has move up' : 'no move up'}</div>
            });
        })
        it('provides the moveUp function to activities in the schedule', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveUp');
            expect(activities[1]).toHaveTextContent('has move up');
        });
        it('does not provide the moveUp function to activities at the top of the schedule', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveUp');
            expect(activities[0]).toHaveTextContent('no move up');
        });
        it('provides the moveUp function to unscheduled activities', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveUp');
            expect(activities[3]).toHaveTextContent('has move up');
        });
        it('does not provide the moveUp function to activities at the top of the unscheduled activities', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveUp');
            expect(activities[2]).toHaveTextContent('no move up');
        });
    });
    describe('move down', () => {
        beforeEach(() => {
            ActivitiesContainer.mockImplementation(({ children }) => {
                return children({
                    scheduledActivities: [
                        {
                            id: 1,
                            name: 'Activity 1',
                            description: 'Description 1',
                            scheduleIndex: 0
                        },
                        {
                            id: 2,
                            name: 'Activity 2',
                            description: 'Description 2',
                            scheduleIndex: 1
                        }
                    ],
                    unscheduledActivities: [
                        {
                            id: 3,
                            name: 'Activity 3',
                            description: 'Description 3',
                            sortIndex: 2
                        },
                        {
                            id: 4,
                            name: 'Activity 4',
                            description: 'Description 4',
                            sortIndex: 3
                        }
                    ],
                    isLoading: false,
                    createActivity: jest.fn(),
                    deleteActivit: jest.fn(),
                    moveActivityUp: jest.fn(),
                    moveActivityDown: jest.fn(),
                });
            });
            ActivityDisplay.mockImplementation(({ onMoveDown }) => {
                return <div data-testid="hasMoveDown">{onMoveDown ? 'has move down' : 'no move down'}</div>
            });
        })
        it('provides the moveDown function to activities in the schedule', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveDown');
            expect(activities[0]).toHaveTextContent('has move down');
        });
        it('does not provide the moveDown function to activities at the bottom of the schedule', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveDown');
            expect(activities[1]).toHaveTextContent('no move down');
        });
        it('provides the moveDown function to unscheduled activities', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveDown');
            expect(activities[2]).toHaveTextContent('has move down');
        });
        it('does not provide the moveDown function to activities at the botto of the unscheduled activities', async () => {
            render(<HomePage />);
            const activities = await screen.findAllByTestId('hasMoveDown');
            expect(activities[3]).toHaveTextContent('no move down');
        });
    });
});
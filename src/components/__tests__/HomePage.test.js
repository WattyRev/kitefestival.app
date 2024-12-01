import { render, screen } from '@testing-library/react';
import ActivitiesContainer from "../ActivitiesContainer";
import ActivityDisplay from "../ActivityDisplay";
import HomePage from '../HomePage';

jest.mock('../ActivitiesContainer');
jest.mock('../ActivityDisplay');

describe('HomePage', () => {
    beforeEach(() => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            return children({
                scheduledActivities: [],
                unscheduledActivities: [],
                isLoading: false,
                createActivity: jest.fn(),
                deleteActivit: jest.fn(),
            });
        });
        ActivityDisplay.mockReturnValue(<div data-testid="activity-display" />);
    })
    it('renders', async () => {
        render(<HomePage />);
        expect(screen.getByText('Happening Now')).toBeInTheDocument();
    });
    it('renders an empty state when there are no unscheduledActivities', async () => {
        render(<HomePage />);
        expect(screen.getByTestId('empty-unscheduled')).toBeInTheDocument();
        expect(screen.queryByTestId('activity-display')).not.toBeInTheDocument();
    });
    it('renders an ActivityDisplay for each unscheduledActivity', async () => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            return children({
                scheduledActivities: [],
                unscheduledActivities: [{
                    id: 1,
                    name: 'Activity 1',
                    description: 'Description 1'
                }, {
                    id: 2,
                    name: 'Activity 2',
                    description: 'Description 2'
                }],
                isLoading: false,
                createActivity: jest.fn(),
                deleteActivit: jest.fn(),
            });
        });

        render(<HomePage />);

        expect(screen.getAllByTestId('activity-display')).toHaveLength(2);
    });

    it('renders an ActivityDisplay for each unscheduledActivity', async () => {
        ActivitiesContainer.mockImplementation(({ children }) => {
            return children({
                scheduledActivities: [{
                    id: 1,
                    name: 'Activity 1',
                    description: 'Description 1'
                }, {
                    id: 2,
                    name: 'Activity 2',
                    description: 'Description 2'
                }],
                unscheduledActivities: [],
                isLoading: false,
                createActivity: jest.fn(),
                deleteActivit: jest.fn(),
            });
        });

        render(<HomePage />);

        expect(screen.getAllByTestId('activity-display')).toHaveLength(2);
    });
});
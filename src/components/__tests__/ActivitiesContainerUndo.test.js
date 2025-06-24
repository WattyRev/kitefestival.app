import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivitiesContainer from '../ActivitiesContainer';
import fetch from '../../util/fetch';
import { useChangePolling } from '../ChangePollingContainer';
import { useAuth } from '../global/Auth';
import { useAlert } from '../ui/Alert';

jest.mock('../../util/fetch');
jest.mock('../ChangePollingContainer');
jest.mock('../global/Auth');
jest.mock('../ui/Alert');

describe('ActivitiesContainer undo functionality', () => {
    let initialActivities;
    let mockOpenAlert;    beforeEach(() => {
        useChangePolling.mockReturnValue({
            changes: []
        });
        fetch.mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({})
        });
        useAuth.mockReturnValue({
            auth: {
                passcode: 'test-passcode'
            }
        });
        mockOpenAlert = jest.fn();
        useAlert.mockReturnValue({
            openAlert: mockOpenAlert
        });

        initialActivities = [
            {
                id: '1',
                title: 'Activity 1',
                description: 'Description 1',
                sortIndex: 0,
                scheduleIndex: null
            },
            {
                id: '2',
                title: 'Activity 2',
                description: 'Description 2',
                sortIndex: 1,
                scheduleIndex: null
            },
            {
                id: '3',
                title: 'Activity 3',
                description: 'Description 3',
                sortIndex: null,
                scheduleIndex: 0
            }
        ];
    });

    it('initially does not have undo available', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo }) => (
                    <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                )}
            </ActivitiesContainer>
        );

        expect(screen.getByTestId('has-undo')).toHaveTextContent('no');
    });

    it('has undo available after moving an activity', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo, moveActivity }) => (
                    <div>
                        <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                        <button 
                            data-testid="move-activity" 
                            onClick={() => moveActivity('1', 'schedule', 1)}
                        >
                            Move Activity
                        </button>
                    </div>
                )}
            </ActivitiesContainer>
        );

        expect(screen.getByTestId('has-undo')).toHaveTextContent('no');

        await userEvent.click(screen.getByTestId('move-activity'));

        await waitFor(() => {
            expect(screen.getByTestId('has-undo')).toHaveTextContent('yes');
        });
    });

    it('can undo a move operation', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo, moveActivity, undoLastMove, unscheduledActivities, scheduledActivities }) => (
                    <div>
                        <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                        <div data-testid="unscheduled-count">{unscheduledActivities.length}</div>
                        <div data-testid="scheduled-count">{scheduledActivities.length}</div>
                        <button 
                            data-testid="move-activity" 
                            onClick={() => moveActivity('1', 'schedule', 1)}
                        >
                            Move Activity
                        </button>
                        <button 
                            data-testid="undo-move"
                            onClick={undoLastMove}
                        >
                            Undo Move
                        </button>
                    </div>
                )}
            </ActivitiesContainer>
        );

        // Initial state: 2 unscheduled, 1 scheduled
        expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('2');
        expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');

        // Move activity from unscheduled to scheduled
        await userEvent.click(screen.getByTestId('move-activity'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('1');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('2');
            expect(screen.getByTestId('has-undo')).toHaveTextContent('yes');
        });

        // Undo the move
        await userEvent.click(screen.getByTestId('undo-move'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('2');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
            expect(screen.getByTestId('has-undo')).toHaveTextContent('no');
        });
    });

    it('clears undo when creating a new activity', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo, moveActivity, createActivity }) => (
                    <div>
                        <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                        <button 
                            data-testid="move-activity" 
                            onClick={() => moveActivity('1', 'schedule', 1)}
                        >
                            Move Activity
                        </button>
                        <button 
                            data-testid="create-activity"
                            onClick={() => createActivity({ title: 'New Activity', description: 'New Description' })}
                        >
                            Create Activity
                        </button>
                    </div>
                )}
            </ActivitiesContainer>
        );

        // Move activity to enable undo
        await userEvent.click(screen.getByTestId('move-activity'));

        await waitFor(() => {
            expect(screen.getByTestId('has-undo')).toHaveTextContent('yes');
        });

        // Create activity should clear undo
        fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({
                activities: [{
                    id: '4',
                    title: 'New Activity',
                    description: 'New Description',
                    sortIndex: 2,
                    scheduleIndex: null
                }]
            })
        });

        await userEvent.click(screen.getByTestId('create-activity'));

        await waitFor(() => {
            expect(screen.getByTestId('has-undo')).toHaveTextContent('no');
        });
    });

    it('handles undo failure gracefully', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo, moveActivity, undoLastMove }) => (
                    <div>
                        <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                        <button 
                            data-testid="move-activity" 
                            onClick={() => moveActivity('1', 'schedule', 1)}
                        >
                            Move Activity
                        </button>
                        <button 
                            data-testid="undo-move"
                            onClick={undoLastMove}
                        >
                            Undo Move
                        </button>
                    </div>
                )}
            </ActivitiesContainer>
        );

        // Move activity to enable undo
        await userEvent.click(screen.getByTestId('move-activity'));

        await waitFor(() => {
            expect(screen.getByTestId('has-undo')).toHaveTextContent('yes');
        });

        // Mock failure response for undo
        fetch.mockResolvedValueOnce({
            ok: false
        });

        await userEvent.click(screen.getByTestId('undo-move'));

        await waitFor(() => {
            expect(mockOpenAlert).toHaveBeenCalledWith('Failed to undo move', 'error');
        });
    });

    it('can undo up to three move operations', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo, moveActivity, undoLastMove, undoCount, unscheduledActivities, scheduledActivities }) => (
                    <div>
                        <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                        <div data-testid="undo-count">{undoCount}</div>
                        <div data-testid="unscheduled-count">{unscheduledActivities.length}</div>
                        <div data-testid="scheduled-count">{scheduledActivities.length}</div>
                        <button 
                            data-testid="move-activity-1" 
                            onClick={() => moveActivity('1', 'schedule', 1)}
                        >
                            Move Activity 1
                        </button>
                        <button 
                            data-testid="move-activity-2" 
                            onClick={() => moveActivity('2', 'schedule', 1)}
                        >
                            Move Activity 2
                        </button>
                        <button 
                            data-testid="move-activity-3" 
                            onClick={() => moveActivity('3', 'unschedule', 1)}
                        >
                            Move Activity 3
                        </button>
                        <button 
                            data-testid="undo-move"
                            onClick={undoLastMove}
                        >
                            Undo Move
                        </button>
                    </div>
                )}
            </ActivitiesContainer>
        );

        // Initial state: 2 unscheduled, 1 scheduled
        expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('2');
        expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
        expect(screen.getByTestId('undo-count')).toHaveTextContent('0');

        // First move: Activity 1 from unscheduled to scheduled
        await userEvent.click(screen.getByTestId('move-activity-1'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('1');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('2');
            expect(screen.getByTestId('undo-count')).toHaveTextContent('1');
        });

        // Second move: Activity 2 from unscheduled to scheduled
        await userEvent.click(screen.getByTestId('move-activity-2'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('0');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('3');
            expect(screen.getByTestId('undo-count')).toHaveTextContent('2');
        });

        // Third move: Activity 3 from scheduled to unscheduled
        await userEvent.click(screen.getByTestId('move-activity-3'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('1');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('2');
            expect(screen.getByTestId('undo-count')).toHaveTextContent('3');
        });

        // First undo: Should restore Activity 3 to scheduled
        await userEvent.click(screen.getByTestId('undo-move'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('0');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('3');
            expect(screen.getByTestId('undo-count')).toHaveTextContent('2');
        });

        // Second undo: Should restore Activity 2 to unscheduled
        await userEvent.click(screen.getByTestId('undo-move'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('1');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('2');
            expect(screen.getByTestId('undo-count')).toHaveTextContent('1');
        });

        // Third undo: Should restore Activity 1 to unscheduled
        await userEvent.click(screen.getByTestId('undo-move'));

        await waitFor(() => {
            expect(screen.getByTestId('unscheduled-count')).toHaveTextContent('2');
            expect(screen.getByTestId('scheduled-count')).toHaveTextContent('1');
            expect(screen.getByTestId('undo-count')).toHaveTextContent('0');
            expect(screen.getByTestId('has-undo')).toHaveTextContent('no');
        });
    });

    it('maintains only 3 undo states maximum', async () => {
        render(
            <ActivitiesContainer initialActivities={initialActivities}>
                {({ hasUndo, moveActivity, undoCount }) => (
                    <div>
                        <div data-testid="has-undo">{hasUndo ? 'yes' : 'no'}</div>
                        <div data-testid="undo-count">{undoCount}</div>
                        <button 
                            data-testid="move-activity-1" 
                            onClick={() => moveActivity('1', 'schedule', 1)}
                        >
                            Move Activity 1
                        </button>
                        <button 
                            data-testid="move-activity-2" 
                            onClick={() => moveActivity('2', 'schedule', 1)}
                        >
                            Move Activity 2
                        </button>
                        <button 
                            data-testid="move-activity-3" 
                            onClick={() => moveActivity('3', 'unschedule', 1)}
                        >
                            Move Activity 3
                        </button>
                        <button 
                            data-testid="move-activity-1-again" 
                            onClick={() => moveActivity('1', 'unschedule', 1)}
                        >
                            Move Activity 1 Again
                        </button>
                    </div>
                )}
            </ActivitiesContainer>
        );

        expect(screen.getByTestId('undo-count')).toHaveTextContent('0');

        // Make 4 moves
        await userEvent.click(screen.getByTestId('move-activity-1'));
        await waitFor(() => expect(screen.getByTestId('undo-count')).toHaveTextContent('1'));

        await userEvent.click(screen.getByTestId('move-activity-2'));
        await waitFor(() => expect(screen.getByTestId('undo-count')).toHaveTextContent('2'));

        await userEvent.click(screen.getByTestId('move-activity-3'));
        await waitFor(() => expect(screen.getByTestId('undo-count')).toHaveTextContent('3'));

        await userEvent.click(screen.getByTestId('move-activity-1-again'));
        await waitFor(() => {
            // Should still be 3, not 4
            expect(screen.getByTestId('undo-count')).toHaveTextContent('3');
        });
    });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityDisplay from '../ActivityDisplay';
import { useAuth } from '../global/Auth';
import { useAlert } from '../ui/Alert';
import { usePrompt } from '../ui/Prompt';

jest.mock('../global/Auth');
jest.mock('../ui/Alert');
jest.mock('../ui/Prompt');

describe('ActivityDisplay', () => {
    let mockActivity;
    let mockOpenAlert;
    let mockOpenPrompt;
    beforeEach(() => {
        mockActivity = {
            title: 'Cool Activity',
            description: 'This is a cool activity'
        }
        mockOpenPrompt = jest.fn();
        usePrompt.mockReturnValue({
            openPrompt: mockOpenPrompt
        });

        mockOpenAlert = jest.fn();
        useAlert.mockReturnValue({
            openAlert: mockOpenAlert
        });
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(false)
        })
    });
    it('renders activity details', async () => {
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.getByText('Cool Activity')).toBeInTheDocument();
        expect(screen.getByText('This is a cool activity')).toBeInTheDocument();
    });
    it('does not display the delete button if the user is not an editor', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(false)
        })
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.queryByTestId('delete-activity')).not.toBeInTheDocument();
    });
    it('allows an editor to delete an activity', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true)
        })
        let resolveDelete;
        const onDelete = jest.fn().mockImplementation(() => {
            return new Promise(resolve => {
                resolveDelete = resolve;
            })
        });
        mockOpenPrompt.mockResolvedValue();
        render(<ActivityDisplay activity={mockActivity} onDelete={onDelete} />);

        await userEvent.click(screen.getByTestId('delete-activity'));

        expect(mockOpenPrompt).toHaveBeenCalledWith("Are you sure you want to delete \"Cool Activity\"?", 'confirm');
        expect(onDelete).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('delete-activity')).toHaveAttribute('disabled');
        resolveDelete();
        await waitFor(() => expect(screen.getByTestId('delete-activity')).not.toHaveAttribute('disabled'));
    });
    it('allows an editor to schedule an activity', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true)
        })
        let resolveSchedule;
        const onSchedule = jest.fn().mockImplementation(() => {
            return new Promise(resolve => {
                resolveSchedule = resolve;
            })
        });
        mockOpenPrompt.mockResolvedValue();
        render(<ActivityDisplay activity={mockActivity} onSchedule={onSchedule} />);

        await userEvent.click(screen.getByTestId('add-schedule'));

        expect(onSchedule).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('add-schedule')).toHaveAttribute('disabled');
        resolveSchedule();
        await waitFor(() => expect(screen.getByTestId('add-schedule')).not.toHaveAttribute('disabled'));
    });
    it('allows an editor to unschedule an activity', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true)
        })
        let resolveUnschedule;
        const onUnschedule = jest.fn().mockImplementation(() => {
            return new Promise(resolve => {
                resolveUnschedule = resolve;
            })
        });
        mockOpenPrompt.mockResolvedValue();
        render(<ActivityDisplay activity={mockActivity} onUnschedule={onUnschedule} />);

        await userEvent.click(screen.getByTestId('remove-schedule'));

        expect(onUnschedule).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('remove-schedule')).toHaveAttribute('disabled');
        resolveUnschedule();
        await waitFor(() => expect(screen.getByTestId('remove-schedule')).not.toHaveAttribute('disabled'));
    });
})
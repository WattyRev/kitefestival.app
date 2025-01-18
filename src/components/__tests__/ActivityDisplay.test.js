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
    it('renders activity title', async () => {
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.getByText('Cool Activity')).toBeInTheDocument();
    });
    it('renders the activity description', async () => {
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.getByText('This is a cool activity')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
        expect(screen.queryByTestId('show-less')).not.toBeInTheDocument();
    })
    it('it shortens the activity description if it is longer than 97 characters', async () => {
        mockActivity.description = 'This is a cool activity with a long description that is more than 98 characters long and is really long.';
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.getByText('This is a cool activity with a long description that is more than 98 characters long and is really l...')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more')).toBeInTheDocument();
        expect(screen.queryByTestId('show-less')).not.toBeInTheDocument();
    });
    it('shortens the activity description if it is more than 2 lines', async () => {
        mockActivity.description = 'This is a cool \nactivity with \na long description that is more than 98 characters long and is really long.';
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.getByText('This is a cool')).toBeInTheDocument();
        expect(screen.getByText('activity with ...')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more')).toBeInTheDocument();
        expect(screen.queryByTestId('show-less')).not.toBeInTheDocument();
    })
    it('renders activity full description after clicking to show more', async () => {
        mockActivity.description = 'This is a cool activity with a long description that is more than 98 characters long and is really long.';
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.getByText('This is a cool activity with a long description that is more than 98 characters long and is really l...')).toBeInTheDocument();
        
        await userEvent.click(screen.getByTestId('show-more'));
        expect(screen.getByText('This is a cool activity with a long description that is more than 98 characters long and is really long.')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
        expect(screen.queryByTestId('show-less')).toBeInTheDocument();
    });
    it('truncates the activity description after clicking to show less', async () => {
        mockActivity.description = 'This is a cool activity with a long description that is more than 98 characters long and is really long.';
        render(<ActivityDisplay activity={mockActivity} />);

        
        await userEvent.click(screen.getByTestId('show-more'));
        expect(screen.getByText('This is a cool activity with a long description that is more than 98 characters long and is really long.')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
        expect(screen.queryByTestId('show-less')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('show-less'));
        expect(screen.getByText('This is a cool activity with a long description that is more than 98 characters long and is really l...')).toBeInTheDocument();
    });

    it('does not truncate the activity description if allowHideDescription is false', async () => {
        mockActivity.description = 'This is a cool activity with a long description that is more than 98 characters long and is really long.';
        render(<ActivityDisplay activity={mockActivity} allowHideDescription={false} />);

        expect(screen.getByText('This is a cool activity with a long description that is more than 98 characters long and is really long.')).toBeInTheDocument();
        expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
        expect(screen.queryByTestId('show-less')).not.toBeInTheDocument();
    })
    
    it('does not display the dropdown if the user is not an editor', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(false)
        })
        render(<ActivityDisplay activity={mockActivity} />);

        expect(screen.queryByTestId('activity-dropdown')).not.toBeInTheDocument();
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

        await userEvent.click(screen.getByTestId('activity-dropdown'));
        await userEvent.click(screen.getByTestId('delete-activity'));

        expect(mockOpenPrompt).toHaveBeenCalledWith("Are you sure you want to delete \"Cool Activity\"?", 'confirm');
        expect(onDelete).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('delete-activity')).toHaveAttribute('disabled');
        resolveDelete();
        await waitFor(() => expect(screen.getByTestId('delete-activity')).not.toHaveAttribute('disabled'));
    });
    it('allows an editor to edit an activity', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true)
        })
        const onEdit = jest.fn().mockImplementation(() => {
            return Promise.resolve()
        });
        mockOpenPrompt.mockResolvedValue();
        render(<ActivityDisplay activity={mockActivity} onEdit={onEdit} />);

        await userEvent.click(screen.getByTestId('activity-dropdown'));
        await userEvent.click(screen.getByTestId('edit-activity'));
        await userEvent.type(screen.getByTestId('title'), ' edited');
        await userEvent.click(screen.getByTestId('save-activity'));

        expect(onEdit).toHaveBeenCalledWith({ id: mockActivity.id, title: 'Cool Activity edited', description: 'This is a cool activity' });
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

        await userEvent.click(screen.getByTestId('activity-dropdown'));
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
        render(<ActivityDisplay activity={mockActivity} onUnschedule={onUnschedule} />);

        await userEvent.click(screen.getByTestId('activity-dropdown'));
        await userEvent.click(screen.getByTestId('remove-schedule'));

        expect(onUnschedule).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('remove-schedule')).toHaveAttribute('disabled');
        resolveUnschedule();
        await waitFor(() => expect(screen.getByTestId('remove-schedule')).not.toHaveAttribute('disabled'));
    });
    it('allows an editor to move an activity up', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true)
        })
        let doResolve;
        const onMoveUp = jest.fn().mockImplementation(() => {
            return new Promise(resolve => {
                doResolve = resolve;
            })
        });
        render(<ActivityDisplay activity={mockActivity} onMoveUp={onMoveUp} />);

        await userEvent.click(screen.getByTestId('activity-dropdown'));
        await userEvent.click(screen.getByTestId('move-up'));

        expect(onMoveUp).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('move-up')).toHaveAttribute('disabled');
        doResolve();
        await waitFor(() => expect(screen.getByTestId('move-up')).not.toHaveAttribute('disabled'));
    });
    it('allows an editor to move an activity down', async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true)
        })
        let doResolve;
        const onMoveDown = jest.fn().mockImplementation(() => {
            return new Promise(resolve => {
                doResolve = resolve;
            })
        });
        render(<ActivityDisplay activity={mockActivity} onMoveDown={onMoveDown} />);

        await userEvent.click(screen.getByTestId('activity-dropdown'));
        await userEvent.click(screen.getByTestId('move-down'));

        expect(onMoveDown).toHaveBeenCalledWith(mockActivity.id);
        expect(screen.getByTestId('move-down')).toHaveAttribute('disabled');
        doResolve();
        await waitFor(() => expect(screen.getByTestId('move-down')).not.toHaveAttribute('disabled'));
    });
})
import { render, screen } from "@testing-library/react";
import { useAuth } from "../../global/Auth";
import { usePrompt } from "../../ui/Prompt";
import CommitForm from "../CommentForm";
import Comment from "../Comment";
import userEvent from "@testing-library/user-event";

jest.mock('../../global/Auth');
jest.mock('../../ui/Prompt');
jest.mock('../CommentForm');

describe('components/Comments/Comment', () => {
    let mockProps;
    beforeEach(() => {
        mockProps = {
            comment: {
                id: 'abc-comment-id',
                message: 'message',
                userName: 'user name',
                userId: 'abc-user-id',
                edited: false
            },
            onDelete: jest.fn(),
            onEdit: jest.fn(),
        }
        useAuth.mockReturnValue({ auth: {
            userId: 'abc-user-id',
            userType: 'user'
        }});
        usePrompt.mockReturnValue({ openPrompt: jest.fn().mockResolvedValue() });
        CommitForm.mockImplementation(({ onSubmit }) => <div data-testid="commit-form" onClick={() => onSubmit({ message: 'edited message' })}></div>)
    })
    it('renders the comment', async () => {
        render(<Comment {...mockProps} />);
        expect(screen.getByTestId('comment-message')).toHaveTextContent('message');
    });
    it('allows the comment creator to edit the comment', async () => {
        render(<Comment {...mockProps} />);
        await userEvent.click(screen.getByTestId('comment-dropdown'));
        await userEvent.click(screen.getByTestId('edit-comment'));
        await userEvent.click(screen.getByTestId('commit-form'));

        expect(mockProps.onEdit).toHaveBeenCalledWith('abc-comment-id', { message: 'edited message'});
    });
    it('does not show the dropdown if the user did not create the comment', async () => {
        mockProps.comment.userId = 'different-id';
        render(<Comment {...mockProps} />);
        expect(screen.queryByTestId('comment-dropdown')).not.toBeInTheDocument();
    })
    it('allows the comment creator to delete the comment', async () => {
        render(<Comment {...mockProps} />);

        await userEvent.click(screen.getByTestId('comment-dropdown'));
        await userEvent.click(screen.getByTestId('delete-comment'));

        expect(mockProps.onDelete).toHaveBeenCalledWith('abc-comment-id');
    });
    it('allows an editor to delete the comment', async () => {
        useAuth.mockReturnValue({ auth: {
            userId: 'different-id',
            userType: 'editor'
        }});
        render(<Comment {...mockProps} />);

        await userEvent.click(screen.getByTestId('comment-dropdown'));
        await userEvent.click(screen.getByTestId('delete-comment'));

        expect(mockProps.onDelete).toHaveBeenCalledWith('abc-comment-id');
    });
    it('does not show the delete button for users that did not create the comment', () => {
        useAuth.mockReturnValue({ auth: {
            userId: 'different-id',
            userType: 'user'
        }});

        render(<Comment {...mockProps} />);

        expect(screen.queryByTestId('comment-dropdown')).not.toBeInTheDocument();
    })
});
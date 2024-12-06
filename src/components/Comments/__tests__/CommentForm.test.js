import { render, screen, waitFor } from "@testing-library/react";
import CommentForm from "../CommentForm";
import userEvent from "@testing-library/user-event";

describe('CommentForm', () => {
    let mockProps;
    beforeEach(() => {
        mockProps = {
            onSubmit: jest.fn(),
        }
    });
    it('renders a the form', () => {
        render(<CommentForm {...mockProps} data-testid="form" />);
        expect(screen.getByTestId('form')).toBeInTheDocument();
    });
    it('allows the user to submit the form', async () => {
        render(<CommentForm {...mockProps} data-testid="form" />);

        await userEvent.type(screen.getByTestId('message-input'), 'jingles');
        await userEvent.click(screen.getByTestId('submit-comment'));

        expect(mockProps.onSubmit).toHaveBeenCalledWith('jingles');
    });
    it('disables the submit button when the form is pending', async () => {
        let resolveSubmit;
        mockProps.onSubmit.mockImplementation(() => {
            return new Promise(resolve => resolveSubmit = resolve);
        })
        render(<CommentForm {...mockProps} data-testid="form" />);

        await userEvent.type(screen.getByTestId('message-input'), 'jingles');
        await userEvent.click(screen.getByTestId('submit-comment'));

        await waitFor(() => expect(screen.getByTestId('submit-comment')).toHaveAttribute('disabled'));
        resolveSubmit();
        await waitFor(() => expect(screen.getByTestId('submit-comment')).not.toHaveAttribute('disabled'));
        expect(screen.getByTestId('message-input')).toHaveValue('');
    });
    it('restores the button when submission fails', async () => {
        let rejectSubmit;
        mockProps.onSubmit.mockImplementation(() => {
            return new Promise((_, reject) => rejectSubmit = reject);
        })
        render(<CommentForm {...mockProps} data-testid="form" />);

        await userEvent.type(screen.getByTestId('message-input'), 'jingles');
        await userEvent.click(screen.getByTestId('submit-comment'));

        await waitFor(() => expect(screen.getByTestId('submit-comment')).toHaveAttribute('disabled'));
        rejectSubmit();
        await waitFor(() => expect(screen.getByTestId('submit-comment')).not.toHaveAttribute('disabled'));
        expect(screen.getByTestId('message-input')).toHaveValue('jingles');
    });
    it('uses the initialMessage prop as the initial value', async () => {
        mockProps.initialMessage = 'initial jingles';
        render(<CommentForm {...mockProps} data-testid="form" />);
        expect(screen.getByTestId('message-input')).toHaveValue('initial jingles');
    });
    it('allows the user to cancel the form if onCancel is provided', async () => {
        mockProps.onCancel = jest.fn();
        render(<CommentForm {...mockProps} data-testid="form" />);
        await userEvent.click(screen.getByTestId('cancel-comment'));
        expect(mockProps.onCancel).toHaveBeenCalled();
    });
})
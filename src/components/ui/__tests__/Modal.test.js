import { render, screen } from "@testing-library/react";
import Modal from "../Modal";
import userEvent from "@testing-library/user-event";

describe('Modal', () => {
    it('renders nothing if isOpen is false', () => {
        render(<Modal isOpen={false}><div data-testid="content" /></Modal>);
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
    it('renders children if isOpen is true', () => {
        render(<Modal isOpen={true}><div data-testid="content" /></Modal>);
        expect(screen.queryByTestId('content')).toBeInTheDocument();
    });
    it('calls onClose when the backdrop is clicked', async () => {
        const handleClose = jest.fn();
        render(<Modal isOpen={true} onClose={handleClose}><div data-testid="content" /></Modal>);

        await userEvent.click(screen.getByTestId('backdrop'));
        
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
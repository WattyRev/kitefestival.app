import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UndoButton from '../UndoButton';

describe('UndoButton', () => {
    it('renders with correct text', () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} />);
        
        expect(screen.getByRole('button')).toHaveTextContent('Undo Move');
    });

    it('calls onUndo when clicked', async () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} />);
        
        await userEvent.click(screen.getByRole('button'));
        
        expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} disabled />);
        
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onUndo when disabled and clicked', async () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} disabled />);
        
        await userEvent.click(screen.getByRole('button'));
        
        expect(mockOnUndo).not.toHaveBeenCalled();
    });

    it('shows undo count when greater than 1', () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} undoCount={3} />);
        
        expect(screen.getByRole('button')).toHaveTextContent('Undo Move (3)');
    });

    it('does not show count when undoCount is 1', () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} undoCount={1} />);
        
        expect(screen.getByRole('button')).toHaveTextContent('Undo Move');
        expect(screen.getByRole('button')).not.toHaveTextContent('(1)');
    });
});

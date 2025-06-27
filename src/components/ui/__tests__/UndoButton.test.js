import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UndoButton from "../UndoButton";

describe("UndoButton", () => {
    it("renders with correct text", () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} />);

        expect(screen.getByRole("button")).toHaveTextContent("Undo Move");
    });

    it("calls onUndo when clicked", async () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} />);

        await userEvent.click(screen.getByRole("button"));

        expect(mockOnUndo).toHaveBeenCalledTimes(1);
    });

    it("can be disabled", () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} disabled />);

        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not call onUndo when disabled and clicked", async () => {
        const mockOnUndo = jest.fn();
        render(<UndoButton onUndo={mockOnUndo} disabled />);

        await userEvent.click(screen.getByRole("button"));

        expect(mockOnUndo).not.toHaveBeenCalled();
    });
});

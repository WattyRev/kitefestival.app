import { render, screen } from "@testing-library/react";
import TextInputList from "../TextInputList";
import userEvent from "@testing-library/user-event";
import { PromptProvider } from "../Prompt";

describe('TextInputList', () => {
    it('should render', () => {
        render(<TextInputList data-testid="target" />);
        expect(screen.getByTestId("target")).toBeInTheDocument();
    });

    it('should render with an initial array of strings', async () => {
        const startValue = ['one', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        expect(screen.getAllByRole('textbox')).toHaveLength(3);
    })
    it('should allow adding new values', async () => {
        const startValue = ['one', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        await userEvent.click(screen.getByTestId("add-item"));
        expect(changeHandler).toHaveBeenCalledWith(['one', 'two', 'three', '']);
    });
    it('should allow removing values', async () => {
        const startValue = ['one', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        await userEvent.click(screen.getByTestId("remove-item-0"));
        await userEvent.click(screen.getByTestId("prompt-submit"))
        expect(changeHandler).toHaveBeenCalledWith(['two', 'three']);
    });
    it('should not confirm removal if the value is empty', async () => {
        const startValue = ['', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        await userEvent.click(screen.getByTestId("remove-item-0"));
        expect(changeHandler).toHaveBeenCalledWith(['two', 'three']);
    })
    it('should allow editing values', async () => {
        const startValue = ['one', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        await userEvent.type(screen.getByTestId("input-item-0"), "1");
        expect(changeHandler).toHaveBeenCalledWith(['one1', 'two', 'three']);
    });
    it('should allow moving values up', async () => {
        const startValue = ['one', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        await userEvent.click(screen.getByTestId("move-up-item-1"));
        expect(changeHandler).toHaveBeenCalledWith(['two', 'one', 'three']);
    });
    it('should allow moving values down', async () => {
        const startValue = ['one', 'two', 'three'];
        const changeHandler = jest.fn();
        render(<PromptProvider><TextInputList data-testid="target" value={startValue} onChange={changeHandler} /></PromptProvider>);

        await userEvent.click(screen.getByTestId("move-down-item-1"));
        expect(changeHandler).toHaveBeenCalledWith(['one', 'three', 'two']);
    });
});
import { render, screen } from "@testing-library/react";
import InputList from "../InputList";
import userEvent from "@testing-library/user-event";
import { PromptProvider } from "../Prompt";

describe("InputList", () => {
    let inputRender;
    beforeEach(() => {
        inputRender = ({ index, item, onChange }) => (
            <input
                data-testid={`input-item-${index}`}
                value={item}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    });
    it("should render", () => {
        render(<InputList data-testid="target" inputRender={inputRender} />);
        expect(screen.getByTestId("target")).toBeInTheDocument();
    });

    it("should render with an initial array of strings", async () => {
        const startValue = ["one", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        expect(screen.getAllByRole("textbox")).toHaveLength(3);
    });
    it("should allow adding new values", async () => {
        const startValue = ["one", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTestId("add-item"));
        expect(changeHandler).toHaveBeenCalledWith(["one", "two", "three", ""]);
    });
    it("should allow removing values", async () => {
        const startValue = ["one", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTestId("remove-item-0"));
        await userEvent.click(screen.getByTestId("prompt-submit"));
        expect(changeHandler).toHaveBeenCalledWith(["two", "three"]);
    });
    it("should not confirm removal if the value is empty", async () => {
        const startValue = ["", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTestId("remove-item-0"));
        expect(changeHandler).toHaveBeenCalledWith(["two", "three"]);
    });
    it("should allow editing values", async () => {
        const startValue = ["one", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        await userEvent.type(screen.getByTestId("input-item-0"), "1");
        expect(changeHandler).toHaveBeenCalledWith(["one1", "two", "three"]);
    });
    it("should allow moving values up", async () => {
        const startValue = ["one", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTestId("move-up-item-1"));
        expect(changeHandler).toHaveBeenCalledWith(["two", "one", "three"]);
    });
    it("should allow moving values down", async () => {
        const startValue = ["one", "two", "three"];
        const changeHandler = jest.fn();
        render(
            <PromptProvider>
                <InputList
                    data-testid="target"
                    value={startValue}
                    onChange={changeHandler}
                    inputRender={inputRender}
                />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTestId("move-down-item-1"));
        expect(changeHandler).toHaveBeenCalledWith(["one", "three", "two"]);
    });
});

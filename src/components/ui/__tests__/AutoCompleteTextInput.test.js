import { render, screen } from "@testing-library/react";
import AutoCompleteTextInput from "../AutocompleteTextInput";
import userEvent from "@testing-library/user-event";

describe("AutoCompleteTextInput", () => {
    let options;
    beforeEach(() => {
        options = ['boogers', 'Paint it Black', 'Breeze', 'One Piece', 'Exs and Ohs', 'How You Like Me Now'];
    });
    it("renders", async () => {
        render(<AutoCompleteTextInput options={options} />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
    it("renders with a value", async () => {
        render(<AutoCompleteTextInput value="p" options={options} />);
        expect(screen.getByRole("textbox")).toHaveValue("p");
    });
    it("does not display any options by default", async () => {
        render(<AutoCompleteTextInput value="p" options={options} />);
        expect(screen.queryByTestId("suggestions")).not.toBeInTheDocument();
    });
    it("does not display the options while focused when there is no value", async () => {
        render(<AutoCompleteTextInput options={options} />);
        await userEvent.click(screen.getByRole("textbox"));
        expect(screen.queryByTestId("suggestions")).not.toBeInTheDocument();
    });
    it("displays relevant options when there is a value", async () => {
        render(<AutoCompleteTextInput value="p" options={options} />);
        await userEvent.click(screen.getByRole("textbox"));
        expect(screen.getByTestId("suggestions")).toBeInTheDocument();
        expect(screen.getByTestId('suggestion-0')).toHaveTextContent('Paint it Black');
        expect(screen.getByTestId('suggestion-1')).toHaveTextContent('One Piece');
        expect(screen.queryByTestId('suggestion-2')).not.toBeInTheDocument();
    });
    it('calls onChange when the value changes', async () => {
        const onChange = jest.fn();
        render(<AutoCompleteTextInput options={options} onChange={onChange} />);

        await userEvent.type(screen.getByRole("textbox"), 'p');
        expect(onChange).toHaveBeenCalledWith('p');
    })
    it("uses a suggested value when clicked", async () => {
        const onChange = jest.fn();
        render(<AutoCompleteTextInput value="p" options={options} onChange={onChange} />);
        await userEvent.click(screen.getByRole("textbox"));
        await userEvent.click(screen.getByTestId('suggestion-0'));
        expect(onChange).toHaveBeenCalledWith('Paint it Black');
    });

    describe("with no options", () => {
        it("renders", async () => {
            render(<AutoCompleteTextInput />);
            expect(screen.getByRole("textbox")).toBeInTheDocument();
        });
        it("allows the user to enter a value", async () => {
            const onChange = jest.fn();
            render(<AutoCompleteTextInput onChange={onChange} />);

            await userEvent.type(screen.getByRole("textbox"), 'p');
            expect(onChange).toHaveBeenCalledWith('p');
        });
    });
});

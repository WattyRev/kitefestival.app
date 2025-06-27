import { screen, render } from "@testing-library/react";
import Dropdown, { DropdownItem } from "../Dropdown";
import userEvent from "@testing-library/user-event";

describe("Dropdown", () => {
    it("renders the dropdown trigger", () => {
        render(
            <Dropdown
                dropdownContent={() => <p data-testid="content">Content</p>}
            >
                {({ open, close, isOpen }) => (
                    <button
                        data-testid="trigger"
                        onClick={isOpen ? close : open}
                    >
                        Open
                    </button>
                )}
            </Dropdown>,
        );

        expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });
    it("renders the dropdown content when the trigger is clicked", async () => {
        render(
            <Dropdown
                dropdownContent={() => <p data-testid="content">Content</p>}
            >
                {({ open, close, isOpen }) => (
                    <button
                        data-testid="trigger"
                        onClick={isOpen ? close : open}
                    >
                        Open
                    </button>
                )}
            </Dropdown>,
        );

        expect(screen.queryByTestId("content")).not.toBeInTheDocument();
        await userEvent.click(screen.getByTestId("trigger"));
        expect(screen.getByTestId("content")).toBeInTheDocument();
    });
    it("removes the dropdown content when the user clicks outside of the dropdown", async () => {
        render(
            <>
                <Dropdown
                    dropdownContent={() => <p data-testid="content">Content</p>}
                >
                    {({ open, close, isOpen }) => (
                        <button
                            data-testid="trigger"
                            onClick={isOpen ? close : open}
                        >
                            Open
                        </button>
                    )}
                </Dropdown>
                <button data-testid="outside">Outside</button>
            </>,
        );

        await userEvent.click(screen.getByTestId("trigger"));
        expect(screen.queryByTestId("content")).toBeInTheDocument();
        await userEvent.click(screen.getByTestId("outside"));
        expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });
    it("allows the user to close the drodown by clicking on the trigger again", async () => {
        render(
            <Dropdown
                dropdownContent={() => <p data-testid="content">Content</p>}
            >
                {({ open, close, isOpen }) => (
                    <button
                        data-testid="trigger"
                        onClick={isOpen ? close : open}
                    >
                        Open
                    </button>
                )}
            </Dropdown>,
        );

        await userEvent.click(screen.getByTestId("trigger"));
        expect(screen.getByTestId("content")).toBeInTheDocument();
        await userEvent.click(screen.getByTestId("trigger"));
        expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });
});

describe("DropdownItem", () => {
    it("renders", () => {
        render(<DropdownItem data-testid="target">Boogers</DropdownItem>);
        expect(screen.getByTestId("target")).toBeInTheDocument();
    });
});

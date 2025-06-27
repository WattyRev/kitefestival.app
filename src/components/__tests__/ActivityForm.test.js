import { render, screen, waitFor } from "@testing-library/react";
import { useAuth } from "../global/Auth";
import ActivityForm from "../ActivityForm";
import userEvent from "@testing-library/user-event";

jest.mock("../global/Auth");

describe("ActivityForm", () => {
    it("does not render for non-editors", async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(false),
        });
        render(<ActivityForm />);

        expect(screen.queryByTestId("create-activity")).not.toBeInTheDocument();
    });
    it("allows an editor to create an activity", async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true),
        });
        const onSubmit = jest.fn().mockResolvedValue();
        render(<ActivityForm onSubmit={onSubmit} />);

        await userEvent.type(screen.getByTestId("title"), "Cool Activity");
        await userEvent.type(
            screen.getByTestId("description"),
            "This is a cool activity",
        );
        await userEvent.click(screen.getByTestId("save-activity"));

        expect(onSubmit).toHaveBeenCalledWith({
            title: "Cool Activity",
            description: "This is a cool activity",
        });
    });
    it("disables the save button while pending", async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true),
        });
        let resolveSubmit;
        const onSubmit = jest.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                resolveSubmit = resolve;
            });
        });
        render(<ActivityForm onSubmit={onSubmit} />);

        await userEvent.type(screen.getByTestId("title"), "Cool Activity");
        await userEvent.type(
            screen.getByTestId("description"),
            "This is a cool activity",
        );
        await userEvent.click(screen.getByTestId("save-activity"));

        expect(screen.getByTestId("save-activity")).toHaveAttribute("disabled");
        resolveSubmit();
        await waitFor(() =>
            expect(screen.getByTestId("save-activity")).not.toHaveAttribute(
                "disabled",
            ),
        );
    });
    it("empties out the form after saving", async () => {
        useAuth.mockReturnValue({
            isEditor: jest.fn().mockReturnValue(true),
        });
        const onSubmit = jest.fn().mockResolvedValue();
        render(<ActivityForm onSubmit={onSubmit} />);

        await userEvent.type(screen.getByTestId("title"), "Cool Activity");
        await userEvent.type(
            screen.getByTestId("description"),
            "This is a cool activity",
        );
        await userEvent.click(screen.getByTestId("save-activity"));

        expect(screen.getByTestId("title")).toHaveValue("");
        expect(screen.getByTestId("description")).toHaveValue("");
    });
});

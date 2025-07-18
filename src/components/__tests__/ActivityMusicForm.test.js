import { render, screen, waitFor } from "@testing-library/react";
import ActivityMusicForm from "../ActivityMusicForm";
import userEvent from "@testing-library/user-event";

jest.mock("../global/Auth");

describe("ActivityMusicForm", () => {
    it("allows adding music", async () => {
        const onSubmit = jest.fn().mockResolvedValue();
        render(<ActivityMusicForm onSubmit={onSubmit} />);

        await userEvent.click(screen.getByTestId("add-item"));
        await userEvent.type(screen.getByTestId("input-item-0"), "song 1");
        await userEvent.click(screen.getByTestId("save-activity"));

        expect(onSubmit).toHaveBeenCalledWith({
            music: ['song 1'],
        });
    });
    it("disables the save button while pending", async () => {
        let resolveSubmit;
        const onSubmit = jest.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                resolveSubmit = resolve;
            });
        });
        render(<ActivityMusicForm onSubmit={onSubmit} />);

        await userEvent.click(screen.getByTestId("add-item"));
        await userEvent.type(screen.getByTestId("input-item-0"), "song 1");
        await userEvent.click(screen.getByTestId("save-activity"));

        expect(screen.getByTestId("save-activity")).toHaveAttribute("disabled");
        resolveSubmit();
        await waitFor(() =>
            expect(screen.getByTestId("save-activity")).not.toHaveAttribute(
                "disabled",
            ),
        );
    });
});

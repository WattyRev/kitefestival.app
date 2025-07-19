import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MusicLibraryActions from "../MusicLibraryActions";
import { useMusicLibrary } from "../MusicLibraryContainer";
import { PromptProvider } from "../ui/Prompt";

jest.mock("../MusicLibraryContainer");

describe("MusicLibraryActions", () => {
    let mockMusic, mockDelete, mockUpdate;
    beforeEach(() => {
        mockMusic = {
            id: 1,
            value: "song 1",
        };
        mockDelete = jest.fn().mockResolvedValue();
        mockUpdate = jest.fn().mockResolvedValue();
        useMusicLibrary.mockReturnValue({
            deleteMusic: mockDelete,
            updateMusic: mockUpdate,
        });
    });
    it("renders", async () => {
        render(
            <PromptProvider>
                <MusicLibraryActions data-testid="target" music={mockMusic} />
            </PromptProvider>,
        );

        const musicLibraryActions = screen.getByTestId("target");
        expect(musicLibraryActions).toBeInTheDocument();
    });
    it("allows the user to delete the music", async () => {
        render(
            <PromptProvider>
                <MusicLibraryActions data-testid="target" music={mockMusic} />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTitle("Delete"));

        expect(mockDelete).toHaveBeenCalledWith([mockMusic.id]);
    });
    it("allows the user to edit the music", async () => {
        render(
            <PromptProvider>
                <MusicLibraryActions data-testid="target" music={mockMusic} />
            </PromptProvider>,
        );

        await userEvent.click(screen.getByTitle("Edit"));
        await userEvent.type(screen.getByTestId("prompt-input"), " edited");
        await userEvent.click(screen.getByTestId("prompt-submit"));

        expect(mockUpdate).toHaveBeenCalledWith(mockMusic.id, "song 1 edited");
    });
});

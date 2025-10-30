import { render, screen } from "@testing-library/react";
import MusicLibraryList from "../MusicLibraryList";
import { useMusicLibrary } from "../MusicLibraryContainer";
import { useAuth } from "../global/Auth";
import userEvent from "@testing-library/user-event";
import { PromptProvider } from "../ui/Prompt";

jest.mock("../MusicLibraryContainer");
jest.mock("../global/Auth");

describe("MusicLibraryList", () => {
    let mockDeleteMusic;
    beforeEach(() => {
        mockDeleteMusic = jest.fn().mockResolvedValue();
        useMusicLibrary.mockReturnValue({
            musicLibrary: [
                { value: "a", id: "A" },
                { value: "b", id: "B" },
                { value: "c", id: "C" },
            ],
            deleteMusic: mockDeleteMusic,
        });
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
    });
    it("renders", async () => {
        render(<MusicLibraryList />);

        const table = screen.getByRole("table");
        expect(table).toBeInTheDocument();
    });
    it("renders a row for each music item", async () => {
        render(<MusicLibraryList />);

        const rows = screen.getAllByRole("row");
        expect(rows).toHaveLength(4);
    });
    it("renders the actions and actions header for editors", async () => {
        render(<MusicLibraryList />);

        const actions = screen.getAllByTestId("actions");
        const actionsHeader = screen.getByTestId("actions-header");
        expect(actions).toHaveLength(3);
        expect(actionsHeader).toBeInTheDocument();
    });
    it("does not render the actions and actions header for non-editors", async () => {
        useAuth.mockReturnValue({
            isEditor: () => false,
        });
        render(<MusicLibraryList />);

        const actions = screen.queryAllByTestId("actions");
        const actionsHeader = screen.queryByTestId("actions-header");
        expect(actions).toHaveLength(0);
        expect(actionsHeader).not.toBeInTheDocument();
    });
    it("allows the user to search the music library", async () => {
        useMusicLibrary.mockReturnValue({
            musicLibrary: [
                { value: "hasb", id: "0" },
                { value: "doesnt", id: "1" },
                { value: "alsohasb", id: "2" },
            ],
        });
        render(<MusicLibraryList />);

        expect(screen.getAllByRole("row")).toHaveLength(4);

        const searchInput = screen.getByTestId("music-search");
        await userEvent.type(searchInput, "hasb");
        expect(screen.getAllByRole("row")).toHaveLength(3);
    });
    it("allows the user to easily clear their search", async () => {
        useMusicLibrary.mockReturnValue({
            musicLibrary: [
                { value: "hasb", id: "0" },
                { value: "doesnt", id: "1" },
                { value: "alsohasb", id: "2" },
            ],
        });
        render(<MusicLibraryList />);

        const searchInput = screen.getByTestId("music-search");
        await userEvent.type(searchInput, "hasb");
        expect(screen.getAllByRole("row")).toHaveLength(3);

        await userEvent.click(screen.getByTestId("clear-search"));
        expect(screen.getAllByRole("row")).toHaveLength(4);
    });
    it('allows an editor to delete multiple music items', async () => {
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
        render(<PromptProvider><MusicLibraryList /></PromptProvider>);

        const checkboxes = screen.getAllByTestId("select-music");
        await userEvent.click(checkboxes[0]);
        await userEvent.click(checkboxes[1]);
        await userEvent.click(screen.getByTestId("delete-multiple"));
        await userEvent.click(screen.getByTestId("prompt-submit"));

        expect(mockDeleteMusic).toHaveBeenCalledWith(["A", "B"]);
    });
    it('allows an editor to delete all music items', async () => {
        useAuth.mockReturnValue({
            isEditor: () => true,
        });
        render(<PromptProvider><MusicLibraryList /></PromptProvider>);

        await userEvent.click(screen.getByTestId("select-all"));
        await userEvent.click(screen.getByTestId("delete-multiple"));
        await userEvent.click(screen.getByTestId("prompt-submit"));

        expect(mockDeleteMusic).toHaveBeenCalledWith(["A", "B", "C"]);
    });
});

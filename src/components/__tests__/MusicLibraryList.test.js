import { render, screen } from "@testing-library/react";
import MusicLibraryList from "../MusicLibraryList";
import { useMusicLibrary } from "../MusicLibraryContainer";
import { useAuth } from "../global/Auth";

jest.mock("../MusicLibraryContainer");
jest.mock("../global/Auth");

describe("MusicLibraryList", () => {
    beforeEach(() => {
        useMusicLibrary.mockReturnValue({
            musicLibrary: [
                { value: "a", id: "A" },
                { value: "b", id: "B" },
                { value: "c", id: "C" },
            ],
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
});

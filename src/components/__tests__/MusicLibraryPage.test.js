import { render, screen } from "@testing-library/react";
import MusicLibraryPage from "../MusicLibraryPage";
import { useAuth } from "../global/Auth";
import ChangePollingContainer from "../ChangePollingContainer";
import MusicLibraryContainer from "../MusicLibraryContainer";
import MusicLibraryList from "../MusicLibraryList";
import AddMusicForm from "../AddMusicForm";

jest.mock("../global/Auth");
jest.mock("../ChangePollingContainer");
jest.mock("../MusicLibraryContainer");
jest.mock("../MusicLibraryList");
jest.mock("../AddMusicForm");

describe("MusicLibraryPage", () => {
    let initialMusicLibrary;
    beforeEach(() => {
        MusicLibraryList.mockImplementation(() => (
            <div data-testid="music-library" />
        ));
        AddMusicForm.mockImplementation(() => (
            <div data-testid="add-music-form" />
        ));
        ChangePollingContainer.mockImplementation(({ children }) => (
            <>{children}</>
        ));
        MusicLibraryContainer.mockImplementation(({ children }) => (
            <div data-testid="music-library-container">{children}</div>
        ));
        initialMusicLibrary = [
            { value: "a", id: "A" },
            { value: "b", id: "B" },
            { value: "c", id: "C" },
        ];
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(false),
            isEditor: jest.fn().mockReturnValue(true),
        });
    });
    it("renders music content to non-public users", async () => {
        render(<MusicLibraryPage initialMusicLibrary={initialMusicLibrary} />);

        expect(screen.getByTestId("music-library")).toBeInTheDocument();
    });
    it("does not render music content to the public", async () => {
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(true),
            isEditor: jest.fn().mockReturnValue(false),
        });
        render(<MusicLibraryPage initialMusicLibrary={initialMusicLibrary} />);

        expect(screen.queryByTestId("music-library")).not.toBeInTheDocument();
        expect(screen.getByTestId("public-message")).toBeInTheDocument();
    });
    it("renders the music form to editors", async () => {
        render(<MusicLibraryPage initialMusicLibrary={initialMusicLibrary} />);

        expect(screen.getByTestId("add-music-form")).toBeInTheDocument();
    });
    it("does not render the music form to users", async () => {
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(false),
            isEditor: jest.fn().mockReturnValue(false),
        });
        render(<MusicLibraryPage initialMusicLibrary={initialMusicLibrary} />);

        expect(screen.queryByTestId("add-music-form")).not.toBeInTheDocument();
    });
    it("does not render the music form to the public", async () => {
        useAuth.mockReturnValue({
            isPublic: jest.fn().mockReturnValue(true),
            isEditor: jest.fn().mockReturnValue(false),
        });
        render(<MusicLibraryPage initialMusicLibrary={initialMusicLibrary} />);

        expect(screen.queryByTestId("add-music-form")).not.toBeInTheDocument();
    });
});

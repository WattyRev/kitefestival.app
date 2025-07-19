import { render, screen } from "@testing-library/react";
import MusicLibraryPage from "../MusicLibraryPage";
import { useAuth } from "../global/Auth";

jest.mock("../global/Auth");

describe("MusicLibraryPage", () => {
    let initialMusicLibrary;
    beforeEach(() => {
        initialMusicLibrary = [
            { value: "a", id: "A" },
            { value: "b", id: "B" },
            { value: "c", id: "C" },
        ]
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

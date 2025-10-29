import { render, screen } from "@testing-library/react";
import MusicLibraryContainer, {
    useMusicLibrary,
} from "../MusicLibraryContainer";
import userEvent from "@testing-library/user-event";
import { useChangePolling } from "../ChangePollingContainer";
import {
    addToMusicLibrary,
    deleteFromMusicLibrary,
    editMusicEntry,
    getMusicLibrary,
} from "../../app/api/musicLibrary";

jest.mock("../../app/api/musicLibrary");
jest.mock("../ChangePollingContainer");

describe("MusicLibraryContainer", () => {
    let MockConsumer;
    let initialMusicLibrary;
    beforeEach(() => {
        useChangePolling.mockReturnValue({
            changes: [],
        });
        getMusicLibrary.mockResolvedValue({
            musicLibrary: [{ value: "a", id: "A" }],
        });
        /* eslint-disable-next-line react/display-name */
        MockConsumer = () => {
            const {
                musicLibrary,
                refresh,
                addMusic,
                deleteMusic,
                updateMusic,
            } = useMusicLibrary();
            return (
                <>
                    <div data-testid="music-library">
                        {JSON.stringify(musicLibrary)}
                    </div>
                    <button onClick={refresh}>Refresh</button>
                    <button
                        onClick={() =>
                            addMusic([
                                { value: "d", id: "D" },
                                { value: "e", id: "E" },
                                { value: "f", id: "F" },
                            ])
                        }
                    >
                        Add
                    </button>
                    <button onClick={() => deleteMusic(["A", "B", "C"])}>
                        Delete
                    </button>
                    <button onClick={() => updateMusic("C", "g")}>
                        Update
                    </button>
                </>
            );
        };
        initialMusicLibrary = [
            { value: "a", id: "A" },
            { value: "b", id: "B" },
            { value: "c", id: "C" },
        ];
    });
    it("should take in an initial music library and provide the library to consumers", async () => {
        render(
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <MockConsumer />
            </MusicLibraryContainer>,
        );
        expect(screen.getByTestId("music-library")).toHaveTextContent(
            JSON.stringify([
                { value: "a", id: "A" },
                { value: "b", id: "B" },
                { value: "c", id: "C" },
            ]),
        );
    });
    it("allows refreshing the music library", async () => {
        render(
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <MockConsumer />
            </MusicLibraryContainer>,
        );
        await userEvent.click(screen.getByText("Refresh"));
        expect(getMusicLibrary).toHaveBeenCalled();
        expect(screen.getByTestId("music-library")).toHaveTextContent(
            JSON.stringify([{ value: "a", id: "A" }]),
        );
    });
    it("should allow the user to add music", async () => {
        render(
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <MockConsumer />
            </MusicLibraryContainer>,
        );
        await userEvent.click(screen.getByText("Add"));
        expect(addToMusicLibrary).toHaveBeenCalledWith([
            { value: "d", id: "D" },
            { value: "e", id: "E" },
            { value: "f", id: "F" },
        ]);
        expect(screen.getByTestId("music-library")).toHaveTextContent(
            JSON.stringify([{ value: "a", id: "A" }]),
        );
    });
    it("should allow the user to delete music", async () => {
        render(
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <MockConsumer />
            </MusicLibraryContainer>,
        );
        await userEvent.click(screen.getByText("Delete"));
        expect(deleteFromMusicLibrary).toHaveBeenCalledWith(["A", "B", "C"]);
        expect(screen.getByTestId("music-library")).toHaveTextContent(
            JSON.stringify([{ value: "a", id: "A" }]),
        );
    });
    it("should allow the user to update music", async () => {
        render(
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <MockConsumer />
            </MusicLibraryContainer>,
        );
        await userEvent.click(screen.getByText("Update"));
        expect(editMusicEntry).toHaveBeenCalledWith("C", "g");
        expect(screen.getByTestId("music-library")).toHaveTextContent(
            JSON.stringify([{ value: "a", id: "A" }]),
        );
    });
});

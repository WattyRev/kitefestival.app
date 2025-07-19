import { render, screen } from "@testing-library/react";
import MusicLibraryContainer, { useMusicLibrary } from "../MusicLibraryContainer";

describe('MusicLibraryContainer', () => {
    let MockConsumer;
    let initialMusicLibrary;
    beforeEach(() => {
        MockConsumer = () => {
            const { musicLibrary } = useMusicLibrary();
            return <div data-testid="music-library">{JSON.stringify(musicLibrary)}</div>;
        }
        initialMusicLibrary = [
            { value: "a", id: "A" },
            { value: "b", id: "B" },
            { value: "c", id: "C" }
        ]
    });
    it('should take in an initial music library and provide the library to consumers', async () => {
        render(<MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
            <MockConsumer />
        </MusicLibraryContainer>);
        expect(screen.getByTestId("music-library")).toHaveTextContent(JSON.stringify(["a", "b", "c"]));
    });
});
"use client";

import AddMusicForm from "./AddMusicForm";
import { useAuth } from "./global/Auth";
import MusicLibraryContainer from "./MusicLibraryContainer";
import MusicLibraryList from "./MusicLibraryList";

const MusicLibraryPage = ({ initialMusicLibrary }) => {
    const { isPublic, isEditor } = useAuth();

    if (isPublic()) {
        return (
            <p data-testid="public-message">
                Please sign in to view the music library
            </p>
        );
    }
    return (
        <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
            <MusicLibraryList data-testid="music-library" />
            {isEditor() && <AddMusicForm data-testid="add-music-form" />}
        </MusicLibraryContainer>
    );
};

export default MusicLibraryPage;

"use client";

import AddMusicForm from "./AddMusicForm";
import ChangePollingContainer from "./ChangePollingContainer";
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
        <ChangePollingContainer>
            <MusicLibraryContainer initialMusicLibrary={initialMusicLibrary}>
                <MusicLibraryList />
                {isEditor() && <AddMusicForm />}
            </MusicLibraryContainer>
        </ChangePollingContainer>
    );
};

export default MusicLibraryPage;

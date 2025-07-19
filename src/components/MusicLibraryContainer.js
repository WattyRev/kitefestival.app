import { createContext, useContext } from "react";

export const MusicLibraryContext = createContext({
    musicLibrary: [],
});

export const useMusicLibrary = () => {
    const { musicLibrary } = useContext(MusicLibraryContext);
    return { musicLibrary: musicLibrary.map(({ value }) => value) };
};

const MusicLibraryContainer = ({ children, initialMusicLibrary }) => {
    return (
        <MusicLibraryContext.Provider
            value={{ musicLibrary: initialMusicLibrary }}
        >
            {children}
        </MusicLibraryContext.Provider>
    );
};

export default MusicLibraryContainer;

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAlert } from "./ui/Alert";
import { useChangePolling } from "./ChangePollingContainer";
import {
    addToMusicLibrary,
    deleteFromMusicLibrary,
    editMusicEntry,
    getMusicLibrary,
} from "../app/api/musicLibrary";

export const MusicLibraryContext = createContext({
    musicLibrary: [],
});

export const useMusicLibrary = () => {
    return useContext(MusicLibraryContext);
};

let lastUpdate = new Date().getTime() - 15000;

const MusicLibraryContainer = ({ children, initialMusicLibrary }) => {
    const { changes } = useChangePolling();
    const { openAlert } = useAlert();
    const [musicLibrary, setMusicLibrary] = useState(initialMusicLibrary);

    async function refresh() {
        const { musicLibrary } = await getMusicLibrary();
        setMusicLibrary(musicLibrary);
    }

    async function addMusic(musicItems) {
        try {
            await addToMusicLibrary(musicItems);
        } catch (error) {
            openAlert(error.message, "error");
            return;
        }

        await refresh();
    }

    async function deleteMusic(musicIds) {
        try {
            await deleteFromMusicLibrary(musicIds);
        } catch (error) {
            openAlert(error.message, "error");
            return;
        }
        await refresh();
    }

    async function updateMusic(musicId, value) {
        await editMusicEntry(musicId, value);
        await refresh();
    }

    const checkForUpdates = useCallback(async () => {
        const newerChanges = changes.filter(
            (change) =>
                new Date(change.updated).getTime() > lastUpdate &&
                change.tablename === "musiclibrary",
        );
        if (!newerChanges.length) {
            return;
        }
        lastUpdate = new Date().getTime();
        return refresh();
    }, [changes, refresh]);

    useEffect(() => {
        checkForUpdates();
    }, [changes, checkForUpdates]);

    return (
        <MusicLibraryContext.Provider
            value={{
                musicLibrary,
                refresh,
                addMusic,
                deleteMusic,
                updateMusic,
            }}
        >
            {children}
        </MusicLibraryContext.Provider>
    );
};

export default MusicLibraryContainer;

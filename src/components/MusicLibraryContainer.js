import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAlert } from "./ui/Alert";
import fetch from "../util/fetch";
import { useChangePolling } from "./ChangePollingContainer";

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

    const refresh = useCallback(async () => {
        const response = await fetch("/api/music-library");
        const { musicLibrary } = await response.json();
        setMusicLibrary(musicLibrary);
    }, []);

    async function addMusic(musicItems) {
        const response = await fetch("/api/music-library", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ musicLibrary: musicItems }),
        });

        if (!response.ok) {
            openAlert("Failed to add music", "error");
            return;
        }

        await refresh();
    }

    async function deleteMusic(musicIds) {
        await fetch("/api/music-library", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ musicIds }),
        });
        await refresh();
    }

    async function updateMusic(musicId, value) {
        await fetch(`/api/music-library/${musicId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ value }),
        });
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

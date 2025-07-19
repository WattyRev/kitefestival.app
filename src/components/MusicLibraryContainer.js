import { createContext, useContext, useState } from "react";
import { useAlert } from "./ui/Alert";
import fetch from "../util/fetch";

export const MusicLibraryContext = createContext({
    musicLibrary: [],
});

export const useMusicLibrary = () => {
    return useContext(MusicLibraryContext);
};

const MusicLibraryContainer = ({ children, initialMusicLibrary }) => {
    const { openAlert } = useAlert();
    const [musicLibrary, setMusicLibrary] = useState(initialMusicLibrary);

    async function refresh() {
        const response = await fetch("/api/music-library");
        const { musicLibrary } = await response.json();
        setMusicLibrary(musicLibrary);
    }

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

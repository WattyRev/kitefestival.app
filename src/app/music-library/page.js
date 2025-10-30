import MusicLibraryPage from "../../components/MusicLibraryPage";
import { getMusicLibrary } from "../api/musicLibrary";

export const revalidate = 10;
export default async function MusicLibrary() {
    const { musicLibrary } = await getMusicLibrary();

    return <MusicLibraryPage initialMusicLibrary={musicLibrary} />;
}

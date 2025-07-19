import MusicLibraryPage from "../../components/MusicLibraryPage";
import { sql } from "@vercel/postgres";

export const revalidate = 10;
export default async function MusicLibrary() {
    const musicLibraryResponse =
        await sql`SELECT * FROM musiclibrary ORDER BY id ASC`;
    const musicLibrary = musicLibraryResponse.rows.map((music) => {
        const { id, value } = music;
        return {
            id,
            value,
        };
    });

    return <MusicLibraryPage initialMusicLibrary={musicLibrary} />;
}

import { useMemo, useState } from "react";
import { useAuth } from "./global/Auth";
import MusicLibraryActions from "./MusicLibraryActions";
import { useMusicLibrary } from "./MusicLibraryContainer";
import Button from "./ui/Button";
import { Table, Tbody, Td, Th, Thead, Tr } from "./ui/Table";
import TextInput from "./ui/TextInput";
import { css } from "../../styled-system/css";
import H1 from "./ui/H1";
import Checkbox from "./ui/Checkbox";
import { usePrompt } from "./ui/Prompt";

const MusicLibraryList = ({ ...props }) => {
    const { musicLibrary, deleteMusic } = useMusicLibrary();
    const [pending, setPending] = useState(false);
    const { isEditor } = useAuth();
    const [selectedMusic, setSelectedMusic] = useState([]);
    const { openPrompt } = usePrompt();

    const [searchTerm, setSearchTerm] = useState("");
    const filteredMusicLibrary = useMemo(() => {
        if (!searchTerm) {
            return musicLibrary;
        }
        return musicLibrary.filter((music) =>
            music.value.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [searchTerm, musicLibrary]);

    async function deleteSelectedMusic() {
        await openPrompt(
            `Are you sure you want to delete ${selectedMusic.length} item${selectedMusic.length > 0 ? "s" : ""} from the music library?`,
            "confirm",
        );
        setPending(true);
        await deleteMusic(selectedMusic);
        setSelectedMusic([]);
        setPending(false);
    }

    return (
        <div {...props}>
            <H1>Music Library</H1>
            <div className={css({ display: "flex", gap: "8px" })}>
                <TextInput
                    data-testid="music-search"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                    }}
                />
                <Button
                    title="Clear"
                    className="secondary"
                    data-testid="clear-search"
                    disabled={!searchTerm}
                    onClick={() => {
                        setSearchTerm("");
                    }}
                >
                    <i className="fa-solid fa-xmark"></i>
                </Button>
            </div>
            {isEditor() && (
                <div className={css({ display: "flex", gap: "8px" })}>
                    <Button
                        title={`Delete ${selectedMusic.length} items`}
                        className="danger"
                        data-testid="delete-multiple"
                        disabled={!selectedMusic.length || pending}
                        onClick={deleteSelectedMusic}
                    >
                        <i className="fa-solid fa-trash"></i> Delete{" "}
                        {selectedMusic.length} item
                        {selectedMusic.length === 1 ? "" : "s"}
                    </Button>
                </div>
            )}
            <Table>
                <Thead>
                    <Tr>
                        {isEditor() && (
                            <Th className={css({ width: "35px" })}>
                                <Checkbox
                                    data-testid="select-all"
                                    indeterminate={
                                        selectedMusic.length > 0 &&
                                        selectedMusic.length <
                                            musicLibrary.length
                                    }
                                    checked={
                                        selectedMusic.length ===
                                        musicLibrary.length
                                    }
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedMusic(
                                                musicLibrary.map(
                                                    (music) => music.id,
                                                ),
                                            );
                                        } else {
                                            setSelectedMusic([]);
                                        }
                                    }}
                                />
                            </Th>
                        )}
                        <Th>Music</Th>
                        {isEditor() && (
                            <Th
                                className={css({ width: "140px" })}
                                data-testid="actions-header"
                            ></Th>
                        )}
                    </Tr>
                </Thead>
                <Tbody>
                    {!musicLibrary.length && (
                        <Tr>
                            <Td colSpan={isEditor() ? 2 : 1}>No music found</Td>
                        </Tr>
                    )}
                    {filteredMusicLibrary.map((music) => (
                        <Tr key={music.id}>
                            {isEditor() && (
                                <Td className={css({ width: "35px" })}>
                                    <Checkbox
                                        data-testid="select-music"
                                        checked={selectedMusic.includes(
                                            music.id,
                                        )}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMusic([
                                                    ...selectedMusic,
                                                    music.id,
                                                ]);
                                            } else {
                                                setSelectedMusic(
                                                    selectedMusic.filter(
                                                        (id) => id !== music.id,
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                </Td>
                            )}
                            <Td>{music.value}</Td>
                            {isEditor() && (
                                <Td
                                    className={css({ width: "140px" })}
                                    data-testid="actions"
                                >
                                    <MusicLibraryActions
                                        music={music}
                                        pending={pending}
                                    />
                                </Td>
                            )}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </div>
    );
};

export default MusicLibraryList;

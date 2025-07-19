import { useMemo, useState } from "react";
import { useAuth } from "./global/Auth";
import MusicLibraryActions from "./MusicLibraryActions";
import { useMusicLibrary } from "./MusicLibraryContainer";
import Button from "./ui/Button";
import { Table, Tbody, Td, Th, Thead, Tr } from "./ui/Table";
import TextInput from "./ui/TextInput";
import { css } from "../../styled-system/css";
import H1 from "./ui/H1";

const MusicLibraryList = ({ ...props }) => {
    const { musicLibrary } = useMusicLibrary();
    const { isEditor } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const filteredMusicLibrary = useMemo(() => {
        if (!searchTerm) {
            return musicLibrary;
        }
        return musicLibrary.filter((music) =>
            music.value.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [searchTerm, musicLibrary]);

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
            <Table>
                <Thead>
                    <Tr>
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
                            <Td>{music.value}</Td>
                            {isEditor() && (
                                <Td
                                    className={css({ width: "140px" })}
                                    data-testid="actions"
                                >
                                    <MusicLibraryActions music={music} />
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

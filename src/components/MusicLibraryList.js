import { useAuth } from "./global/Auth";
import MusicLibraryActions from "./MusicLibraryActions";
import { useMusicLibrary } from "./MusicLibraryContainer";
import { Table, Tbody, Td, Th, Thead, Tr } from "./ui/Table";

const MusicLibraryList = ({ ...props }) => {
    const { musicLibrary } = useMusicLibrary();
    const { isEditor } = useAuth();

    return (
        <Table {...props}>
            <Thead>
                <Tr>
                    <Th>Music</Th>
                    {isEditor() && <Th data-testid="actions-header"></Th>}
                </Tr>
            </Thead>
            <Tbody>
                {musicLibrary.map((music) => (
                    <Tr key={music.id}>
                        <Td>{music.value}</Td>
                        {isEditor() && (
                            <Td data-testid="actions">
                                <MusicLibraryActions music={music} />
                            </Td>
                        )}
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

export default MusicLibraryList;

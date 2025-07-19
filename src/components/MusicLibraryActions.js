import { useState } from "react";
import { useMusicLibrary } from "./MusicLibraryContainer";
import { css } from "../../styled-system/css";
import Button from "./ui/Button";
import { usePrompt } from "./ui/Prompt";

const MusicLibraryActions = ({ music, ...props }) => {
    const { openPrompt } = usePrompt();
    const { deleteMusic, updateMusic } = useMusicLibrary();
    const [isLoading, setIsLoading] = useState(false);

    async function handleDelete() {
        setIsLoading(true);
        await deleteMusic([music.id]);
        setIsLoading(false);
    }

    async function editItem() {
        const newValue = await openPrompt("Edit Item", "text", music.value);

        setIsLoading(true);
        await updateMusic(music.id, newValue);
        setIsLoading(false);
    }

    return (
        <div className={css({ display: "flex", gap: "8px" })} {...props}>
            <Button
                title="Edit"
                disabled={isLoading}
                onClick={editItem}
                type="button"
                className="secondary"
            >
                <i className="fa-solid fa-pen"></i>
            </Button>
            <Button
                title="Delete"
                disabled={isLoading}
                onClick={handleDelete}
                type="button"
                className="danger"
            >
                <i className="fa-solid fa-trash"></i>
            </Button>
        </div>
    );
};

export default MusicLibraryActions;

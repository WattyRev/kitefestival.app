import { useState } from "react";
import { css } from "../../styled-system/css";
import Button from "./ui/Button";
import TextInput from "./ui/TextInput";
import { useMusicLibrary } from "./MusicLibraryContainer";

const AddMusicForm = ({ ...props }) => {
    const { addMusic } = useMusicLibrary();
    const [musicValue, setMusicValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSingleSubmit() {
        if (!musicValue) {
            return;
        }
        setIsLoading(true);
        await addMusic([
            {
                value: musicValue,
            },
        ]);
        setMusicValue("");
        setIsLoading(false);
    }

    return (
        <>
            <form
                data-testid="add-music-form"
                {...props}
                className={css({
                    display: "flex",
                    gap: "8px",
                    margin: "16px 0",
                })}
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSingleSubmit();
                }}
            >
                <TextInput
                    data-testid="music-input"
                    disabled={isLoading}
                    required
                    placeholder="Add new"
                    value={musicValue}
                    onChange={(e) => setMusicValue(e.target.value)}
                />
                <Button
                    data-testid="add-music-button"
                    disabled={!musicValue?.trim() || isLoading}
                    type="submit"
                >
                    <i className="fa-solid fa-plus"></i>
                </Button>
            </form>
            <Button type="button">TODO Bulk Upload</Button>
        </>
    );
};

export default AddMusicForm;

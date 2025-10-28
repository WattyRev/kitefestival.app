import { useState } from "react";
import { css } from "../../styled-system/css";
import Button from "./ui/Button";
import TextInput from "./ui/TextInput";
import { useMusicLibrary } from "./MusicLibraryContainer";
import FileInput from "./ui/FileInput";
import H2 from "./ui/H2";
import { useAlert } from "./ui/Alert";
import LinkButton from "./ui/LinkButton";
import downloadAsCsv from "../util/downloadAsCsv";

export function generateCSVExampleString() {
    return ["Song1", "Song2", "Song3", "Song4"].join("\n");
}

const AddMusicForm = ({ ...props }) => {
    const { addMusic } = useMusicLibrary();
    const [musicValue, setMusicValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { openAlert } = useAlert();

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

    async function handleFileSubmit(file) {
        if (!file) {
            return;
        }
        if (file.type !== "text/csv") {
            openAlert(
                "Invalid file type selected. Please upload a CSV file.",
                "error",
            );
            return;
        }
        setIsLoading(true);

        const parsedMusic = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const csvString = e.target.result;
                const rows = csvString.split("\n");
                const music = rows.map((row) => ({
                    value: row.split(",")[0].trim(),
                }));
                resolve(music);
            };
            reader.readAsText(file);
        });
        await addMusic(parsedMusic);
        setIsLoading(false);
    }

    return (
        <div className={css({ paddingBottom: "16px" })}>
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
            <H2>Bulk Upload</H2>
            <FileInput
                data-testid="upload-file"
                onChange={(e) => handleFileSubmit(e.target.files[0])}
                label={
                    <>
                        <i className="fa-solid fa-upload"></i> Upload CSV
                    </>
                }
                accept="text/csv"
            />
            <LinkButton
                onClick={() => {
                    const exampleContent = generateCSVExampleString();
                    downloadAsCsv(exampleContent, "example-music.csv");
                }}
            >
                Download Example CSV
            </LinkButton>
        </div>
    );
};

export default AddMusicForm;

"use client";

import { useState } from "react";
import Panel from "./ui/Panel";
import Button from "./ui/Button";
import H1 from "./ui/H1";
import { css } from "../../styled-system/css";
import TextInputList from "./ui/TextInputList";

const ActivityMusicForm = ({
    onSubmit,
    music: defaultMusic = [],
    onCancel,
}) => {
    const [pending, setPending] = useState(false);
    const [music, setMusic] = useState(defaultMusic);

    async function submit() {
        setPending(true);
        await onSubmit({ music });
        setMusic([]);
        setPending(false);
    }
    return (
        <form
            data-testid="activity-music-form"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            <H1
                className={css({
                    paddingLeft: { base: "12px", sm: "16px" },
                    paddingTop: { base: "16px", sm: "32px" },
                    fontSize: { base: "20px", sm: "24px" },
                })}
            >
                Edit Music
            </H1>
            <Panel>
                <label>Music</label>
                <TextInputList
                    value={music}
                    onChange={(value) => setMusic(value)}
                />
                <Button
                    data-testid="save-activity"
                    type="submit"
                    disabled={pending}
                >
                    Save
                </Button>
                {onCancel && (
                    <Button
                        data-testid="cancel-activity"
                        className="secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
            </Panel>
        </form>
    );
};

export default ActivityMusicForm;

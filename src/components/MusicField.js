import { useMemo } from "react";
import { useMusicLibrary } from "./MusicLibraryContainer";
import AutoCompleteTextInput from "./ui/AutoCompleteTextInput";
import InputList from "./ui/InputList";

/**
 * A field for editing a list of music items.
 *
 * This uses the {@link InputList} component to manage the list of music items,
 * and the {@link AutoCompleteTextInput} component to render each item.
 * This uses the {@link useMusicLibrary} hook to get the list of music items.
 *
 * @param {String[]} value The initial array of music items.
 * @param {function} onChange Called when the value changes.
 * @param {object} props Any additional props to pass to the component.
 */
const MusicField = ({ value, onChange, ...props }) => {
    const { musicLibrary } = useMusicLibrary();
    const songs = useMemo(
        () => musicLibrary.map((musicItem) => musicItem.value),
        [musicLibrary],
    );
    return (
        <InputList
            {...props}
            value={value}
            onChange={(newValue) => onChange(newValue)}
            inputRender={({ index, item, onChange: handleChange }) => (
                <AutoCompleteTextInput
                    options={songs}
                    data-testid={`input-item-${index}`}
                    type="text"
                    value={item}
                    onChange={(newValue) => handleChange(newValue)}
                />
            )}
        />
    );
};

export default MusicField;

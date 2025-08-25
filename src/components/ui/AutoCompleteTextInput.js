import { useMemo, useState } from "react";
import TextInput from "./TextInput";
import { css } from "../../../styled-system/css";

/**
 * A text input that can suggest values based on provided options
 *
 * @param {String} value the current value of the input
 * @param {String[]} options suggestabe value options
 * @param {function} onChange called with the new string value when changes are made
 */
const AutoCompleteTextInput = ({ value, options = [], onChange, ...props }) => {
    const relevantOptions = useMemo(() => {
        // When empty, show the first few library items so users immediately see suggestions
        if (!value) {
            return options.slice(0, 5);
        }
        return options
            .filter(
                (option) =>
                    option.toLowerCase().includes(value.toLowerCase()) &&
                    option.toLowerCase() !== value.toLowerCase(),
            )
            .slice(0, 5);
    }, [value, options]);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={css({ position: "relative" })}>
            {isFocused && relevantOptions.length > 0 && (
                <div
                    className={css({
                        position: "absolute",
                        background: "white",
                        border: "1px solid black",
                        padding: "4px",
                        bottom: "100%",
                        borderRadius: "4px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        width: "100%",
                    })}
                >
                    <p
                        className={css({
                            fontSize: "12px",
                            color: "gray",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                        })}
                    >
                        Suggestions
                    </p>
                    <ul data-testid="suggestions">
                        {relevantOptions.map((option, index) => (
                            <li
                                data-testid={`suggestion-${index}`}
                                title={option}
                                className={css({
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "4px",
                                    width: "100%",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    _hover: {
                                        background: "rgba(0, 0, 0, 0.4)",
                                    },
                                })}
                                key={option}
                                onClick={() => onChange(option)}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <TextInput
                data-testid="input"
                {...props}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 100)}
            />
        </div>
    );
};

export default AutoCompleteTextInput;

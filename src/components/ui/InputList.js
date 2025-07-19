import { css } from "../../../styled-system/css";

import Button from "./Button";
import { usePrompt } from "./Prompt";

/**
 * A component that renders a list of inputs. It facilitates management of a
 * list, allowing the user to add, remove, edit, and reorder items.
 *
 * Uses usePrompt, so it must be wrapped in a PromptProvider.
 *
 * @param {String[]} [value] The initial array of values.
 * @param {function} onChange Called when the value changes.
 * @param {function} inputRender A function that renders a single input. Provided {index, item, onChange} as an argument.
 */
const InputList = ({ value = [], onChange, inputRender, ...props }) => {
    const { openPrompt } = usePrompt();

    function handleChange(singleValue, index) {
        const newValue = [...value];
        newValue[index] = singleValue;
        onChange(newValue);
    }

    async function handleRemove(index) {
        if (value[index].trim() !== "") {
            try {
                await openPrompt(
                    "Are you sure you want to remove this item?",
                    "confirm",
                );
            } catch {
                return;
            }
        }
        const newValue = [...value];
        newValue.splice(index, 1);
        onChange(newValue);
    }

    function moveUp(index) {
        const newValue = [...value];
        const temp = newValue[index];
        newValue[index] = newValue[index - 1];
        newValue[index - 1] = temp;
        onChange(newValue);
    }

    function moveDown(index) {
        const newValue = [...value];
        const temp = newValue[index];
        newValue[index] = newValue[index + 1];
        newValue[index + 1] = temp;
        onChange(newValue);
    }

    return (
        <ol {...props}>
            {value.map((item, index) => (
                <li
                    key={index}
                    className={css({
                        display: "flex",
                        alignItems: "center",
                    })}
                >
                    <p className={css({ width: "25px", marginRight: "8px" })}>
                        {index + 1}.
                    </p>
                    {inputRender({
                        index,
                        item,
                        onChange(newValue) {
                            handleChange(newValue, index);
                        },
                    })}
                    {index !== 0 && (
                        <Button
                            type="button"
                            data-testid={`move-up-item-${index}`}
                            onClick={() => moveUp(index)}
                        >
                            <i className="fa-solid fa-arrow-up" />
                        </Button>
                    )}
                    {index !== value.length - 1 && (
                        <Button
                            type="button"
                            data-testid={`move-down-item-${index}`}
                            onClick={() => moveDown(index)}
                        >
                            <i className="fa-solid fa-arrow-down" />
                        </Button>
                    )}
                    <Button
                        className="danger"
                        type="button"
                        data-testid={`remove-item-${index}`}
                        onClick={() => handleRemove(index)}
                    >
                        <i className="fa-solid fa-minus" />
                    </Button>
                </li>
            ))}
            <li>
                <Button
                    type="button"
                    data-testid="add-item"
                    onClick={() => handleChange("", value.length)}
                >
                    <i className="fa-solid fa-plus" />
                </Button>
            </li>
        </ol>
    );
};

export default InputList;

import { useEffect, useRef } from "react";

/**
 * A checkbox component that can be used to toggle a boolean value.
 *
 * @param {string} [className] The CSS class name to apply to the checkbox.
 * @param {boolean} checked Whether the checkbox is checked.
 * @param {boolean} indeterminate Whether the checkbox is in an indeterminate state.
 * @param {function} onChange Called when the checkbox is changed.
 */
const Checkbox = ({
    className = "",
    checked,
    indeterminate,
    onChange,
    ...props
}) => {
    const checkboxRef = useRef(null);
    useEffect(() => {
        checkboxRef.current.indeterminate = indeterminate;
    }, [checkboxRef, indeterminate]);

    return (
        <input
            {...props}
            ref={checkboxRef}
            type="checkbox"
            className={className}
            checked={checked}
            onChange={onChange}
        />
    );
};

export default Checkbox;

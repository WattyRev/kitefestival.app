import React from "react";
import { css } from "../../../styled-system/css";

const TextInput = ({ ...props }) => {
    return (
        <input
            type="text"
            className={css({
                border: "1px solid black",
                borderRadius: "3px",
                background: "rgba(255,255,255,.5)",
                width: "100%",
                padding: { base: "8px", sm: "6px" },
                fontSize: { base: "16px", sm: "14px" }, // Prevent zoom on iOS
                minHeight: { base: "44px", sm: "auto" }, // Minimum touch target for mobile
                boxSizing: "border-box",
            })}
            {...props}
        />
    );
};

export default TextInput;

import React from "react";
import { css } from "../../../styled-system/css";

export const buttonStyles = css({
    color: "link",
    cursor: "pointer",
    _hover: {
        textDecoration: "underline",
    },
});

const LinkButton = ({ className = "", children, ...props }) => {
    return (
        <button className={`${className} ${buttonStyles}`} {...props}>
            {children}
        </button>
    );
};

export default LinkButton;

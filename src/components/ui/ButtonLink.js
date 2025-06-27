import React from "react";
import { buttonStyles } from "./Button";

const ButtonLink = ({ children, className = "", ...props }) => {
    return (
        <a className={`${className} ${buttonStyles}`} {...props}>
            {children}
        </a>
    );
};

export default ButtonLink;

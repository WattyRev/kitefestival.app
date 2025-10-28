import React from "react";
import { css } from "../../../styled-system/css";

const H2 = ({ children, className, ...props }) => {
    return (
        <h2
            className={`${className} ${css({
                fontSize: "1.1rem",
                fontWeight: "600",
            })}`}
            {...props}
        >
            {children}
        </h2>
    );
};

export default H2;

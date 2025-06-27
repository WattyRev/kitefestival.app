import React from "react";
import { css } from "../../../styled-system/css";

const styles = css({
    background: "sectionBackground",
    padding: { base: "12px 16px", sm: "8px 16px" },
    margin: { base: "8px 4px", sm: "8px 0" },
    borderRadius: "4px",
});

const Panel = ({ children, className = "", ...props }) => {
    return (
        <div className={`${styles} ${className}`} {...props}>
            {children}
        </div>
    );
};

export default Panel;

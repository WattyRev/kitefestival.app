import React from "react";
import { css } from "../../../styled-system/css";

const UndoButton = ({ onUndo, disabled = false, ...props }) => {
    return (
        <button
            onClick={onUndo}
            disabled={disabled}
            className={css({
                position: "fixed",
                bottom: "20px",
                right: "20px",
                background: "rgba(0, 0, 0, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "50px",
                padding: "12px 20px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                fontSize: "14px",
                fontWeight: "bold",
                zIndex: "1000",
                transition: "all 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                _hover: {
                    background: "rgba(0, 0, 0, 0.9)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.4)",
                },
                _active: {
                    transform: "translateY(0px)",
                },
                _disabled: {
                    cursor: "not-allowed",
                    opacity: "0.5",
                    transform: "none",
                },
            })}
            {...props}
        >
            <i className="fa-solid fa-rotate-left" />
            Undo Move
        </button>
    );
};

export default UndoButton;

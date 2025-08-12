"use client";

import { useTheme } from "./ThemeProvider";
import { css } from "../../styled-system/css";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={css({
                position: "fixed",
                top: "1rem",
                right: "1rem",
                zIndex: 1000,
                background: "transparent",
                border: "2px solid",
                borderColor: "var(--border-color)",
                borderRadius: "50%",
                width: "3rem",
                height: "3rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                transition: "all 0.3s ease",
                color: "var(--text-color)",
                "&:hover": {
                    background: "var(--hover-bg)",
                    transform: "scale(1.1)",
                },
                "&:focus": {
                    outline: "2px solid var(--focus-color)",
                    outlineOffset: "2px",
                }
            })}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}

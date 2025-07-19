"use client";

import React from "react";
import { css } from "../../../styled-system/css";
import AuthSelection from "./TopNav/AuthSelection";
import { useAuth } from "./Auth";
import Link from "next/link";

const NavItem = ({ children, ...props }) => (
    <Link
        className={css({
            padding: "8px",
            minWidth: "44px",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: { base: "16px", sm: "18px" },
        })}
        {...props}
    >
        {children}
    </Link>
);

const TopNav = ({ ...props }) => {
    const { isPublic } = useAuth();
    return (
        <nav
            data-testid="top-nav"
            className={css({
                boxSizing: "border-box",
                justifyContent: "space-between",
                padding: { base: "8px", sm: "12px" },
                background: "sectionBackground",
                display: "flex",
                alignItems: "center",
                minHeight: { base: "44px", sm: "48px" }, // Ensure touch targets are at least 44px on mobile
            })}
            {...props}
        >
            <div className={css({ display: "flex", gap: "8px" })}>
                <NavItem href="/" title="Home">
                    <i className="fa-solid fa-house"></i>
                </NavItem>
                {!isPublic() && (
                    <NavItem href="/music-library" title="Music Library">
                        <i className="fa-solid fa-music"></i>
                    </NavItem>
                )}
            </div>
            <AuthSelection />
        </nav>
    );
};

export default TopNav;

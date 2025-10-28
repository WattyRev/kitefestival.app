"use client";

import { css } from "../../../styled-system/css";
import A from "../ui/A";
import StyledLink from "../ui/StyledLink";
import { useAuth } from "./Auth";

export const Footer = () => {
    const { isEditor } = useAuth();

    return (
        <footer
            className={css({
                marginTop: "16px",
                padding: "12px",
                textAlign: "center",
            })}
        >
            {isEditor() && <StyledLink href="/logs">View Logs</StyledLink>}
            <p>
                Built by{" "}
                <A href="https://watty.us" target="_blank">
                    Watty
                </A>
            </p>
        </footer>
    );
};

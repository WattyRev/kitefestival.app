'use client'

import { useContext } from "react";
import { AuthContext } from "@/components/global/Auth";
import ButtonLink from "@/components/ui/ButtonLink";

export default function CreateActivityButton() {
    const { isEditor } = useContext(AuthContext);
    if (!isEditor()) {
        return null;
    }
    return (
        <>
            <ButtonLink href="/create-activity">Create Activity</ButtonLink>
        </>
    )
}
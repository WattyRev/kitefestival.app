"use client";

import { useState } from "react";
import fetch from "../../util/fetch";
import Button from "../../components/ui/Button";
import Panel from "../../components/ui/Panel";
import H1 from "../../components/ui/H1";
import H2 from "../../components/ui/H2";
import TextInput from "../../components/ui/TextInput";
import { usePrompt } from "../../components/ui/Prompt";
import { useAlert } from "../../components/ui/Alert";

const usePasscode = () => {
    const [enabled, setEnabled] = useState(false);
    const [passcode, setPasscodeValue] = useState("");

    return {
        enabled,
        passcode,
        toggle: () => setEnabled(!enabled),
        setPasscode: (value) => {
            setPasscodeValue(value);
            if (value) {
                setEnabled(true);
            } else {
                setEnabled(false);
            }
        },
    };
};

export default function ConfigPage() {
    const { openPrompt } = usePrompt();
    const { openAlert } = useAlert();
    const {
        enabled: useAdminPasscode,
        passcode: adminPasscode,
        toggle: toggleAdminPasscode,
        setPasscode: setAdminPasscode,
    } = usePasscode();
    const {
        enabled: useEditorPasscode,
        passcode: editorPasscode,
        toggle: toggleEditorPasscode,
        setPasscode: setEditorPasscode,
    } = usePasscode();
    const {
        enabled: useUserPasscode,
        passcode: userPasscode,
        toggle: toggleUserPasscode,
        setPasscode: setUserPasscode,
    } = usePasscode();

    const submitPasscodes = async function () {
        if (!useAdminPasscode && !useEditorPasscode && !useUserPasscode) {
            return;
        }
        const authentication = await openPrompt(
            "Enter the current admin passcode.",
            "password",
        ).catch(() => "");
        if (!authentication) {
            return;
        }
        const payload = { authentication };
        if (useAdminPasscode) {
            payload.adminPasscode = adminPasscode;
        }
        if (useEditorPasscode) {
            payload.editorPasscode = editorPasscode;
        }
        if (useUserPasscode) {
            payload.userPasscode = userPasscode;
        }
        const response = await fetch("/api/passcodes", {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        const type = response.ok ? "success" : "error";
        const { message } = await response.json();
        openAlert(message, type);
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submitPasscodes();
            }}
        >
            <H1>Config</H1>
            <Panel>
                <H2>Set Passcodes</H2>
                <Panel>
                    <label htmlFor="admin-passcode">Admin</label>&nbsp;
                    <input
                        type="checkbox"
                        checked={useAdminPasscode}
                        onChange={toggleAdminPasscode}
                    />
                    <TextInput
                        id="admin-passcode"
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                    />
                </Panel>
                <Panel>
                    <label htmlFor="editor-passcode">Editor</label>&nbsp;
                    <input
                        type="checkbox"
                        checked={useEditorPasscode}
                        onChange={toggleEditorPasscode}
                    />
                    <TextInput
                        id="editor-passcode"
                        value={editorPasscode}
                        onChange={(e) => setEditorPasscode(e.target.value)}
                    />
                </Panel>
                <Panel>
                    <label htmlFor="user-passcode">User</label>&nbsp;
                    <input
                        type="checkbox"
                        checked={useUserPasscode}
                        onChange={toggleUserPasscode}
                    />
                    <TextInput
                        id="user-passcode"
                        value={userPasscode}
                        onChange={(e) => setUserPasscode(e.target.value)}
                    />
                </Panel>
            </Panel>
            <Button type="submit">Submit</Button>
        </form>
    );
}

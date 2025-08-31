"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import fetch from "../../util/fetch";
import Button from "../../components/ui/Button";
import Panel from "../../components/ui/Panel";
import H1 from "../../components/ui/H1";
import H2 from "../../components/ui/H2";
import TextInput from "../../components/ui/TextInput";
import { usePrompt } from "../../components/ui/Prompt";
import { useAlert } from "../../components/ui/Alert";
import { css } from "../../../styled-system/css";

// Dynamic imports for management components
// Temporarily disabled: Data Management panel
// const DataManagement = dynamic(() => import("./DataManagement"), {
//     ssr: false,
// });
const EventsManagement = dynamic(() => import("./EventsManagement"), {
    ssr: false,
});

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
    const [activeTab, setActiveTab] = useState("passcodes");

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
        <div
            className={css({
                borderRadius: "32px",
                background: "white",
                boxShadow: "0 2px 16px rgba(49,130,206,0.08)",
                padding: "32px",
                margin: "48px auto",
                maxWidth: "900px",
                maxHeight: "800px",
            })}
        >
            <H1>Configuration</H1>

            {/* Tab Navigation */}
            <div
                className={css({
                    display: "flex",
                    borderBottom: "2px solid gray.200",
                    marginBottom: "24px",
                    position: "relative",
                    borderRadius: "0",
                    overflow: "visible",
                    paddingTop: "8px",
                })}
            >
                <button
                    onClick={() => setActiveTab("passcodes")}
                    className={css({
                        padding: "12px 24px",
                        backgroundColor:
                            activeTab === "passcodes"
                                ? "blue.100"
                                : "transparent",
                        color:
                            activeTab === "passcodes" ? "#1a365d" : "gray.600",
                        border:
                            activeTab === "passcodes"
                                ? "2px solid #3182ce"
                                : "none",
                        borderBottom:
                            activeTab === "passcodes" ? "none" : undefined,
                        borderRadius: "100px",
                        cursor: "pointer",
                        fontWeight: "600",
                        marginRight: "4px",
                        marginBottom: activeTab === "passcodes" ? "-2px" : "0",
                        boxShadow:
                            activeTab === "passcodes"
                                ? "0 6px 24px rgba(49,130,206,0.25), 0 1.5px 6px rgba(49,130,206,0.15)"
                                : undefined,
                        zIndex: activeTab === "passcodes" ? 10 : 1,
                        transform:
                            activeTab === "passcodes"
                                ? "scale(1.08)"
                                : undefined,
                        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                        "&:hover": {
                            backgroundColor:
                                activeTab === "passcodes"
                                    ? "blue.200"
                                    : "gray.100",
                            color:
                                activeTab === "passcodes"
                                    ? "#1a365d"
                                    : undefined,
                        },
                    })}
                >
                    🔐 Passcodes
                </button>
                <button
                    onClick={() => setActiveTab("events")}
                    className={css({
                        padding: "12px 24px",
                        backgroundColor:
                            activeTab === "events" ? "blue.100" : "transparent",
                        color: activeTab === "events" ? "#1a365d" : "gray.600",
                        border:
                            activeTab === "events"
                                ? "2px solid #3182ce"
                                : "none",
                        borderBottom:
                            activeTab === "events" ? "none" : undefined,
                        borderRadius: "100px",
                        cursor: "pointer",
                        fontWeight: "600",
                        marginRight: "4px",
                        marginBottom: activeTab === "events" ? "-2px" : "0",
                        boxShadow:
                            activeTab === "events"
                                ? "0 6px 24px rgba(49,130,206,0.25), 0 1.5px 6px rgba(49,130,206,0.15)"
                                : undefined,
                        zIndex: activeTab === "events" ? 10 : 1,
                        transform:
                            activeTab === "events" ? "scale(1.08)" : undefined,
                        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                        "&:hover": {
                            backgroundColor:
                                activeTab === "events"
                                    ? "blue.200"
                                    : "gray.100",
                            color:
                                activeTab === "events" ? "#1a365d" : undefined,
                        },
                    })}
                >
                    🎪 Events
                </button>
                {/*
                <button
                    onClick={() => setActiveTab("data")}
                    className={css({
                        padding: "12px 24px",
                        backgroundColor:
                            activeTab === "data" ? "blue.100" : "transparent",
                        color: activeTab === "data" ? "#1a365d" : "gray.600",
                        border:
                            activeTab === "data" ? "2px solid #3182ce" : "none",
                        borderBottom: activeTab === "data" ? "none" : undefined,
                        borderRadius: "100px",
                        cursor: "pointer",
                        fontWeight: "600",
                        marginBottom: activeTab === "data" ? "-2px" : "0",
                        boxShadow:
                            activeTab === "data"
                                ? "0 6px 24px rgba(49,130,206,0.25), 0 1.5px 6px rgba(49,130,206,0.15)"
                                : undefined,
                        zIndex: activeTab === "data" ? 10 : 1,
                        transform:
                            activeTab === "data" ? "scale(1.08)" : undefined,
                        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                        "&:hover": {
                            backgroundColor:
                                activeTab === "data" ? "blue.200" : "gray.100",
                            color: activeTab === "data" ? "#1a365d" : undefined,
                        },
                    })}
                >
                    💾 Data Management
                </button>
                */}
            </div>

            {/* Tab Content */}
            {activeTab === "passcodes" && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submitPasscodes();
                    }}
                    className={css({ borderRadius: "24px" })}
                >
                    <Panel style={{ borderRadius: "24px" }}>
                        <H2>Set Passcodes</H2>
                        <Panel style={{ borderRadius: "24px" }}>
                            <label htmlFor="admin-passcode">Admin</label>&nbsp;
                            <input
                                type="checkbox"
                                checked={useAdminPasscode}
                                onChange={toggleAdminPasscode}
                            />
                            <TextInput
                                id="admin-passcode"
                                value={adminPasscode}
                                onChange={(e) =>
                                    setAdminPasscode(e.target.value)
                                }
                            />
                        </Panel>
                        <Panel style={{ borderRadius: "24px" }}>
                            <label htmlFor="editor-passcode">Editor</label>
                            &nbsp;
                            <input
                                type="checkbox"
                                checked={useEditorPasscode}
                                onChange={toggleEditorPasscode}
                            />
                            <TextInput
                                id="editor-passcode"
                                value={editorPasscode}
                                onChange={(e) =>
                                    setEditorPasscode(e.target.value)
                                }
                            />
                        </Panel>
                        <Panel style={{ borderRadius: "24px" }}>
                            <label htmlFor="user-passcode">User</label>&nbsp;
                            <input
                                type="checkbox"
                                checked={useUserPasscode}
                                onChange={toggleUserPasscode}
                            />
                            <TextInput
                                id="user-passcode"
                                value={userPasscode}
                                onChange={(e) =>
                                    setUserPasscode(e.target.value)
                                }
                            />
                        </Panel>
                    </Panel>
                    <Button type="submit">Submit</Button>
                </form>
            )}

            {activeTab === "events" && <EventsManagement />}

            {/* {activeTab === "data" && <DataManagement />} */}
        </div>
    );
}

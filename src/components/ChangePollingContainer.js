import { createContext, useContext, useEffect, useState } from "react";
import fetch from "../util/fetch";
import setInterval from "../util/setInterval";
import clearInterval from "../util/clearInterval";

const PollingContext = createContext({});

export const useChangePolling = () => {
    return useContext(PollingContext);
};

const ChangePollingContainer = ({ children }) => {
    const [changes, setChanges] = useState([]);
    const checkForUpdates = async () => {
        const changesResponse = await fetch("/api/changes");
        if (!changesResponse.ok) {
            return;
        }
        const changesJson = await changesResponse.json();
        const updatedChanges = changesJson.changes;
        if (!updatedChanges?.length) {
            return;
        }
        setChanges(updatedChanges);
    };

    useEffect(() => {
        checkForUpdates();
        // Adaptive interval based on Network Information API if available
        const conn = typeof navigator !== "undefined" && navigator.connection;
        // Defaults to 7.5s; increase on slow/2g
        let pollingMs = 7500;
        if (conn) {
            const type = conn.effectiveType || "";
            if (type.includes("2g")) pollingMs = 20000;
            else if (type === "slow-2g") pollingMs = 25000;
            else if (type === "3g") pollingMs = 12000;
        }
        const interval = setInterval(() => {
            checkForUpdates();
        }, pollingMs);
        return () => clearInterval(interval);
    }, []);

    return (
        <PollingContext.Provider value={{ changes }}>
            {children}
        </PollingContext.Provider>
    );
};

export default ChangePollingContainer;

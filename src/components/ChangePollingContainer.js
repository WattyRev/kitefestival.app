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
        const interval = setInterval(() => {
            checkForUpdates();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <PollingContext.Provider value={{ changes }}>
            {children}
        </PollingContext.Provider>
    );
};

export default ChangePollingContainer;

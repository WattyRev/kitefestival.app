import { createContext, useContext, useEffect, useState } from "react";
import setInterval from "../util/setInterval";
import clearInterval from "../util/clearInterval";
import { getChanges } from "../app/api/changes";

const PollingContext = createContext({});

export const useChangePolling = () => {
    return useContext(PollingContext);
};

const ChangePollingContainer = ({ children }) => {
    const [changes, setChanges] = useState([]);
    const checkForUpdates = async () => {
        const changesResponse = await getChanges().catch(() => {});
        const latestChanges = changesResponse?.changes;
        if (!latestChanges?.length) {
            return;
        }
        setChanges(latestChanges);
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

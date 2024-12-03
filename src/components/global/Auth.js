'use client'
import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext({ 
    setAuthentication: () => {},
    clearAuthentication: () => {},
    isEditor: () => false,
    isUser: () => false,
    isPublic: () => true
});

export const useAuth = () => useContext(AuthContext);

function getAuthDataFromLocalStorage() {
    const localData = window.localStorage.getItem('authentication');
    if (!localData) {
        return {};
    }
    const parsedData = JSON.parse(localData);
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    
    // Ignore auth data if it is more than 3 days old
    if (new Date().getTime() - (parsedData.setTime || 0) > threeDays) {
        return {};
    }
    return parsedData;
}

export function AuthProvider({ children }) {
    const [ auth, setAuth ] = useState({});
    useEffect(() => {
        setAuth(getAuthDataFromLocalStorage())
    }, []);
    function setAuthentication(auth) {
        setAuth(auth);
        window.localStorage.setItem('authentication', JSON.stringify({
            ...auth,
            setTime: new Date().getTime()
        }));
    }
    function clearAuthentication() {
        setAuth({});
        window.localStorage.removeItem('authentication');
    }
    function isEditor() {
        return auth?.userType === 'editor';
    }
    function isUser() {
        return auth?.userType === 'user';
    }
    function isPublic() {
        return auth?.userType === undefined;
    }
    return (
        <AuthContext.Provider value={{ auth, setAuthentication, clearAuthentication, isEditor, isUser, isPublic }}>{children}</AuthContext.Provider>
    );
}
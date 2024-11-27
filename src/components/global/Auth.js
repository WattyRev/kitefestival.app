'use client'
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext({ 
    setAuthentication: () => {},
    clearAuthentication: () => {},
    isEditor: () => false,
    isUser: () => false,
    isPublic: () => true
});

export function AuthProvider({ children }) {
    const [ auth, setAuth ] = useState({});
    useEffect(() => {
        const localData = window.localStorage.getItem('authentication');
        const parsedData = localData ? JSON.parse(localData) : {};
        setAuth(parsedData)
    }, []);
    function setAuthentication(auth) {
        setAuth(auth);
        window.localStorage.setItem('authentication', JSON.stringify(auth));
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
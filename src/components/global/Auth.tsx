'use client'
import { createContext, useState, useEffect } from "react";

export interface AuthenticationData {
    passcode?: string;
    userType?: "editor" | "user";
}

export interface AuthenticatonContext {
    auth?: AuthenticationData;
    setAuthentication: (auth: AuthenticationData) => void;
    clearAuthentication: () => void;
    isEditor: () => boolean;
    isUser: () => boolean;
    isPublic: () => boolean;
}

export const AuthContext = createContext({ 
    setAuthentication: () => {},
    clearAuthentication: () => {},
    isEditor: () => false,
    isUser: () => false,
    isPublic: () => true
} as AuthenticatonContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [ auth, setAuth ] = useState<AuthenticationData>({});
    useEffect(() => {
        const localData = window.localStorage.getItem('authentication');
        const parsedData = localData ? JSON.parse(localData) : {};
        setAuth(parsedData)
    }, []);
    function setAuthentication(auth: AuthenticationData) {
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
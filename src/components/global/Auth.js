"use client";
import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext({
    setAuthentication: () => {},
    clearAuthentication: () => {},
    isEditor: () => false,
    isUser: () => false,
    isPublic: () => true,
});

export const useAuth = () => useContext(AuthContext);

const getCookies = () => {
    if (!document.cookie) {
        return {};
    }
    const pairs = document.cookie.split(";");
    const cookies = pairs.reduce((acc, pair) => {
        const [key, value] = pair.split("=");
        acc[key.trim()] = decodeURIComponent(value.trim());
        return acc;
    }, {});
    return cookies;
};

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState({});
    function setAuthentication() {
        const cookies = getCookies();
        const authData = {
            userType: cookies.userType,
            userId: cookies.userId,
            userName: cookies.userName,
        };
        setAuth(authData);
    }
    useEffect(() => {
        setAuthentication();
    }, []);
    function clearAuthentication() {
        function delete_cookie(name, path, domain) {
            function get_cookie(name) {
                return document.cookie.split(";").some((c) => {
                    return c.trim().startsWith(name + "=");
                });
            }
            if (get_cookie(name)) {
                document.cookie =
                    name +
                    "=" +
                    (path ? ";path=" + path : "") +
                    (domain ? ";domain=" + domain : "") +
                    ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
            }
        }
        delete_cookie("userType");
        delete_cookie("passcode");
        setAuthentication();
    }
    function isEditor() {
        return auth?.userType === "editor";
    }
    function isUser() {
        return auth?.userType === "user";
    }
    function isPublic() {
        return auth?.userType === undefined;
    }
    return (
        <AuthContext.Provider
            value={{
                auth,
                setAuthentication,
                clearAuthentication,
                isEditor,
                isUser,
                isPublic,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function ThemeProvider({ children }) {
    return children;
}
export function useTheme() {
    return { theme: "light", toggleTheme: () => {}, mounted: true };
}

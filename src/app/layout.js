import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import TopNav from "../components/global/TopNav";
import { AuthProvider } from "../components/global/Auth";
import { PromptProvider } from "../components/ui/Prompt";
import { AlertProvider } from "../components/ui/Alert";
import { EventsProvider } from "../components/EventsContext";
import EventSelector from "../components/EventSelector";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";
import Script from "next/script";
import { css } from "../../styled-system/css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "KiteFestival.app",
    description: "",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <meta name="darkreader-lock" />
                <Script
                    src="https://kit.fontawesome.com/f870624930.js"
                    crossorigin="anonymous"
                ></Script>
            </head>
            <body className={inter.className}>
                <SpeedInsights />
                <ThemeProvider>
                    <AuthProvider>
                        <PromptProvider>
                            <AlertProvider>
                                <EventsProvider>
                                    <TopNav />
                                    <EventSelector />
                                    <ThemeToggle />
                                    <div
                                        className={`main-container ${css({
                                            padding: "0 8px",
                                            maxWidth: "100vw",
                                            overflowX: "hidden",
                                        })}`}
                                    >
                                        {children}
                                    </div>
                                </EventsProvider>
                            </AlertProvider>
                        </PromptProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

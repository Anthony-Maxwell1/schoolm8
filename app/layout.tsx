import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { LayoutProvider } from "@/context/layoutContext";
import { DataProvider } from "@/context/dataContext";
import { ThemeProvider } from "@/context/themeContext";

export const metadata = {
    title: "schoolm8",
    description: "Centralized student tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <DataProvider>
                    <LayoutProvider>
                        <ThemeProvider>
                            <AuthProvider>{children}</AuthProvider>
                        </ThemeProvider>
                    </LayoutProvider>
                </DataProvider>
            </body>
        </html>
    );
}

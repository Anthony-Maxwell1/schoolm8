import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { LayoutProvider } from "@/context/layoutContext";
import { ThemeProvider } from "@/context/themeContext";
import ClientAuthGuard from "./ClientAuthGuard";

export const metadata = {
    title: "schoolm8",
    description: "Centralized student tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <LayoutProvider>
                    <ThemeProvider>
                        <AuthProvider>
                            <ClientAuthGuard>{children}</ClientAuthGuard>
                        </AuthProvider>
                    </ThemeProvider>
                </LayoutProvider>
            </body>
        </html>
    );
}

import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { LayoutProvider } from "@/context/layoutContext";

export const metadata = {
    title: "norwestbuddy",
    description: "Centralized student tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <LayoutProvider>
                    <AuthProvider>{children}</AuthProvider>
                </LayoutProvider>
            </body>
        </html>
    );
}

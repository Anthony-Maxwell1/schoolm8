import "./globals.css";
import { AuthProvider } from "@/context/authContext";

export const metadata = {
    title: "norwestbuddy",
    description: "Centralized student tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}

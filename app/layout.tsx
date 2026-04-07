import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { LayoutProvider } from "@/context/layoutContext";
import { ThemeProvider } from "@/context/themeContext";
import ClientAuthGuard from "./ClientAuthGuard";
import { ToastContainer, toast } from "react-toastify";
import { TaskManager } from "@/components/TaskManager";

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
                            <TaskManager />
                            <ToastContainer position="bottom-right" />
                            <ClientAuthGuard>{children}</ClientAuthGuard>
                        </AuthProvider>
                    </ThemeProvider>
                </LayoutProvider>
            </body>
        </html>
    );
}

import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { LayoutProvider } from "@/context/layoutContext";
import { NavigationProvider } from "@/context/navigationContext";
import { ThemeProvider } from "@/context/themeContext";
import ClientAuthGuard from "./ClientAuthGuard";
import { ToastContainer, toast } from "react-toastify";
import { TaskManager } from "@/components/TaskManager";

export const metadata = {
    title: "schoolm8",
    description: "Centralized student tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    console.log(`
          _                 _            ___  
 ___  ___| |__   ___   ___ | |_ __ ___  ( _ ) 
/ __|/ __| '_ \\ / _ \\ / _ \\| | '_ \` _ \\ / _ \\
\\__ \\ (__| | | | (_) | (_) | | | | | | | (_) |
|___/\\___|_| |_|\\___/ \\___/|_|_| |_| |_|\\___/ 

SchoolM8 is fully open source! 🎉
Tinker, explore, and contribute directly — no deobfuscation needed.

Check it out on GitHub: 
https://github.com/Anthony-Maxwell1/schoolm8
`);
    return (
        <html lang="en">
            <body>
                <LayoutProvider>
                    <ThemeProvider>
                        <NavigationProvider>
                            <AuthProvider>
                                <TaskManager />
                                <ToastContainer position="bottom-right" />
                                <ClientAuthGuard>{children}</ClientAuthGuard>
                            </AuthProvider>
                        </NavigationProvider>
                    </ThemeProvider>
                </LayoutProvider>
            </body>
        </html>
    );
}

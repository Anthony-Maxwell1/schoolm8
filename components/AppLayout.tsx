"use client";

import { useNavigation } from "@/context/navigationContext";

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

/**
 * AppLayout wraps page content with:
 * - Proper sidebar spacing (handled by Navigation fixed positioning)
 * - Onboarding-inspired glassmorphic styling
 * - Gradient background and overlay
 * - Consistent padding and structure
 */
export const AppLayout = ({ children, title, className = "" }: AppLayoutProps) => {
    const { sidebarCollapsed } = useNavigation();

    return (
        <main
            className={`
                min-h-screen w-full relative
                bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950
                ml-0 md:ml-64 lg:ml-64 transition-all duration-300
                ${sidebarCollapsed ? "md:ml-20 lg:ml-20" : "md:ml-64 lg:ml-64"}
                overflow-auto
                ${className}
            `}
        >
            {/* Background effects layer */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-slate-950/80" />
                {/* Subtle pattern or blur effect can go here */}
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Optional page header */}
                {title && (
                    <div className="sticky top-0 z-20 bg-slate-800/40 backdrop-blur-md border-b border-slate-700/50">
                        <div className="max-w-7xl mx-auto px-6 py-4">
                            <h1 className="text-3xl font-bold text-white">{title}</h1>
                        </div>
                    </div>
                )}

                {/* Page content */}
                {children}
            </div>
        </main>
    );
};

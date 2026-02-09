"use client";

import { Dashboard } from "@/components/Dashboard";
import { useLayout } from "@/context/layoutContext";

export default function DashboardPage() {
    const { currentPage, pages, setCurrentPage } = useLayout();

    // Auto-select first page if none is selected
    if (!currentPage && pages.length > 0) {
        setCurrentPage(pages[0].id);
        return <div>Loading dashboard...</div>;
    }

    if (!currentPage) return <div>No pages available</div>;

    return (
        <div className="h-screen flex">

            {/* Dashboard */}
            <main className="flex-1">
                <Dashboard editable={false} />
            </main>
        </div>
    );
}

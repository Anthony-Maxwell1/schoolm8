"use client";

import { Dashboard } from "@/components/Dashboard";
import { useLayout } from "@/context/layoutContext";
import { useEffect, useState } from "react";
import { ChevronRight, Edit, HelpCircle, Settings } from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";

export default function DashboardPage() {
    const { allowed, loading: accessLoading } = useAccessControl("dashboard");
    const { currentPage, pages, setCurrentPage } = useLayout();
    const { css } = useCss();
    const style = css.app.dashboard.page;
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    // 1️⃣ mark component as mounted (client-side)
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2️⃣ auto-select first page if none is selected
    useEffect(() => {
        if (!currentPage && pages.length > 0) {
            setCurrentPage(pages[0].id); // ✅ safe inside useEffect
        }
    }, [currentPage, pages, setCurrentPage]);

    if (accessLoading) return null;
    if (!allowed) return <div>Unauthorized</div>;

    // 3️⃣ prevent hydration mismatch by not rendering until mounted
    if (!mounted) return null;

    if (!currentPage)
        return (
            <div className={style.empty["ROOT-STYLE"]}>
                <div className={style.emptyCard["ROOT-STYLE"]}>
                    <div className={style.emptyIcon["ROOT-STYLE"]}>
                        <HelpCircle className="h-6 w-6 text-neutral-600 dark:text-neutral-300" />
                    </div>

                    <h1 className={style.emptyTitle["ROOT-STYLE"]}>{style.emptyTitle.CONTENT}</h1>

                    <p className={style.emptySubtitle["ROOT-STYLE"]}>
                        {style.emptySubtitle.CONTENT}
                    </p>

                    {/* Action button */}
                    <a href="/dashboard/editor" className={style.emptyLink["ROOT-STYLE"]}>
                        <Edit className="w-4 h-4" />
                        {style.emptyLink.CONTENT}
                    </a>
                </div>
            </div>
        );

    return (
        <div className={style.main["ROOT-STYLE"]}>
            {/* Dashboard */}
            <main className="flex-1">
                <Dashboard editable={false} />
            </main>
            {/* Semicircle tab with arrow */}
            <div
                className={`${style.editorTab["ROOT-STYLE"]}
            ${open ? "w-25 px-3" : "w-10 px-0"}`}
            >
                {/* Toggle area */}
                <div
                    className={style.editorTab.toggle["ROOT-STYLE"]}
                    onClick={() => setOpen(!open)}
                >
                    <div
                        className={`transform transition-transform duration-300 ${
                            open ? "rotate-180 -translate-x-3" : "rotate-0"
                        }`}
                    >
                        <ChevronRight className={style.editorTab.icon["ROOT-STYLE"]} />
                    </div>
                </div>

                {/* Buttons (visible when open) */}
                {open && (
                    <div className={style.editorTab.buttons["ROOT-STYLE"]}>
                        <div
                            className="flex h-6 w-6 cursor-pointer items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent toggle
                                window.location.href = "/dashboard/editor"; // navigate to editor
                                console.log("Edit clicked");
                            }}
                        >
                            <Edit className="text-white" />
                        </div>
                        <div
                            className="flex h-6 w-6 cursor-pointer items-center justify-center"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = "/settings"; // navigate to settings
                                console.log("Settings clicked");
                            }}
                        >
                            <Settings className="text-white" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

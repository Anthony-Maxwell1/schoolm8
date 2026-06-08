"use client";

import { Dashboard } from "@/components/Dashboard";
import { useLayout } from "@/context/layoutContext";
import { useEffect, useState } from "react";
import { ChevronRight, Edit, HelpCircle, Settings } from "lucide-react";
import { useAccessControl } from "@/lib/access/useAccessControl";
import { useCss } from "@/lib/css";
import { Button, EmptyState } from "@/components/ui/components";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { allowed, loading: accessLoading } = useAccessControl("dashboard");
    const { currentPage, pages, setCurrentPage } = useLayout();
    const { css } = useCss();
    const style = css.app.dashboard.page;
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

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
            <div className="flex flex-col items-center justify-center gap-4 h-screen">
                <EmptyState
                    title="No Pages found"
                    icon={<HelpCircle />}
                    actions={[
                        <Button key="create" onClick={() => router.push("/dashboard/editor")}>
                            Create your first page!
                        </Button>,
                    ]}
                />
            </div>
        );

    return (
        <div className={style.main["ROOT-STYLE"]}>
            {/* Dashboard */}
            <main className={style.main.content["ROOT-STYLE"]}>
                <Dashboard editable={false} />
            </main>
        </div>
    );
}

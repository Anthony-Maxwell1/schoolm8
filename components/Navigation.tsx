"use client";

import Link from "next/link";
import { useNavigation } from "@/context/navigationContext";
import {
    BookOpenText,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Menu,
    MessageCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCss } from "@/lib/css";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import { Button, Divider } from "./ui/components";
import Icon from "./ui/icon";
import { toast } from "react-toastify";

// Icon mapping - you can expand this with more icons

export const Navigation = ({ children }: { children: React.ReactNode }) => {
    const { items, sidebarCollapsed, setSidebarCollapsed, ICON_MAP, sidebarHideable } =
        useNavigation();
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const pathname = usePathname();
    const { css } = useCss();

    const navigationCss = css.components.Navigation;

    const visibleItems = items.filter((item) => item.visible);

    const isActive = (href: string) => pathname === href;

    const [hydrated, setHydrated] = useState(false);

    const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        const stored = localStorage.getItem("collapsedItems");
        return stored ? JSON.parse(stored) : {};
    });
    const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        const stored = localStorage.getItem("hiddenMap");
        return stored ? JSON.parse(stored) : {};
    });

    const asideRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!sidebarHideable) return;

        let hideTimeout: ReturnType<typeof setTimeout> | null = null;
        let showTimeout: ReturnType<typeof setTimeout> | null = null;

        const EDGE_THRESHOLD = 10;
        const DEBOUNCE_MS = 120;

        const handleMouseMove = (e: MouseEvent) => {
            // Cursor touching left edge -> show sidebar
            if (e.clientX <= EDGE_THRESHOLD) {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }

                if (!showTimeout) {
                    showTimeout = setTimeout(() => {
                        setSidebarHidden(false);
                        showTimeout = null;
                    }, DEBOUNCE_MS);
                }

                return;
            }

            // If sidebar exists and mouse is inside it, keep open
            if (asideRef.current) {
                const rect = asideRef.current.getBoundingClientRect();

                const hoveringAside =
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom;

                if (hoveringAside) {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }

                    return;
                }
            }

            // Mouse left sidebar -> hide it
            if (!hideTimeout) {
                hideTimeout = setTimeout(() => {
                    setSidebarHidden(true);
                    hideTimeout = null;
                }, DEBOUNCE_MS);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);

            if (hideTimeout) clearTimeout(hideTimeout);
            if (showTimeout) clearTimeout(showTimeout);
        };
    }, [sidebarHideable]);

    const [feedback, setFeedback] = useState<ReturnType<typeof Sentry.getFeedback> | null>(null); // Sentry
    // Read `getFeedback` on the client only, to avoid hydration errors during server rendering
    useEffect(() => {
        async function getFeedback() {
            setFeedback(Sentry.getFeedback());
        }
        getFeedback();
    }, []);

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (feedback && buttonRef.current) {
            const unsubscribe = feedback.attachTo(buttonRef.current);
            return unsubscribe;
        }
        return () => { };
    }, [feedback]);

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        localStorage.setItem("collapsedItems", JSON.stringify(collapsedItems));
        localStorage.setItem("hiddenMap", JSON.stringify(hiddenMap));
    }, [collapsedItems, hiddenMap]);

    if (!hydrated) return null; // Prevent hydration mismatch

    if (
        pathname.startsWith("/docs") ||
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/auth")
    ) {
        return <>{children}</>;
    }

    return (
        <div>
            <aside
                className={cn(
                    navigationCss.main["ROOT-STYLE"],
                    sidebarCollapsed
                        ? navigationCss.main["sidebarCollapsed-style"]
                        : navigationCss.main["sidebarExpanded-style"],
                    sidebarHideable && sidebarHidden
                        ? navigationCss.main["sidebarHidden-style"]
                        : "",
                )}
                ref={asideRef}
            >
                {/* Logo */}
                <div className={navigationCss.main.branding["ROOT-STYLE"]}>
                    {!sidebarCollapsed && (
                        <h3 className={navigationCss.main.branding.logotext["ROOT-STYLE"]}>
                            {navigationCss.main.branding.logotext.CONTENT}
                        </h3>
                    )}
                    <Button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand" : "Collapse"} iconOnly={true} variant="ghost" leftIcon={sidebarCollapsed ? (
                        <Icon
                            icon="ChevronRight"
                            color="--color-on-secondary"
                        />
                    ) : (
                        <Icon
                            icon="ChevronLeft"
                            color="--color-on-secondary"
                        />
                    )}>

                    </Button>

                    {/* <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={cn(
                            navigationCss.main.branding.expandcollapse["ROOT-STYLE"],
                            sidebarCollapsed
                                ? navigationCss.main.branding.expandcollapse[
                                "sidebarCollapsed-style"
                                ]
                                : navigationCss.main.branding.expandcollapse[
                                "sidebarExpanded-style"
                                ],
                        )}
                        title={sidebarCollapsed ? "Expand" : "Collapse"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight
                                className={
                                    navigationCss.main.branding.expandcollapse.icon["ROOT-STYLE"]
                                }
                            />
                        ) : (
                            <ChevronLeft
                                className={
                                    navigationCss.main.branding.expandcollapse.icon["ROOT-STYLE"]
                                }
                            />
                        )}
                    </button> */}
                </div>
                <Divider />


                {/* Navigation Items */}
                <nav className={navigationCss.main.items["ROOT-STYLE"]}>
                    {visibleItems.map((item) => {
                        const IconComponent =
                            (item.icon && ICON_MAP[item.icon]) ||
                            require("lucide-react").LayoutGrid;

                        const active = isActive(item.href);
                        const isCollapsed = collapsedItems[item.id] ?? item.collapsed ?? false;

                        if (item.children && item.children.length > 0) {
                            return (
                                <div
                                    key={item.id}
                                    className={
                                        navigationCss.main.items.itemwithchildren.wrapper[
                                        "ROOT-STYLE"
                                        ]
                                    }
                                >
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            navigationCss.main.items.itemwithchildren["ROOT-STYLE"],
                                            active
                                                ? navigationCss.main.items.itemwithchildren[
                                                "active-style"
                                                ]
                                                : navigationCss.main.items.itemwithchildren[
                                                "inactive-style"
                                                ],
                                            sidebarCollapsed
                                                ? navigationCss.main.items.itemwithchildren[
                                                "sidebarCollapsed-style"
                                                ]
                                                : navigationCss.main.items.itemwithchildren[
                                                "sidebarExpanded-style"
                                                ],
                                        )}
                                        title={item.label}
                                    >
                                        <IconComponent
                                            className={cn(
                                                navigationCss.main.items.itemwithchildren.icon[
                                                "ROOT-STYLE"
                                                ],
                                                sidebarCollapsed
                                                    ? navigationCss.main.items.itemwithchildren
                                                        .icon["sidebarCollapsed-style"]
                                                    : navigationCss.main.items.itemwithchildren
                                                        .icon["sidebarExpanded-style"],
                                            )}
                                        />

                                        {!sidebarCollapsed && (
                                            <span
                                                className={
                                                    navigationCss.main.items.itemwithchildren.label[
                                                    "ROOT-STYLE"
                                                    ]
                                                }
                                            >
                                                {item.label}
                                            </span>
                                        )}

                                        {!sidebarCollapsed && item.collapsible && (
                                            <button
                                                className={
                                                    navigationCss.main.items.itemwithchildren
                                                        .collapse["ROOT-STYLE"]
                                                }
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    setCollapsedItems((prev) => {
                                                        const next = !prev[item.id];

                                                        // unhide immediately when expanding
                                                        if (!next) {
                                                            setHiddenMap((h) => ({
                                                                ...h,
                                                                [item.id]: false,
                                                            }));
                                                        }

                                                        return {
                                                            ...prev,
                                                            [item.id]: next,
                                                        };
                                                    });
                                                }}
                                            >
                                                {isCollapsed ? (
                                                    <ChevronRight
                                                        className={
                                                            navigationCss.main.items
                                                                .itemwithchildren.collapse.icon[
                                                            "ROOT-STYLE"
                                                            ]
                                                        }
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        className={
                                                            navigationCss.main.items
                                                                .itemwithchildren.collapse.icon[
                                                            "ROOT-STYLE"
                                                            ]
                                                        }
                                                    />
                                                )}
                                            </button>
                                        )}
                                    </Link>

                                    {/* Children */}
                                    {!sidebarCollapsed && (
                                        <div
                                            onTransitionEnd={() => {
                                                if (collapsedItems[item.id]) {
                                                    setHiddenMap((prev) => ({
                                                        ...prev,
                                                        [item.id]: true,
                                                    }));
                                                }
                                            }}
                                            className={cn(
                                                navigationCss.main.items.itemwithchildren.children
                                                    .wrapper["ROOT-STYLE"],
                                                isCollapsed
                                                    ? navigationCss.main.items.itemwithchildren
                                                        .children.wrapper["collapsed-style"]
                                                    : navigationCss.main.items.itemwithchildren
                                                        .children.wrapper["expanded-style"],
                                            )}
                                            style={{
                                                display: hiddenMap[item.id] ? "none" : undefined,
                                            }}
                                        >
                                            {item.children.map((child) => {
                                                const ChildIcon =
                                                    (child.icon && ICON_MAP[child.icon]) ||
                                                    require("lucide-react").LayoutGrid;

                                                const childActive = isActive(child.href);

                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className={cn(
                                                            navigationCss.main.items
                                                                .itemwithchildren.children[
                                                            "ROOT-STYLE"
                                                            ],
                                                            childActive
                                                                ? navigationCss.main.items
                                                                    .itemwithchildren.children[
                                                                "active-style"
                                                                ]
                                                                : navigationCss.main.items
                                                                    .itemwithchildren.children[
                                                                "inactive-style"
                                                                ],
                                                            sidebarCollapsed
                                                                ? navigationCss.main.items
                                                                    .itemwithchildren.children[
                                                                "sidebarCollapsed-style"
                                                                ]
                                                                : navigationCss.main.items
                                                                    .itemwithchildren.children[
                                                                "sidebarExpanded-style"
                                                                ],
                                                        )}
                                                        title={child.label}
                                                    >
                                                        <ChildIcon
                                                            className={cn(
                                                                navigationCss.main.items
                                                                    .itemwithchildren.children.icon[
                                                                "ROOT-STYLE"
                                                                ],
                                                                sidebarCollapsed
                                                                    ? navigationCss.main.items
                                                                        .itemwithchildren.children
                                                                        .icon[
                                                                    "sidebarCollapsed-style"
                                                                    ]
                                                                    : navigationCss.main.items
                                                                        .itemwithchildren.children
                                                                        .icon[
                                                                    "sidebarExpanded-style"
                                                                    ],
                                                            )}
                                                        />
                                                        {!sidebarCollapsed && (
                                                            <span
                                                                className={
                                                                    navigationCss.main.items
                                                                        .itemwithchildren.children
                                                                        .label["ROOT-STYLE"]
                                                                }
                                                            >
                                                                {child.label}
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                    navigationCss.main.items.item["ROOT-STYLE"],
                                    active
                                        ? navigationCss.main.items.item["active-style"]
                                        : navigationCss.main.items.item["inactive-style"],
                                    sidebarCollapsed
                                        ? navigationCss.main.items.item["sidebarCollapsed-style"]
                                        : navigationCss.main.items.item["sidebarExpanded-style"],
                                )}
                                title={item.label}
                            >
                                <IconComponent
                                    className={cn(
                                        navigationCss.main.items.item.icon["ROOT-STYLE"],
                                        sidebarCollapsed
                                            ? navigationCss.main.items.item.icon[
                                            "sidebarCollapsed-style"
                                            ]
                                            : navigationCss.main.items.item.icon[
                                            "sidebarExpanded-style"
                                            ],
                                    )}
                                />
                                {!sidebarCollapsed && (
                                    <span
                                        className={
                                            navigationCss.main.items.item.label["ROOT-STYLE"]
                                        }
                                    >
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <Divider />

                {/* Bottom Navigation */}
                <div
                    className={cn(
                        navigationCss.main.bottomnav["ROOT-STYLE"],
                        sidebarCollapsed
                            ? navigationCss.main.bottomnav["sidebarCollapsed-style"]
                            : navigationCss.main.bottomnav["sidebarExpanded-style"],
                    )}
                >
                    <div className={navigationCss.main.bottomnav.settings["ROOT-STYLE"]}>
                        <Link
                            href="/settings/navigation"
                            title="Navigation settings"
                            className={cn(
                                navigationCss.main.bottomnav.settings.inner["ROOT-STYLE"],
                                isActive("/settings/navigation")
                                    ? navigationCss.main.bottomnav.settings.inner["active-style"]
                                    : navigationCss.main.bottomnav.settings.inner["inactive-style"],
                                sidebarCollapsed
                                    ? navigationCss.main.bottomnav.settings.inner[
                                    "sidebarCollapsed-style"
                                    ]
                                    : navigationCss.main.bottomnav.settings.inner[
                                    "sidebarExpanded-style"
                                    ],
                            )}
                        >
                            <Menu
                                className={
                                    navigationCss.main.bottomnav.settings.inner.icon["ROOT-STYLE"]
                                }
                            />
                            {!sidebarCollapsed && (
                                <span className={navigationCss.main.items.item.label["ROOT-STYLE"]}>
                                    Customize
                                </span>
                            )}

                            {isActive("/settings/navigation") && (
                                <span
                                    className={
                                        navigationCss.main.bottomnav.settings.inner.icon.active[
                                        "ROOT-STYLE"
                                        ]
                                    }
                                />
                            )}
                        </Link>
                    </div>

                    <div
                        className={cn(
                            navigationCss.main.bottomnav.docs["ROOT-STYLE"],
                            sidebarCollapsed
                                ? navigationCss.main.bottomnav.docs["sidebarCollapsed-style"]
                                : navigationCss.main.bottomnav.docs["sidebarExpanded-style"],
                        )}
                    >
                        <Link
                            href="/docs"
                            title="Docs"
                            className={cn(
                                navigationCss.main.bottomnav.docs.inner["ROOT-STYLE"],
                                isActive("/docs")
                                    ? navigationCss.main.bottomnav.docs.inner["active-style"]
                                    : navigationCss.main.bottomnav.docs.inner["inactive-style"],
                                sidebarCollapsed
                                    ? navigationCss.main.bottomnav.docs.inner[
                                    "sidebarCollapsed-style"
                                    ]
                                    : navigationCss.main.bottomnav.docs.inner[
                                    "sidebarExpanded-style"
                                    ],
                            )}
                        >
                            <BookOpenText
                                className={
                                    navigationCss.main.bottomnav.docs.inner.icon["ROOT-STYLE"]
                                }
                            />

                            {isActive("/docs") && (
                                <span
                                    className={
                                        navigationCss.main.bottomnav.docs.inner.icon.active[
                                        "ROOT-STYLE"
                                        ]
                                    }
                                />
                            )}
                        </Link>
                    </div>
                    <div
                        className={cn(
                            navigationCss.main.bottomnav.feedback["ROOT-STYLE"],
                            sidebarCollapsed
                                ? navigationCss.main.bottomnav.feedback["sidebarCollapsed-style"]
                                : navigationCss.main.bottomnav.feedback["sidebarExpanded-style"],
                        )}
                    >
                        <button
                            title="Feedback"
                            ref={buttonRef}
                            className={cn(
                                navigationCss.main.bottomnav.feedback.inner["ROOT-STYLE"],
                                isActive("/feedback")
                                    ? navigationCss.main.bottomnav.feedback.inner["active-style"]
                                    : navigationCss.main.bottomnav.feedback.inner["inactive-style"],
                                sidebarCollapsed
                                    ? navigationCss.main.bottomnav.feedback.inner[
                                    "sidebarCollapsed-style"
                                    ]
                                    : navigationCss.main.bottomnav.feedback.inner[
                                    "sidebarExpanded-style"
                                    ],
                            )}
                            onClick={() => toast.info("This is a bug report form, not a feature suggestion form! Email anthony@thatdev.org for that instead.", {
                                closeOnClick: true,
                                closeButton: true,
                                draggable: true,
                                type: "info"
                            })}
                        >
                            <MessageCircle
                                className={
                                    navigationCss.main.bottomnav.feedback.inner.icon["ROOT-STYLE"]
                                }
                            />

                            {isActive("/feedback") && (
                                <span
                                    className={
                                        navigationCss.main.bottomnav.feedback.inner.icon.active[
                                        "ROOT-STYLE"
                                        ]
                                    }
                                />
                            )}
                        </button>
                    </div>
                </div>
            </aside>
            <main
                className={cn(
                    navigationCss.contents["ROOT-STYLE"],
                    sidebarCollapsed
                        ? navigationCss.contents["sidebarCollapsed-style"]
                        : navigationCss.contents["sidebarExpanded-style"],
                    sidebarHidden ? navigationCss.contents["sidebarHidden-style"] : "",
                    sidebarHideable ? navigationCss.contents["sidebarHideable-style"] : "",
                )}
            >
                {children}
            </main>
        </div>
    );
};

"use client";

import Link from "next/link";
import { useNavigation } from "@/context/navigationContext";
import { BookOpenText, ChevronDown, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { ComponentType, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { css } from "@/lib/css";
import { cn } from "@/lib/utils";

// Icon mapping - you can expand this with more icons
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    Home: require("lucide-react").Home,
    LayoutGrid: require("lucide-react").LayoutGrid,
    Clock: require("lucide-react").Clock,
    BookOpen: require("lucide-react").BookOpen,
    GraduationCap: require("lucide-react").GraduationCap,
    FileText: require("lucide-react").FileText,
    StickyNote: require("lucide-react").StickyNote,
    Settings: require("lucide-react").Settings,
};

export const Navigation = ({ children }: { children: React.ReactNode }) => {
    const { items, sidebarCollapsed, setSidebarCollapsed } = useNavigation();
    const pathname = usePathname();
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

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        localStorage.setItem("collapsedItems", JSON.stringify(collapsedItems));
        localStorage.setItem("hiddenMap", JSON.stringify(hiddenMap));
    }, [collapsedItems, hiddenMap]);

    if (!hydrated) return null; // Prevent hydration mismatch

    if (pathname.startsWith("/docs")) {
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
                )}
            >
                {/* Logo */}
                <div className={navigationCss.main.branding["ROOT-STYLE"]}>
                    {!sidebarCollapsed && (
                        <h2 className={navigationCss.main.branding.logotext["ROOT-STYLE"]}>
                            {navigationCss.main.branding.logotext.CONTENT}
                        </h2>
                    )}
                    <button
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
                    </button>
                </div>

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

                    <div className={navigationCss.main.bottomnav.docs["ROOT-STYLE"]}>
                        <Link
                            href="/docs"
                            title="Docs"
                            className={cn(
                                navigationCss.main.bottomnav.docs.inner["ROOT-STYLE"],
                                isActive("/docs")
                                    ? navigationCss.main.bottomnav.docs.inner["active-style"]
                                    : navigationCss.main.bottomnav.docs.inner["inactive-style"],
                            )}
                        >
                            <BookOpenText
                                className={
                                    navigationCss.main.bottomnav.docs.inner.icon["ROOT-STYLE"]
                                }
                            />
                            {!sidebarCollapsed && (
                                <span className={navigationCss.main.items.item.label["ROOT-STYLE"]}>
                                    Docs
                                </span>
                            )}

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
                </div>
            </aside>
            <main
                className={cn(
                    navigationCss.contents["ROOT-STYLE"],
                    sidebarCollapsed
                        ? navigationCss.contents["sidebarCollapsed-style"]
                        : navigationCss.contents["sidebarExpanded-style"],
                )}
            >
                {children}
            </main>
        </div>
    );
};

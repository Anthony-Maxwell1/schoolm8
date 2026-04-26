"use client";

import { useState } from "react";

const STORAGE_KEY = "app-css";

// your original object
const defaultCss = {
    components: {
        tiles: {
            Timetable: {
                TimetableList: {
                    main: {
                        "ROOT-STYLE": "overflow-y-auto",
                        title: {
                            "ROOT-STYLE": "mb-4 text-lg font-semibold text-gray-900",
                            CONTENT: "Timetable",
                        },
                        noclasses: {
                            "ROOT-STYLE": "text-sm text-gray-500",
                            CONTENT: "No classes scheduled.",
                        },
                        inner: {
                            "ROOT-STYLE": "space-y-5",
                            day: {
                                "ROOT-STYLE": "space-y-2",
                                "date-time": {
                                    "ROOT-STYLE":
                                        "text-sm font-medium uppercase tracking-wide text-gray-500",
                                },
                                inner: {
                                    "ROOT-STYLE": "space-y-2",
                                    event: {
                                        "ROOT-STYLE":
                                            "flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-3",
                                        main: {
                                            "ROOT-STYLE": "min-w-0",
                                            name: {
                                                "ROOT-STYLE": "truncate font-medium text-blue-900",
                                            },
                                            room: {
                                                "ROOT-STYLE": "text-sm text-blue-700",
                                            },
                                        },
                                        time: {
                                            "ROOT-STYLE":
                                                "ml-3 shrink-0 rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-700",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                TimetableGrid: {
                    main: {
                        "ROOT-STYLE": "relative",
                        loading: {
                            "ROOT-STYLE":
                                "absolute inset-0 flex items-center justify-center bg-black/20 z-50",
                            CONTENT: "Loading...",
                        },
                        inner: {
                            "ROOT-STYLE": "max-h-[70vh] overflow-auto rounded-lg",
                            inner: {
                                "ROOT-STYLE": "flex min-w-max",
                                hourlabels: {
                                    "ROOT-STYLE": "mt-10 flex w-14 shrink-0 flex-col",
                                    label: {
                                        "ROOT-STYLE":
                                            "flex h-16 items-start justify-end pr-2 text-xs text-gray-400",
                                    },
                                },
                                daycolumns: {
                                    "ROOT-STYLE": "flex gap-1",
                                    column: {
                                        "ROOT-STYLE": "w-36 shrink-0",
                                        header: {
                                            "ROOT-STYLE":
                                                "mb-1 h-10 text-center text-xs font-medium uppercase tracking-wide text-gray-500",
                                            weekday: {},
                                            date: {
                                                "ROOT-STYLE":
                                                    "text-base font-semibold text-gray-800",
                                            },
                                        },
                                        grid: {
                                            "ROOT-STYLE":
                                                "relative rounded-lg border border-gray-100 bg-gray-50",
                                            hourlines: {
                                                "ROOT-STYLE":
                                                    "absolute left-0 right-0 border-t border-gray-200",
                                            },
                                            event: {
                                                "ROOT-STYLE":
                                                    "absolute left-0 right-0 mx-1 overflow-hidden rounded-md bg-blue-100 px-2 py-1 shadow-sm cursor-pointer",
                                                name: {
                                                    "ROOT-STYLE":
                                                        "truncate text-xs font-semibold text-blue-900",
                                                },
                                                details: {
                                                    "ROOT-STYLE": "truncate text-xs text-blue-600",
                                                    delimeter: " · ",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        tooltip: {
                            "ROOT-STYLE":
                                "fixed max-w-xs bg-white rounded-lg border-black border-2 p-2 shadow-lg z-50 pointer-events-none",
                            name: {
                                "ROOT-STYLE": "text-lg font-semibold",
                            },
                            time: {
                                "ROOT-STYLE": "text-blue-600",
                            },
                            room: {},
                        },
                    },
                },
            },
        },
        Navigation: {
            main: {
                "ROOT-STYLE":
                    "bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out shadow-xl",
                "sidebarCollapsed-style": "w-18",
                "sidebarExpanded-style": "w-64",
                branding: {
                    "ROOT-STYLE":
                        "p-4 border-b border-slate-700 flex items-center justify-between gap-2",
                    logotext: {
                        "ROOT-STYLE": "text-white text-lg font-bold",
                        CONTENT: "schoolm8",
                    },
                    expandcollapse: {
                        "ROOT-STYLE":
                            "text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 cursor-pointer",
                        "sidebarCollapsed-style": "mx-auto",
                        "sidebarExpanded-style": "ml-auto",
                        icon: {
                            "ROOT-STYLE": "w-5 h-5",
                        },
                    },
                },
                items: {
                    "ROOT-STYLE": "flex-1 overflow-y-auto p-3 space-y-2",
                    itemwithchildren: {
                        wrapper: {
                            "ROOT-STYLE": "space-y-1",
                        },
                        "ROOT-STYLE": "flex items-center px-3 py-2 rounded-lg transition-all",
                        "active-style":
                            "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white",
                        "inactive-style": "text-slate-300 hover:bg-slate-700 hover:text-white",
                        "sidebarCollapsed-style": "",
                        "sidebarExpanded-style": "gap-3",
                        icon: {
                            "ROOT-STYLE": "w-5 h-5 flex-shrink-0",
                            "sidebarCollapsed-style": "mx-auto",
                            "sidebarExpanded-style": "",
                        },
                        label: {
                            "ROOT-STYLE": "text-sm",
                        },
                        collapse: {
                            "ROOT-STYLE":
                                "ml-auto p-1 rounded hover:bg-slate-400 hover:text-slate-900 text-slate-400 transition-colors cursor-pointer",
                            icon: {
                                "ROOT-STYLE": "w-4 h-4",
                            },
                        },
                        children: {
                            wrapper: {
                                "ROOT-STYLE": "ml-4 space-y-1 transition-all duration-300",
                                "collapsed-style": "opacity-0 -translate-y-20 pointer-events-none",
                                "expanded-style": "opacity-100 translate-y-0",
                            },
                            "ROOT-STYLE":
                                "flex items-center px-3 py-2 rounded-lg transition-all cursor-pointer",
                            "active-style":
                                "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white",
                            "inactive-style": "text-slate-300 hover:bg-slate-700 hover:text-white",
                            "sidebarCollapsed-style": "",
                            "sidebarExpanded-style": "gap-3",
                            icon: {
                                "ROOT-STYLE": "w-5 h-5 flex-shrink-0",
                                "sidebarCollapsed-style": "mx-auto",
                                "sidebarExpanded-style": "",
                            },
                            label: {
                                "ROOT-STYLE": "text-sm",
                            },
                        },
                    },
                    item: {
                        "ROOT-STYLE": "flex items-center px-3 py-2 rounded-lg transition-all",
                        "active-style":
                            "bg-emerald-500/20 border-l-2 border-l-emerald-500 text-white",
                        "inactive-style": "text-slate-300 hover:bg-slate-700 hover:text-white",
                        "sidebarCollapsed-style": "",
                        "sidebarExpanded-style": "gap-3",
                        icon: {
                            "ROOT-STYLE": "w-5 h-5 flex-shrink-0",
                            "sidebarCollapsed-style": "mx-auto",
                            "sidebarExpanded-style": "",
                        },
                        label: {
                            "ROOT-STYLE": "text-sm",
                        },
                    },
                },
                bottomnav: {
                    "ROOT-STYLE": "border-t border-slate-700 flex items-center gap-2 p-3",
                    "sidebarCollapsed-style": "flex-col",
                    "sidebarExpanded-style": "flex-row",

                    settings: {
                        "ROOT-STYLE": "flex-1 min-w-0",
                        "sidebarCollapsed-style": "",
                        "sidebarExpanded-style": "",

                        inner: {
                            "ROOT-STYLE":
                                "flex w-full items-center rounded-lg px-3 py-2.5 transition-all relative",
                            "active-style": "bg-emerald-500/20 text-white",
                            "inactive-style": "text-slate-300 hover:bg-slate-700 hover:text-white",
                            "sidebarCollapsed-style": "justify-center",
                            "sidebarExpanded-style": "justify-start gap-2",

                            icon: {
                                "ROOT-STYLE": "w-5 h-5 shrink-0",

                                active: {
                                    "ROOT-STYLE":
                                        "absolute left-0 top-2 bottom-2 w-[2px] bg-emerald-500 rounded-full",
                                },
                            },
                        },
                    },

                    docs: {
                        "ROOT-STYLE": "flex-none",
                        "sidebarCollapsed-style": "",
                        "sidebarExpanded-style": "",

                        inner: {
                            "ROOT-STYLE":
                                "inline-flex items-center justify-center rounded-lg p-2.5 transition-all relative",
                            "active-style": "bg-emerald-500/20 text-white",
                            "inactive-style": "text-slate-300 hover:bg-slate-700 hover:text-white",
                            "sidebarCollapsed-style": "",
                            "sidebarExpanded-style": "",

                            icon: {
                                "ROOT-STYLE": "w-5 h-5 shrink-0",

                                active: {
                                    "ROOT-STYLE":
                                        "absolute left-0 top-2 bottom-2 w-[2px] bg-emerald-500 rounded-full",
                                },
                            },
                        },
                    },

                    feedback: {
                        "ROOT-STYLE": "flex-none",
                        "sidebarCollapsed-style": "",
                        "sidebarExpanded-style": "",

                        inner: {
                            "ROOT-STYLE":
                                "inline-flex items-center justify-center rounded-lg p-2.5 transition-all relative cursor-pointer",
                            "active-style": "bg-emerald-500/20 text-white",
                            "inactive-style": "text-slate-300 hover:bg-slate-700 hover:text-white",
                            "sidebarCollapsed-style": "",
                            "sidebarExpanded-style": "",

                            icon: {
                                "ROOT-STYLE": "w-5 h-5 shrink-0",

                                active: {
                                    "ROOT-STYLE":
                                        "absolute left-0 top-2 bottom-2 w-[2px] bg-emerald-500 rounded-full",
                                },
                            },
                        },
                    },
                },
            },
            contents: {
                "ROOT-STYLE": "transition-all duration-300",
                "sidebarCollapsed-style": "ml-18",
                "sidebarExpanded-style": "ml-64",
            },
        },
    },
    app: {
        lms: {
            page: {
                main: {
                    "ROOT-STYLE": "min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-10",
                    title: {
                        "ROOT-STYLE": "text-4xl font-bold",
                        CONTENT: "LMS Dashboard",
                    },
                    section: {
                        "ROOT-STYLE": "w-full max-w-6xl",
                        header: {
                            "ROOT-STYLE": "flex justify-between items-center mb-3",
                            title: {
                                "ROOT-STYLE": "text-2xl font-semibold",
                            },
                            seeall: {
                                "ROOT-STYLE": "text-blue-500 hover:underline cursor-pointer",
                                CONTENT: "See all",
                            },
                        },
                        carousel: {
                            "ROOT-STYLE": "relative w-screen",
                            left: {
                                "ROOT-STYLE":
                                    "absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl p-2 rounded-full hover:scale-105 transition cursor-pointer",
                                CONTENT: "←",
                            },
                            right: {
                                "ROOT-STYLE":
                                    "absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl p-2 rounded-full hover:scale-105 transition cursor-pointer ",
                                CONTENT: "→",
                            },
                            scrollarea: {
                                "ROOT-STYLE":
                                    "w-screen flex gap-4 overflow-x-auto scroll-smooth no-scrollbar pb-2 px-8 ",
                                item: {
                                    "ROOT-STYLE":
                                        "min-w-[260px] bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer",
                                    image: {
                                        "ROOT-STYLE": "w-full h-32 object-cover",
                                    },
                                    inner: {
                                        "ROOT-STYLE": "p-3",
                                        title: {
                                            "ROOT-STYLE": "font-semibold",
                                        },
                                        description: {
                                            "ROOT-STYLE": "text-sm text-gray-600",
                                        },
                                        due: {
                                            "ROOT-STYLE": "text-sm text-red-500 mt-1",
                                            CONTENT: "Due: ",
                                        },
                                        created: {
                                            "ROOT-STYLE": "text-xs text-gray-400 mt-1",
                                            CONTENT: "Created: ",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    courses: {
                        "ROOT-STYLE": "w-full max-w-6xl",
                        title: {
                            "ROOT-STYLE": "text-2xl font-semibold mb-3",
                            CONTENT: "Courses",
                        },
                        inner: {
                            "ROOT-STYLE": "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
                            course: {
                                "ROOT-STYLE":
                                    "relative h-40 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer group",
                                image: {
                                    "ROOT-STYLE":
                                        "w-full h-full object-cover group-hover:scale-105 transition",
                                },
                                overlay: {
                                    "ROOT-STYLE":
                                        "absolute inset-0 bg-black/40 group-hover:bg-black/30 transition",
                                },
                                name: {
                                    "ROOT-STYLE": "absolute bottom-3 left-3 text-white",
                                    inner: {
                                        "ROOT-STYLE": "font-semibold text-lg",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            assignment: {
                main: {
                    "ROOT-STYLE": "min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-6",
                },

                header: {
                    card: {
                        "ROOT-STYLE":
                            "w-full max-w-4xl bg-white rounded-xl shadow-md p-6 flex flex-col gap-3",
                    },
                    meta: {
                        "ROOT-STYLE": "text-sm text-gray-400",
                    },
                    title: {
                        "ROOT-STYLE": "text-3xl font-bold",
                    },
                    course: {
                        "ROOT-STYLE": "text-lg text-gray-600",
                    },
                    dates: {
                        "ROOT-STYLE": "flex gap-4 text-sm text-gray-500",
                    },
                    due: {
                        "ROOT-STYLE": "text-red-500 font-medium",
                    },
                    desc: {
                        "ROOT-STYLE": "text-gray-700 mt-2",
                    },
                    links: {
                        "ROOT-STYLE": "mt-4 flex flex-row gap-4",
                        link: {
                            "ROOT-STYLE": "mt-2 text-blue-500 hover:underline font-medium w-fit",
                        },
                    },
                },

                rubric: {
                    card: {
                        "ROOT-STYLE": "w-full max-w-4xl bg-white rounded-xl shadow-md p-6",
                    },
                    title: {
                        "ROOT-STYLE": "text-2xl font-semibold mb-4",
                        CONTENT: "Rubric",
                    },
                    tableWrapper: {
                        "ROOT-STYLE": "overflow-x-auto",
                    },
                    table: {
                        "ROOT-STYLE": "w-full border-collapse",
                        header: {
                            "ROOT-STYLE": "text-left border-b border-gray-200 pb-2 text-gray-600",
                        },
                        cell: {
                            "ROOT-STYLE": "py-2 border-b border-gray-100 text-sm text-gray-700",
                        },
                    },
                },
            },
            announcement: {
                main: {
                    "ROOT-STYLE": "min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-6",
                },

                header: {
                    card: {
                        "ROOT-STYLE":
                            "w-full max-w-4xl bg-white rounded-xl shadow-md p-6 flex flex-col gap-3",
                    },
                    meta: {
                        "ROOT-STYLE": "text-sm text-gray-400",
                    },
                    title: {
                        "ROOT-STYLE": "text-3xl font-bold",
                    },
                    course: {
                        "ROOT-STYLE": "text-lg text-gray-600",
                    },
                    dates: {
                        "ROOT-STYLE": "flex gap-4 text-sm text-gray-500",
                    },
                    due: {
                        "ROOT-STYLE": "text-red-500 font-medium",
                    },
                    desc: {
                        "ROOT-STYLE": "text-gray-700 mt-2",
                    },
                    links: {
                        "ROOT-STYLE": "mt-4 flex flex-row gap-4",
                        link: {
                            "ROOT-STYLE": "mt-2 text-blue-500 hover:underline font-medium w-fit",
                        },
                    },
                },

                rubric: {
                    card: {
                        "ROOT-STYLE": "w-full max-w-4xl bg-white rounded-xl shadow-md p-6",
                    },
                    title: {
                        "ROOT-STYLE": "text-2xl font-semibold mb-4",
                        CONTENT: "Rubric",
                    },
                    tableWrapper: {
                        "ROOT-STYLE": "overflow-x-auto",
                    },
                    table: {
                        "ROOT-STYLE": "w-full border-collapse",
                        header: {
                            "ROOT-STYLE": "text-left border-b border-gray-200 pb-2 text-gray-600",
                        },
                        cell: {
                            "ROOT-STYLE": "py-2 border-b border-gray-100 text-sm text-gray-700",
                        },
                    },
                },
            },
        },
    },
};

// 🔹 in-memory fallback (for non-hook usage)
let cssCache = defaultCss;

function mergeCss(defaultObj: any, userObj: any): any {
    // if user didn't provide anything, use default
    if (userObj === undefined || userObj === null) {
        return defaultObj;
    }

    // primitives → user overrides
    if (typeof defaultObj !== "object" || defaultObj === null) {
        return userObj;
    }

    // arrays → replace (not merge)
    if (Array.isArray(defaultObj)) {
        return Array.isArray(userObj) ? userObj : defaultObj;
    }

    const result: any = {};

    // merge all keys from default
    for (const key of Object.keys(defaultObj)) {
        result[key] = mergeCss(defaultObj[key], userObj[key]);
    }

    // include extra user keys (optional, but usually good)
    for (const key of Object.keys(userObj)) {
        if (!(key in defaultObj)) {
            result[key] = userObj[key];
        }
    }

    return result;
}

// 🔹 load once
function loadCss() {
    if (typeof window === "undefined") return defaultCss;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};

        cssCache = mergeCss(defaultCss, parsed);
    } catch {
        cssCache = defaultCss;
    }

    return cssCache;
}

// 🔹 save
function saveCss(newCss: typeof defaultCss) {
    const merged = mergeCss(defaultCss, newCss);

    cssCache = merged;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCss));
        // store RAW user overrides, not merged version
    } catch {}
}
// ✅ MAIN HOOK (reactive)
export function useCss() {
    const [css, setCssState] = useState(loadCss);

    const setCss = (
        value: typeof defaultCss | ((prev: typeof defaultCss) => typeof defaultCss),
    ) => {
        setCssState((prev) => {
            const newValue = typeof value === "function" ? value(prev) : value;

            saveCss(newValue);
            return newValue;
        });
    };

    const resetCss = () => {
        saveCss(defaultCss);
        setCssState(defaultCss);
    };

    return { css, setCss, resetCss };
}

// ✅ OPTIONAL: non-react getter (read-only-ish)
export function getCss() {
    return cssCache;
}

// ✅ OPTIONAL: global setter (non-react, rare use)
export function setCssGlobal(newCss: typeof defaultCss) {
    saveCss(newCss);
}

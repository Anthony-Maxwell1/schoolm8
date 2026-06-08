"use client";

import { useState } from "react";
import { baseCss } from "./css-base-additions";

const STORAGE_KEY = "app-css";

// your original object
const defaultCss: any = {
    components: {
        base: baseCss,
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
                "sidebarHidden-style": "-translate-x-full",
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
                "sidebarHidden-style": "",
                "sidebarHideable-style": "ml-0",
            },
        },
        Dashboard: {
            main: {
                "ROOT-STYLE":
                    "relative w-full h-full overflow-hidden bg-[url('/images/backgrounds/builtin/0001.png')] bg-cover",
                empty: {
                    "ROOT-STYLE":
                        "h-screen flex items-center justify-center bg-linear-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900",
                },
                emptyCard: {
                    "ROOT-STYLE": "text-center max-w-md px-6",
                },
                emptyIcon: {
                    "ROOT-STYLE":
                        "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-neutral-800",
                },
                emptyTitle: {
                    "ROOT-STYLE": "text-xl font-semibold text-neutral-900 dark:text-neutral-100",
                    CONTENT: "No pages available",
                },
                emptySubtitle: {
                    "ROOT-STYLE": "mt-2 text-sm text-neutral-600 dark:text-neutral-400",
                    CONTENT: "You don’t have any pages yet. Create your first one to get started.",
                },
                emptyLink: {
                    "ROOT-STYLE":
                        "mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
                    CONTENT: "Editor",
                },
                editorTab: {
                    "ROOT-STYLE":
                        "fixed bottom-20 left-0 flex h-10 items-center rounded-r-full bg-blue-500 shadow-lg transition-all duration-300",
                    expanded: "w-25 px-3",
                    collapsed: "w-10 px-0",
                    toggle: {
                        "ROOT-STYLE": "flex h-10 w-10 cursor-pointer items-center justify-center",
                    },
                    buttons: {
                        "ROOT-STYLE": "ml-2 flex flex-row items-center gap-2",
                    },
                    icon: {
                        "ROOT-STYLE": "w-5 h-5 text-white",
                    },
                },
            },
        },
        JSONNavigation: {
            main: {
                "ROOT-STYLE":
                    "overflow-hidden rounded-[10px] border border-zinc-300 bg-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
                header: {
                    "ROOT-STYLE":
                        "flex h-10 items-center border-b border-zinc-300 bg-linear-to-b from-zinc-50 to-zinc-200 px-3.5 text-[13px] font-semibold text-zinc-700",
                    CONTENT: "JSON Navigator",
                },
                columns: {
                    "ROOT-STYLE": "flex min-h-105 overflow-x-auto bg-white",
                },
                panel: {
                    "ROOT-STYLE": "min-w-65 border-r border-zinc-200 bg-white p-1.5",
                },
                item: {
                    "ROOT-STYLE":
                        "flex h-7.5 cursor-default select-none items-center justify-between rounded-md px-2.5 text-[13px] text-zinc-900",
                    "selected-style": "bg-blue-500 text-white",
                    text: {
                        "ROOT-STYLE": "mr-2 overflow-hidden text-ellipsis whitespace-nowrap",
                    },
                    arrow: {
                        "ROOT-STYLE": "text-base leading-none opacity-70",
                        CONTENT: "›",
                    },
                },
            },
        },
        TailwindEditor: {
            main: {
                "ROOT-STYLE": "flex flex-col gap-3",
                row: {
                    "ROOT-STYLE":
                        "group flex items-center justify-between rounded-xl border border-gray-200 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-gray-300 hover:shadow-md",
                },
                left: {
                    "ROOT-STYLE": "flex flex-col gap-1",
                },
                labelRow: {
                    "ROOT-STYLE": "flex items-center gap-2",
                },
                label: {
                    "ROOT-STYLE": "text-sm font-semibold text-gray-800",
                },
                hintButton: {
                    "ROOT-STYLE":
                        "flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 cursor-pointer hover:bg-green-200",
                },
                className: {
                    "ROOT-STYLE": "text-xs font-mono text-gray-500",
                },
                control: {
                    "ROOT-STYLE": "flex items-center",
                },
                selectShell: {
                    "ROOT-STYLE":
                        "rounded-md border border-gray-300 bg-white px-2 py-1 shadow-inner",
                },
                inputShell: {
                    "ROOT-STYLE":
                        "rounded-md border border-gray-300 bg-white px-2 py-1 shadow-inner text-black",
                },
            },
        },
    },
    app: {
        auth: {
            page: {
                main: {
                    "ROOT-STYLE": "relative min-h-screen bg-cover bg-center",
                    overlay: {
                        "ROOT-STYLE":
                            "absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm",
                    },
                    shell: {
                        "ROOT-STYLE":
                            "relative z-10 flex min-h-screen items-center justify-center px-4",
                    },
                    card: {
                        "ROOT-STYLE":
                            "w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-2xl ring-1 ring-black/10 dark:bg-slate-900/80 dark:ring-white/5",
                    },
                    intro: {
                        "ROOT-STYLE": "mb-6 text-center",
                    },
                    title: {
                        "ROOT-STYLE": "text-2xl font-semibold text-slate-900 dark:text-slate-100",
                        CONTENT: "👋 Welcome to Schoolm8",
                    },
                    subtitle: {
                        "ROOT-STYLE": "mt-2 text-sm text-slate-600 dark:text-slate-300",
                        CONTENT: "The only portal you'll ever need.",
                    },
                    body: {
                        "ROOT-STYLE": "space-y-3",
                    },
                    prompt: {
                        "ROOT-STYLE": "text-sm text-slate-500 dark:text-slate-400",
                    },
                    primaryLink: {
                        "ROOT-STYLE":
                            "flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        CONTENT: "Sign In",
                    },
                    secondaryLink: {
                        "ROOT-STYLE":
                            "flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200",
                        CONTENT: "Create Account",
                    },
                    footer: {
                        "ROOT-STYLE": "mt-6 text-center text-xs text-slate-500 dark:text-slate-400",
                    },
                    link: {
                        "ROOT-STYLE": "underline",
                    },
                },
            },
        },
        dashboard: {
            page: {
                main: {
                    "ROOT-STYLE": "h-screen flex",
                    content: {
                        "ROOT-STYLE": "flex-1",
                    },
                },
                empty: {
                    "ROOT-STYLE":
                        "h-screen flex items-center justify-center bg-linear-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900",
                },
                emptyCard: {
                    "ROOT-STYLE": "text-center max-w-md px-6",
                },
                emptyIcon: {
                    "ROOT-STYLE":
                        "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-neutral-800",
                },
                emptyTitle: {
                    "ROOT-STYLE": "text-xl font-semibold text-neutral-900 dark:text-neutral-100",
                    CONTENT: "No pages available",
                },
                emptySubtitle: {
                    "ROOT-STYLE": "mt-2 text-sm text-neutral-600 dark:text-neutral-400",
                    CONTENT: "You don’t have any pages yet. Create your first one to get started.",
                },
                emptyLink: {
                    "ROOT-STYLE":
                        "mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",
                    CONTENT: "Editor",
                },
                editorTab: {
                    "ROOT-STYLE":
                        "fixed bottom-20 left-0 flex h-10 items-center rounded-r-full bg-blue-500 shadow-lg transition-all duration-300",
                    expanded: "w-25 px-3",
                    collapsed: "w-10 px-0",
                    toggle: {
                        "ROOT-STYLE": "flex h-10 w-10 cursor-pointer items-center justify-center",
                    },
                    buttons: {
                        "ROOT-STYLE": "ml-2 flex flex-row items-center gap-2",
                    },
                    icon: {
                        "ROOT-STYLE": "w-5 h-5 text-white",
                    },
                },
            },
            editor: {
                main: {
                    "ROOT-STYLE": "h-screen flex relative",
                    editorOpen: {
                        "ROOT-STYLE":
                            "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm",
                        inner: {
                            "ROOT-STYLE":
                                "w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden",
                        },
                    },

                    header: {
                        "ROOT-STYLE":
                            "flex items-center justify-between border-b border-gray-100 px-5 py-4",
                        title: { "ROOT-STYLE": "text-lg font-semibold text-gray-900" },
                        subtitle: { "ROOT-STYLE": "text-sm text-gray-500" },
                        closeButton: {
                            "ROOT-STYLE":
                                "rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700",
                        },
                    },

                    content: {
                        "ROOT-STYLE": "flex flex-col gap-4 px-5 py-4",
                        labelGroup: { "ROOT-STYLE": "flex flex-col gap-1" },
                        input: {
                            "ROOT-STYLE":
                                "rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
                        },
                    },

                    dangerZone: {
                        "ROOT-STYLE": "rounded-xl border border-red-100 bg-red-50 p-3",
                        inner: { "ROOT-STYLE": "flex items-start justify-between gap-3" },
                        title: { "ROOT-STYLE": "text-sm font-medium text-red-700" },
                        desc: { "ROOT-STYLE": "mt-1 text-xs text-red-600" },
                        button: {
                            "ROOT-STYLE":
                                "rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600",
                        },
                    },

                    footer: {
                        "ROOT-STYLE": "flex justify-end gap-2 border-t border-gray-100 px-5 py-4",
                        cancel: {
                            "ROOT-STYLE":
                                "rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100",
                        },
                        save: {
                            "ROOT-STYLE":
                                "rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600",
                        },
                    },

                    globalEditor: {
                        overlay: {
                            "ROOT-STYLE":
                                "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
                        },
                        card: { "ROOT-STYLE": "bg-white p-4 rounded shadow-lg w-96" },
                        saveButton: {
                            "ROOT-STYLE": "mt-4 px-3 py-1 bg-blue-500 text-white rounded",
                        },
                    },

                    asideLeft: {
                        "ROOT-STYLE": "w-48 border-r p-2",
                        pageButton: {
                            "ROOT-STYLE":
                                "w-full mb-2 text-slate-800 p-1 cursor-pointer rounded-md border-slate-800 border-2",
                        },
                        pageItem: {
                            "ROOT-STYLE":
                                "block w-full text-left p-1 text-slate-800 border-2 border-slate-800 rounded-md justify-between flex items-center",
                            menu: {
                                "ROOT-STYLE":
                                    "text-slate-800 hover:bg-slate-200 p-1 rounded-md cursor-pointer transition-colors",
                            },
                        },
                    },

                    registry: {
                        "ROOT-STYLE": "w-64 border-l p-2 overflow-auto",
                        heading: { "ROOT-STYLE": "font-bold" },
                    },

                    dragPreview: {
                        "ROOT-STYLE":
                            "absolute pointer-events-none border-2 border-blue-500 bg-blue-200 opacity-50",
                    },

                    floatingButtons: {
                        globalOptions: {
                            "ROOT-STYLE":
                                "fixed bottom-14 right-4 bg-red-600 text-white px-3 py-1 rounded cursor-pointer",
                        },
                        backLink: {
                            "ROOT-STYLE":
                                "fixed bottom-4 right-4 bg-green-600 text-white px-3 py-1 rounded",
                        },
                    },
                },
            },
        },
        knowledgeBase: {
            loading: {
                "ROOT-STYLE": "flex h-screen items-center justify-center",
            },
        },
        onboarding: {
            page: {
                main: {
                    "ROOT-STYLE": "relative h-screen bg-cover bg-center",
                    overlay: {
                        "ROOT-STYLE":
                            "absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm",
                    },
                    loading: {
                        "ROOT-STYLE":
                            "fixed inset-0 z-20 flex items-center justify-center bg-black/50 pointer-events-auto",
                    },
                    loadingText: {
                        "ROOT-STYLE": "text-lg font-medium text-white",
                        CONTENT: "Loading...",
                    },
                    shell: {
                        "ROOT-STYLE":
                            "relative z-10 flex min-h-screen items-center justify-center gap-8 px-6",
                    },
                    stepList: {
                        "ROOT-STYLE":
                            "flex w-full max-w-70 flex-col overflow-hidden rounded-2xl bg-white/30 shadow-xl ring-1 ring-white/50 backdrop-blur-lg",
                    },
                    stepButton: {
                        "ROOT-STYLE": "w-full p-3 text-left text-white transition",
                        active: "border-l-4 border-l-green-600 font-semibold",
                        inactive: "hover:bg-black/5",
                    },
                    stepContent: {
                        "ROOT-STYLE":
                            "w-full max-w-2xl rounded-3xl bg-white/30 p-8 shadow-xl ring-1 ring-white/50 backdrop-blur-lg",
                    },
                    switchLinks: {
                        "ROOT-STYLE":
                            "absolute bottom-0 left-0 z-20 flex w-full flex-row gap-1 rounded-2xl p-3",
                    },
                    switchLink: {
                        "ROOT-STYLE":
                            "cursor-pointer rounded-full bg-white/90 p-1 pl-1.5 pr-1.5 text-center text-xs",
                    },
                    preview: {
                        "ROOT-STYLE": "relative mb-6 h-75 w-full overflow-hidden rounded-2xl",
                    },
                    carouselControls: {
                        "ROOT-STYLE": "mt-4 flex justify-between",
                    },
                    carouselButton: {
                        "ROOT-STYLE":
                            "rounded-lg bg-black/10 px-4 py-2 text-white hover:bg-black/20",
                    },
                    dots: {
                        "ROOT-STYLE": "mt-4 flex justify-center gap-2",
                        dot: {
                            "ROOT-STYLE": "h-2 w-2 rounded-full transition",
                            active: "bg-green-600 w-5",
                            inactive: "bg-slate-300",
                        },
                    },
                },
            },
        },
        settings: {
            appearance: {
                page: {
                    main: {
                        "ROOT-STYLE": "relative min-h-screen bg-cover bg-center",
                    },
                    overlay: {
                        "ROOT-STYLE":
                            "absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm",
                    },
                    shell: {
                        "ROOT-STYLE":
                            "relative z-10 flex min-h-screen items-center justify-center gap-8 px-6",
                    },
                    panel: {
                        "ROOT-STYLE":
                            "w-full min-w-70 overflow-hidden rounded-2xl bg-white/30 shadow-xl ring-1 ring-white/50 backdrop-blur-lg",
                    },
                    header: {
                        "ROOT-STYLE": "flex flex-row gap-6 p-4 content-center",
                    },
                    docsLink: {
                        "ROOT-STYLE":
                            "flex items-center gap-2 rounded-md bg-blue-400 px-2 text-white transition-all hover:scale-110 hover:bg-blue-800",
                    },
                    sectionTitle: {
                        "ROOT-STYLE": "text-xl font-bold text-white",
                        CONTENT: "Dashboard Themes",
                    },
                    themeGrid: {
                        "ROOT-STYLE": "mt-3 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5",
                    },
                    themeCard: {
                        "ROOT-STYLE":
                            "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-white/95 text-black shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl",
                    },
                    themePreview: {
                        "ROOT-STYLE":
                            "relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-slate-100 via-white to-slate-200",
                    },
                    themeCaption: {
                        "ROOT-STYLE":
                            "absolute inset-x-0 bottom-0 bg-black/70 p-2 text-sm text-white",
                    },
                    editorPane: {
                        "ROOT-STYLE": "flex-none overflow-scroll p-5 h-105 w-96",
                    },
                    openCodeButton: {
                        "ROOT-STYLE":
                            "mt-2 cursor-pointer rounded-full bg-blue-600 px-2 py-0.5 text-white transition-all hover:bg-blue-400",
                        CONTENT: "Open in code editor",
                    },
                    cardShell: {
                        "ROOT-STYLE":
                            "group mb-2 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 open:shadow-md",
                    },
                    cardSummary: {
                        "ROOT-STYLE":
                            "flex list-none cursor-pointer items-center justify-between gap-3 bg-linear-to-r from-slate-50 via-white to-slate-100 px-3 py-2.5 font-medium marker:hidden",
                    },
                    cardBody: {
                        "ROOT-STYLE": "border-t border-slate-200/80 bg-white p-2.5",
                    },
                },
            },
        },
        timetable: {
            page: {
                main: {
                    "ROOT-STYLE": "min-h-screen bg-slate-950",
                },
                toolbarRow: {
                    "ROOT-STYLE": "mb-4 flex items-center justify-between",
                },
                viewToggleGroup: {
                    "ROOT-STYLE": "flex gap-2",
                },
                weekNav: {
                    "ROOT-STYLE": "flex items-center justify-center gap-4",
                },
                weekButton: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100 transition-colors hover:bg-slate-800",
                },
                weekInfo: {
                    "ROOT-STYLE": "min-w-50 text-center",
                },
                weekLabel: {
                    "ROOT-STYLE": "text-sm text-slate-300",
                    CONTENT: "Week of",
                },
                weekDate: {
                    "ROOT-STYLE": "font-semibold text-white",
                },
                toolbar: {
                    "ROOT-STYLE":
                        "sticky top-14 z-20 space-y-4 border-b border-slate-700/70 bg-slate-950/95 px-6 py-4 backdrop-blur-md md:top-0",
                },
                toolbarInner: {
                    "ROOT-STYLE": "mx-auto mb-4 flex max-w-7xl items-center justify-between",
                },
                viewButton: {
                    "ROOT-STYLE": "rounded-lg border p-2 transition-all",
                    active: "border-emerald-400 bg-emerald-500 text-slate-950",
                    inactive: "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800",
                },
                navButton: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100 transition-colors hover:bg-slate-800",
                },
                searchRow: {
                    "ROOT-STYLE": "mx-auto flex max-w-7xl gap-3",
                },
                searchWrap: {
                    "ROOT-STYLE": "relative flex-1",
                },
                searchInput: {
                    "ROOT-STYLE":
                        "w-full rounded-lg border border-slate-700 bg-slate-900/90 py-2 pl-10 pr-4 text-slate-100 placeholder-slate-400 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30",
                },
                filterSelect: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-100 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30",
                },
                content: {
                    "ROOT-STYLE": "mx-auto max-w-7xl px-6 py-12",
                },
                loading: {
                    "ROOT-STYLE": "flex items-center justify-center py-20",
                    inner: {
                        "ROOT-STYLE": "flex flex-col items-center gap-4",
                    },
                    spinner: {
                        "ROOT-STYLE":
                            "h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400",
                    },
                    text: {
                        "ROOT-STYLE": "text-slate-300",
                    },
                },
                loadingText: {
                    "ROOT-STYLE": "text-slate-300",
                    CONTENT: "Loading timetable...",
                },
                emptyCard: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-700 bg-slate-950/70 p-8 text-center",
                    icon: {
                        "ROOT-STYLE": "mx-auto mb-3 h-12 w-12 text-slate-500 opacity-60",
                    },
                    text: {
                        "ROOT-STYLE": "text-slate-300",
                    },
                },
                errorCard: {
                    "ROOT-STYLE": "text-center",
                    title: {
                        "ROOT-STYLE": "mb-2 text-2xl font-semibold text-white",
                        CONTENT: "Error",
                    },
                    text: {
                        "ROOT-STYLE": "text-slate-300",
                    },
                },
                daySection: {
                    "ROOT-STYLE": "space-y-4",
                },
                dayTitle: {
                    "ROOT-STYLE": "text-2xl font-bold text-white",
                },
                grid: {
                    "ROOT-STYLE": "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
                },
                card: {
                    "ROOT-STYLE":
                        "rounded-lg border p-4 backdrop-blur transition-all hover:shadow-lg hover:shadow-black/20",
                },
                cardHeader: {
                    "ROOT-STYLE": "mb-2 flex items-start justify-between",
                },
                cardTitle: {
                    "ROOT-STYLE": "text-lg font-semibold text-white",
                },
                cardType: {
                    "ROOT-STYLE": "text-xs font-bold uppercase tracking-wide opacity-90",
                },
                cardMeta: {
                    "ROOT-STYLE": "mb-2 flex items-center gap-2 text-sm opacity-95",
                },
                cardMetaGroup: {
                    "ROOT-STYLE": "flex items-center gap-2",
                },
                cardDesc: {
                    "ROOT-STYLE": "mt-3 line-clamp-2 text-sm opacity-85",
                },
            },
        },
        assignments: {
            page: {
                main: {
                    "ROOT-STYLE": "min-h-screen bg-slate-900",
                },
                toolbar: {
                    "ROOT-STYLE":
                        "sticky top-14 z-20 border-b border-slate-700/50 bg-slate-800/40 px-6 py-4 backdrop-blur-md md:top-0",
                },
                toolbarInner: {
                    "ROOT-STYLE": "mx-auto flex max-w-7xl flex-wrap gap-3",
                },
                select: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm text-white transition-all focus:border-emerald-500 focus:outline-none",
                },
                dateInput: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm text-white transition-all focus:border-emerald-500 focus:outline-none",
                },
                content: {
                    "ROOT-STYLE": "mx-auto max-w-7xl px-6 py-12",
                },
                loading: {
                    "ROOT-STYLE": "flex items-center justify-center py-20",
                },
                emptyCard: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-700 bg-slate-950/70 p-8 text-center",
                },
                grid: {
                    "ROOT-STYLE": "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
                },
                card: {
                    "ROOT-STYLE":
                        "group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-700/40 to-slate-800/40 p-6 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10",
                },
                statusIcon: {
                    "ROOT-STYLE": "absolute right-4 top-4",
                },
                title: {
                    "ROOT-STYLE":
                        "mb-2 pr-8 text-lg font-semibold text-white transition-colors group-hover:text-emerald-400 line-clamp-2",
                },
                course: {
                    "ROOT-STYLE": "mb-4 text-sm text-slate-400",
                },
                dueRow: {
                    "ROOT-STYLE": "mb-4 flex items-center gap-2 text-sm text-slate-400",
                },
                desc: {
                    "ROOT-STYLE": "mb-4 line-clamp-2 text-sm text-slate-400",
                },
                link: {
                    "ROOT-STYLE":
                        "mt-4 inline-block rounded-lg border border-emerald-600/30 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-600/40",
                    CONTENT: "Open Assignment",
                },
            },
        },
        courses: {
            page: {
                main: {
                    "ROOT-STYLE": "min-h-screen",
                },
                toolbar: {
                    "ROOT-STYLE":
                        "sticky top-14 z-20 border-b border-slate-700/50 bg-slate-800/40 px-6 py-4 backdrop-blur-md md:top-0",
                },
                toolbarInner: {
                    "ROOT-STYLE": "mx-auto max-w-7xl",
                },
                searchWrap: {
                    "ROOT-STYLE": "relative",
                },
                searchInput: {
                    "ROOT-STYLE":
                        "w-full rounded-lg border border-slate-600/50 bg-slate-700/50 py-2 pl-10 pr-4 text-white placeholder-slate-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                },
                content: {
                    "ROOT-STYLE": "mx-auto max-w-7xl px-6 py-12",
                },
                loading: {
                    "ROOT-STYLE": "flex items-center justify-center py-20",
                },
                emptyCard: {
                    "ROOT-STYLE":
                        "rounded-lg border border-slate-700 bg-slate-950/70 p-8 text-center",
                },
                grid: {
                    "ROOT-STYLE": "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
                },
                card: {
                    "ROOT-STYLE":
                        "group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-700/40 to-slate-800/40 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10",
                },
                imageWrap: {
                    "ROOT-STYLE": "relative h-40 overflow-hidden",
                },
                image: {
                    "ROOT-STYLE":
                        "h-full w-full object-cover transition-transform duration-300 group-hover:scale-110",
                },
                overlay: {
                    "ROOT-STYLE":
                        "absolute inset-0 bg-linear-to-b from-transparent to-slate-900/80",
                },
                inner: {
                    "ROOT-STYLE": "p-6",
                },
                title: {
                    "ROOT-STYLE":
                        "mb-2 line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-emerald-400",
                },
                desc: {
                    "ROOT-STYLE": "mb-4 line-clamp-2 text-sm text-slate-400",
                },
                footer: {
                    "ROOT-STYLE":
                        "flex items-center justify-between border-t border-slate-600/30 pt-4",
                },
                footerText: {
                    "ROOT-STYLE": "text-xs text-slate-500",
                },
                arrow: {
                    "ROOT-STYLE":
                        "h-4 w-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-emerald-500",
                },
            },
        },
        lms: {
            page: {
                main: {
                    "ROOT-STYLE": "mx-auto max-w-7xl space-y-12 px-6 py-12",
                },
                loading: {
                    "ROOT-STYLE": "flex min-h-screen items-center justify-center",
                },
                loadingInner: {
                    "ROOT-STYLE": "flex flex-col items-center gap-4",
                    spinner: {
                        "ROOT-STYLE":
                            "h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400",
                    },
                    text: {
                        "ROOT-STYLE": "text-slate-400",
                        CONTENT: "Loading...",
                    },
                },
                icon: {
                    "ROOT-STYLE": "w-5 h-5",
                },
                section: {
                    "ROOT-STYLE": "space-y-4",
                },
                sectionHeader: {
                    "ROOT-STYLE": "flex items-center justify-between",
                },
                sectionTitle: {
                    "ROOT-STYLE": "text-2xl font-bold text-white",
                },
                seeAll: {
                    "ROOT-STYLE":
                        "text-sm text-emerald-400 transition-colors hover:text-emerald-300",
                    CONTENT: "See all",
                },
                carousel: {
                    "ROOT-STYLE": "group relative",
                },
                navButton: {
                    "ROOT-STYLE":
                        "absolute top-1/2 z-10 -translate-y-1/2 rounded-lg bg-slate-900/80 p-2 text-white opacity-0 backdrop-blur transition-opacity hover:bg-slate-800 group-hover:opacity-100",
                    left: "left-0",
                    right: "right-0",
                },
                scrollArea: {
                    "ROOT-STYLE": "flex gap-4 overflow-x-auto px-8 pb-2 scroll-smooth",
                },
                card: {
                    "ROOT-STYLE":
                        "group relative h-48 w-80 shrink-0 overflow-hidden rounded-lg border border-slate-700/50 bg-linear-to-br from-slate-700/40 to-slate-800/40 p-4 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10",
                },
                image: {
                    "ROOT-STYLE":
                        "mb-2 h-32 w-full rounded-lg object-cover transition-transform group-hover:scale-105",
                },
                title: {
                    "ROOT-STYLE":
                        "line-clamp-1 font-semibold text-white transition-colors group-hover:text-emerald-400",
                },
                desc: {
                    "ROOT-STYLE": "line-clamp-1 text-sm text-slate-400",
                },
                meta: {
                    "ROOT-STYLE": "mt-1 text-xs text-slate-500",
                },
                courseGrid: {
                    "ROOT-STYLE": "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
                },
                courseCard: {
                    "ROOT-STYLE": "group relative h-48 cursor-pointer overflow-hidden rounded-2xl",
                },
                courseImage: {
                    "ROOT-STYLE":
                        "h-full w-full object-cover transition-transform duration-300 group-hover:scale-110",
                },
                courseOverlay: {
                    "ROOT-STYLE":
                        "absolute inset-0 bg-linear-to-b from-transparent to-slate-900/80",
                },
                courseContent: {
                    "ROOT-STYLE": "absolute bottom-0 left-0 right-0 p-4",
                },
                empty: {
                    "ROOT-STYLE": "flex items-center justify-center py-20",
                },
                emptyTitle: {
                    "ROOT-STYLE": "mb-2 text-2xl font-semibold text-slate-300",
                    CONTENT: "No LMS data yet",
                },
                emptyText: {
                    "ROOT-STYLE": "text-slate-400",
                },
                assignment: {
                    main: {
                        "ROOT-STYLE":
                            "min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-6",
                    },
                    header: {
                        card: {
                            "ROOT-STYLE":
                                "w-full max-w-4xl rounded-xl bg-white p-6 shadow-md flex flex-col gap-3",
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
                            "ROOT-STYLE": "font-medium text-red-500",
                        },
                        desc: {
                            "ROOT-STYLE": "mt-2 text-gray-700",
                        },
                        links: {
                            "ROOT-STYLE": "mt-4 flex flex-row gap-4",
                            link: {
                                "ROOT-STYLE":
                                    "mt-2 w-fit font-medium text-blue-500 hover:underline",
                            },
                        },
                    },
                    rubric: {
                        card: {
                            "ROOT-STYLE": "w-full max-w-4xl rounded-xl bg-white p-6 shadow-md",
                        },
                        title: {
                            "ROOT-STYLE": "mb-4 text-2xl font-semibold",
                            CONTENT: "Rubric",
                        },
                        tableWrapper: {
                            "ROOT-STYLE": "overflow-x-auto",
                        },
                        table: {
                            "ROOT-STYLE": "w-full border-collapse",
                            header: {
                                "ROOT-STYLE":
                                    "border-b border-gray-200 pb-2 text-left text-gray-600",
                            },
                            cell: {
                                "ROOT-STYLE": "border-b border-gray-100 py-2 text-sm text-gray-700",
                            },
                        },
                    },
                },
                announcement: {
                    main: {
                        "ROOT-STYLE":
                            "min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-6",
                    },
                    header: {
                        card: {
                            "ROOT-STYLE":
                                "w-full max-w-4xl rounded-xl bg-white p-6 shadow-md flex flex-col gap-3",
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
                            "ROOT-STYLE": "font-medium text-red-500",
                        },
                        desc: {
                            "ROOT-STYLE": "mt-2 text-gray-700",
                        },
                        links: {
                            "ROOT-STYLE": "mt-4 flex flex-row gap-4",
                            link: {
                                "ROOT-STYLE":
                                    "mt-2 w-fit font-medium text-blue-500 hover:underline",
                            },
                        },
                    },
                    rubric: {
                        card: {
                            "ROOT-STYLE": "w-full max-w-4xl rounded-xl bg-white p-6 shadow-md",
                        },
                        title: {
                            "ROOT-STYLE": "mb-4 text-2xl font-semibold",
                            CONTENT: "Rubric",
                        },
                        tableWrapper: {
                            "ROOT-STYLE": "overflow-x-auto",
                        },
                        table: {
                            "ROOT-STYLE": "w-full border-collapse",
                            header: {
                                "ROOT-STYLE":
                                    "border-b border-gray-200 pb-2 text-left text-gray-600",
                            },
                            cell: {
                                "ROOT-STYLE": "border-b border-gray-100 py-2 text-sm text-gray-700",
                            },
                        },
                    },
                },
            },
        },
        lmsLegacy: {
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

const DEFAULT_THEME_NAME = "default";
const DEFAULT_TILE_THEME_NAME = "default";

type CssType = typeof defaultCss;
type ThemeMap = Record<string, any>;

type CssThemeStore = {
    themes: ThemeMap;
    tileThemes: ThemeMap;
    currentTheme: string;
    currentTileTheme: string;
};

function createDefaultStore(): CssThemeStore {
    return {
        themes: {
            [DEFAULT_THEME_NAME]: defaultCss,
        },
        tileThemes: {
            [DEFAULT_TILE_THEME_NAME]: defaultCss.components.tiles,
        },
        currentTheme: DEFAULT_THEME_NAME,
        currentTileTheme: DEFAULT_TILE_THEME_NAME,
    };
}

let themeStoreCache: CssThemeStore = createDefaultStore();

// 🔹 in-memory fallback (for non-hook usage)
let cssCache: any = defaultCss;

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

function getFirstKey(obj: Record<string, any>, fallback: string) {
    const keys = Object.keys(obj || {});
    return keys.length > 0 ? keys[0] : fallback;
}

function normaliseStore(input: any): CssThemeStore {
    // backward compatibility: old format stored raw css object directly
    if (
        !input ||
        typeof input !== "object" ||
        !input.themes ||
        !input.tileThemes ||
        typeof input.themes !== "object" ||
        typeof input.tileThemes !== "object"
    ) {
        const legacyCss = mergeCss(defaultCss, input ?? {});
        return {
            themes: {
                [DEFAULT_THEME_NAME]: legacyCss,
            },
            tileThemes: {
                [DEFAULT_TILE_THEME_NAME]: mergeCss(
                    defaultCss.components.tiles,
                    legacyCss?.components?.tiles ?? {},
                ),
            },
            currentTheme: DEFAULT_THEME_NAME,
            currentTileTheme: DEFAULT_TILE_THEME_NAME,
        };
    }

    const themes: ThemeMap = {
        [DEFAULT_THEME_NAME]: defaultCss,
        ...input.themes,
    };

    const tileThemes: ThemeMap = {
        [DEFAULT_TILE_THEME_NAME]: defaultCss.components.tiles,
        ...input.tileThemes,
    };

    const currentTheme =
        typeof input.currentTheme === "string" && input.currentTheme in themes
            ? input.currentTheme
            : getFirstKey(themes, DEFAULT_THEME_NAME);

    const currentTileTheme =
        typeof input.currentTileTheme === "string" && input.currentTileTheme in tileThemes
            ? input.currentTileTheme
            : getFirstKey(tileThemes, DEFAULT_TILE_THEME_NAME);

    return {
        themes,
        tileThemes,
        currentTheme,
        currentTileTheme,
    };
}

function buildVisibleCss(store: CssThemeStore): CssType {
    const selectedTheme = store.themes[store.currentTheme] ?? defaultCss;
    const selectedTileTheme =
        store.tileThemes[store.currentTileTheme] ?? defaultCss.components.tiles;

    const mergedTheme = mergeCss(defaultCss, selectedTheme);
    const mergedTileTheme = mergeCss(defaultCss.components.tiles, selectedTileTheme);

    return {
        ...mergedTheme,
        components: {
            ...mergedTheme.components,
            tiles: mergedTileTheme,
        },
    };
}

function syncCachesFromStore(store: CssThemeStore) {
    themeStoreCache = store;
    cssCache = buildVisibleCss(store);
}

// 🔹 load once
function loadCss() {
    if (typeof window === "undefined") {
        const fallback = createDefaultStore();
        syncCachesFromStore(fallback);
        return fallback;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};

        const store = normaliseStore(parsed);
        syncCachesFromStore(store);
    } catch {
        syncCachesFromStore(createDefaultStore());
    }

    return themeStoreCache;
}

// 🔹 save
function saveStore(store: CssThemeStore) {
    const normalised = normaliseStore(store);
    syncCachesFromStore(normalised);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised));
    } catch {}
}

// ✅ MAIN HOOK (reactive)
export function useCss() {
    const [store, setStore] = useState<CssThemeStore>(loadCss);

    const css = buildVisibleCss(store);

    const setCss = (
        value: typeof defaultCss | ((prev: typeof defaultCss) => typeof defaultCss),
    ) => {
        setStore((prevStore) => {
            const prevCss = buildVisibleCss(prevStore);
            const newCss = typeof value === "function" ? value(prevCss) : value;

            const nextStore: CssThemeStore = {
                ...prevStore,
                themes: {
                    ...prevStore.themes,
                    [prevStore.currentTheme]: newCss,
                },
                tileThemes: {
                    ...prevStore.tileThemes,
                    [prevStore.currentTileTheme]:
                        newCss?.components?.tiles ??
                        prevStore.tileThemes[prevStore.currentTileTheme] ??
                        defaultCss.components.tiles,
                },
            };

            saveStore(nextStore);
            return nextStore;
        });
    };

    const selectTheme = (name: string) => {
        setStore((prevStore) => {
            if (!(name in prevStore.themes)) return prevStore;
            const nextStore = {
                ...prevStore,
                currentTheme: name,
            };
            saveStore(nextStore);
            return nextStore;
        });
    };

    const selectTileTheme = (name: string) => {
        setStore((prevStore) => {
            if (!(name in prevStore.tileThemes)) return prevStore;
            const nextStore = {
                ...prevStore,
                currentTileTheme: name,
            };
            saveStore(nextStore);
            return nextStore;
        });
    };

    const addTheme = (name: string, theme: CssType = defaultCss) => {
        if (!name) return;
        setStore((prevStore) => {
            const nextStore = {
                ...prevStore,
                themes: {
                    ...prevStore.themes,
                    [name]: theme,
                },
            };
            saveStore(nextStore);
            return nextStore;
        });
    };

    const addTileTheme = (name: string, tileTheme: any = defaultCss.components.tiles) => {
        if (!name) return;
        setStore((prevStore) => {
            const nextStore = {
                ...prevStore,
                tileThemes: {
                    ...prevStore.tileThemes,
                    [name]: tileTheme,
                },
            };
            saveStore(nextStore);
            return nextStore;
        });
    };

    const editTheme = (name: string, value: any | ((prev: any) => any)) => {
        setStore((prevStore) => {
            if (!(name in prevStore.themes)) return prevStore;

            const current = prevStore.themes[name];
            const updated = typeof value === "function" ? value(current) : value;

            const nextStore = {
                ...prevStore,
                themes: {
                    ...prevStore.themes,
                    [name]: updated,
                },
            };

            saveStore(nextStore);
            return nextStore;
        });
    };

    const resetCssDefaultThemes = () => {
        setStore((prevStore) => {
            const nextStore: CssThemeStore = {
                ...prevStore,
                themes: {
                    ...prevStore.themes,
                    [DEFAULT_THEME_NAME]: defaultCss,
                },
                tileThemes: {
                    ...prevStore.tileThemes,
                    [DEFAULT_TILE_THEME_NAME]: defaultCss.components.tiles,
                },
            };
            saveStore(nextStore);
            return nextStore;
        });
    };

    const editTileTheme = (name: string, value: any | ((prev: any) => any)) => {
        setStore((prevStore) => {
            if (!(name in prevStore.tileThemes)) return prevStore;

            const current = prevStore.tileThemes[name];
            const updated = typeof value === "function" ? value(current) : value;

            const nextStore = {
                ...prevStore,
                tileThemes: {
                    ...prevStore.tileThemes,
                    [name]: updated,
                },
            };

            saveStore(nextStore);
            return nextStore;
        });
    };

    const removeTheme = (name: string) => {
        setStore((prevStore) => {
            if (!(name in prevStore.themes)) return prevStore;

            const nextThemes = { ...prevStore.themes };
            delete nextThemes[name];

            if (Object.keys(nextThemes).length === 0) {
                nextThemes[DEFAULT_THEME_NAME] = defaultCss;
            }

            const nextCurrentTheme =
                prevStore.currentTheme === name
                    ? getFirstKey(nextThemes, DEFAULT_THEME_NAME)
                    : prevStore.currentTheme;

            const nextStore = {
                ...prevStore,
                themes: nextThemes,
                currentTheme: nextCurrentTheme,
            };

            saveStore(nextStore);
            return nextStore;
        });
    };

    const removeTileTheme = (name: string) => {
        setStore((prevStore) => {
            if (!(name in prevStore.tileThemes)) return prevStore;

            const nextTileThemes = { ...prevStore.tileThemes };
            delete nextTileThemes[name];

            if (Object.keys(nextTileThemes).length === 0) {
                nextTileThemes[DEFAULT_TILE_THEME_NAME] = defaultCss.components.tiles;
            }

            const nextCurrentTileTheme =
                prevStore.currentTileTheme === name
                    ? getFirstKey(nextTileThemes, DEFAULT_TILE_THEME_NAME)
                    : prevStore.currentTileTheme;

            const nextStore = {
                ...prevStore,
                tileThemes: nextTileThemes,
                currentTileTheme: nextCurrentTileTheme,
            };

            saveStore(nextStore);
            return nextStore;
        });
    };

    const resetCss = () => {
        setStore((prevStore) => {
            const nextStore: CssThemeStore = {
                ...prevStore,
                themes: {
                    ...prevStore.themes,
                    [prevStore.currentTheme]: defaultCss,
                },
                tileThemes: {
                    ...prevStore.tileThemes,
                    [prevStore.currentTileTheme]: defaultCss.components.tiles,
                },
            };
            saveStore(nextStore);
            return nextStore;
        });
    };

    return {
        css,
        setCss,
        resetCss,
        themes: store.themes,
        tileThemes: store.tileThemes,
        currentTheme: store.currentTheme,
        currentTileTheme: store.currentTileTheme,
        selectTheme,
        selectTileTheme,
        setTheme: selectTheme,
        setTileTheme: selectTileTheme,
        addTheme,
        addTileTheme,
        editTheme,
        editTileTheme,
        updateTheme: editTheme,
        updateTileTheme: editTileTheme,
        removeTheme,
        removeTileTheme,
        resetCssDefaultThemes,
    };
}

// ✅ OPTIONAL: non-react getter (read-only-ish)
export function getCss() {
    return cssCache;
}

// ✅ OPTIONAL: global setter (non-react, rare use)
export function setCssGlobal(newCss: typeof defaultCss) {
    const store = themeStoreCache;
    const nextStore: CssThemeStore = {
        ...store,
        themes: {
            ...store.themes,
            [store.currentTheme]: newCss,
        },
        tileThemes: {
            ...store.tileThemes,
            [store.currentTileTheme]:
                newCss?.components?.tiles ??
                store.tileThemes[store.currentTileTheme] ??
                defaultCss.components.tiles,
        },
    };
    saveStore(nextStore);
}

export function getThemeStore() {
    return themeStoreCache;
}

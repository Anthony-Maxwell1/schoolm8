// This is styling, mainly for components and pages not affected by dashboard themes.
export const css = {
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
    },
    app: {
        lms: {
            page: {
                main: {
                    "ROOT-STYLE": "w-full h-full",
                    announcements: {
                        "ROOT-STYLE": "w-full p-3 h-24",
                    },
                },
            },
        },
    },
};

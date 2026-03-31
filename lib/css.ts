import { redirect } from "next/navigation";

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
                            "ROOT-STYLE": "relative",
                            left: {
                                "ROOT-STYLE":
                                    "absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:scale-105 transition cursor-pointer",
                                CONTENT: "←",
                            },
                            right: {
                                "ROOT-STYLE":
                                    "absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hover:scale-105 transition cursor-pointer",
                                CONTENT: "→",
                            },
                            scrollarea: {
                                "ROOT-STYLE":
                                    "flex gap-4 overflow-x-auto scroll-smooth no-scrollbar pb-2 px-8",
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
                    link: {
                        "ROOT-STYLE": "mt-2 text-blue-500 hover:underline font-medium w-fit",
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

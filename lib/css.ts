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
                                "ROOT-STYLE": "",
                            },
                        },
                    },
                },
            },
        },
    },
};

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { Filter, SortAsc } from "lucide-react";
type task = {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
};
type tasks = task[];

export function A() {
    const { token, loading } = useAuth();
    const [tasks, setTasks] = useState<tasks>([
        {
            id: "1",
            title: "Loading...",
            description: "Task data is loading...",
            dueDate: new Date(Date.now() + 86400000), // Due in 1 day
        },
    ]);
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("due-date");
    const processedTasks = [...tasks]
        // FILTERING
        .filter((task) => {
            const now = Date.now();
            const diff = task.dueDate.getTime() - now;

            switch (filter) {
                case "due-today":
                    return diff <= 86400000;

                case "due-week":
                    return diff <= 86400000 * 7;

                case "due-month":
                    return diff <= 86400000 * 30;

                default:
                    return true;
            }
        })

        // SORTING
        .sort((a, b) => {
            switch (sort) {
                case "course":
                    return a.description.localeCompare(b.description);

                case "title":
                    return a.title.localeCompare(b.title);

                case "due-date":
                default:
                    return a.dueDate.getTime() - b.dueDate.getTime();
            }
        });

    async function getTasks() {
        if (loading || !token) return;
        const res = await fetch("/api/lms/assignments/todo", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        console.log(data);
        if (data.status === "ok") {
            setTasks(
                data.assignments.map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    description: a.courseName,
                    dueDate: new Date(a.dueAt),
                })),
            );
        }
    }
    function formatDistanceToNow(
        dueDate: any,
        arg1: { addSuffix: boolean },
    ): import("react").ReactNode {
        const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
        const diffMs = date.getTime() - Date.now();
        const diffDays = Math.round(diffMs / 86400000);
        const absDays = Math.abs(diffDays);

        let text: string;
        if (absDays < 1) {
            text = "today";
        } else if (absDays === 1) {
            text = diffDays > 0 ? "in 1 day" : "1 day ago";
        } else {
            text = diffDays > 0 ? `in ${absDays} days` : `${absDays} days ago`;
        }

        return arg1?.addSuffix ? text : text.replace(/^in\s/, "").replace(/\sago$/, "");
    }
    useEffect(() => {
        getTasks();
    }, [loading, token]);
    return (
        <div className="flex flex-col gap-2 rounded-xl bg-blue-50 p-3 shadow-sm ring-1 ring-blue-200 overflow-y-scroll overflow-x-clip">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">To-Do</span>
                <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 ring-1 ring-blue-200">
                    <Filter className="h-3.5 w-3.5 text-blue-600 shrink-0" />

                    <select
                        className="
            appearance-none
            bg-transparent
            text-xs
            font-medium
            text-blue-700
            outline-none
            cursor-pointer
            pr-4
        "
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">∞</option>
                        <option value="due-today">1d</option>
                        <option value="due-week">7d</option>
                        <option value="due-month">30d</option>
                    </select>
                </div>
                <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 ring-1 ring-blue-200">
                    <SortAsc className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <select
                        className="
            appearance-none
            bg-transparent
            text-xs
            font-medium
            text-blue-700
            outline-none
            cursor-pointer
            pr-4
        "
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="due-date">Due Date</option>
                        <option value="course">Course</option>
                        <option value="title">Title</option>
                    </select>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                    <span>Last updated</span>
                    <span>{format(new Date(), "p")}</span>
                </div>
            </div>

            {/* Task */}
            {processedTasks.map((task) => (
                <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-linear-to-r from-blue-200 to-blue-300 px-3 py-2"
                >
                    {/* Left content */}
                    <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold text-blue-900">{task.title}</span>

                        <span className="truncate text-xs text-blue-800">{task.description}</span>
                    </div>

                    {/* Due date */}
                    <div className="ml-3 shrink-0 text-right">
                        <span className="text-[11px] font-medium text-blue-700">
                            Due {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                        </span>

                        <div className="text-[10px] text-blue-600">{format(task.dueDate, "p")}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function B() {
    return <div></div>;
}

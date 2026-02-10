"use client";
import { useAuth } from "@/context/authContext";
import { db } from "@/lib/firebaseClient";
import { set } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateTask() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedAssignment, setSelectedAssignment] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");

    const createTask = async () => {
        console.log(
            JSON.stringify({
                task: {
                    taskName,
                    description,
                    assignments: [{ courseId: selectedCourse, assignmentId: selectedAssignment }],
                },
            }),
        );
        fetch("/api/tasks/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({
                task: {
                    taskName,
                    description,
                    assignments: [{ courseId: selectedCourse, assignmentId: selectedAssignment }],
                    files: [],
                },
            }),
        });
    };

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/signin");
            return;
        }

        const fetchAssignments = async () => {
            try {
                setFetching(true);
                const assignmentsRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(assignmentsRef);
                const data = docSnap.data()?.data.assignments;
                setSelectedAssignment(data ? Object.values(data)[0].id : "");
                setSelectedCourse(data ? Object.values(data)[0].courseId : "");
                setAssignments(data ? Object.values(data) : []);
            } catch (err) {
                console.error("Failed to fetch assignments:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchAssignments();
    }, [loading, user, router]);

    if (loading || fetching) return <div>Loading assignments...</div>;

    return (
        <div>
            <h1>Create a New Task</h1>
            <form>
                <label>
                    Task Name:
                    <input
                        type="text"
                        name="taskName"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Description:
                    <textarea
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>
                <br />
                <label>
                    Assignments:
                    <select
                        name="assignments"
                        value={selectedAssignment}
                        onChange={(e) => {
                            setSelectedAssignment(e.target.value);
                            setSelectedCourse(
                                e.target.options[e.target.selectedIndex].getAttribute(
                                    "data-course",
                                ) || "",
                            );
                        }}
                    >
                        {assignments.map((assignment) => (
                            <option
                                key={assignment.id}
                                value={assignment.id}
                                data-course={assignment.courseId}
                            >
                                {assignment.title}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="submit"
                    onClick={(e) => {
                        e.preventDefault();
                        createTask();
                    }}
                >
                    Create Task
                </button>
            </form>
        </div>
    );
}

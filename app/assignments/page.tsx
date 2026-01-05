"use client";

import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Assignments() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "notCompleted">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
        setAssignments(data ? Object.values(data) : []);
        console.log(data);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchAssignments();
  }, [user, loading, router]);

  if (loading || fetching) return <div>Loading assignments...</div>;
  if (assignments.length === 0) return <div>No assignments found.</div>;

  // Filter logic
  const filteredAssignments = assignments.filter((a) => {
    // Status filter
    if (statusFilter === "completed" && a.submissionState !== "submitted") return false;
    if (statusFilter === "notCompleted" && a.submissionState === "submitted") return false;

    // Subject filter
    if (subjectFilter !== "all" && a.courseName !== subjectFilter) return false;

    // Due date filter
    if ((dateFrom && new Date(a.dueAt) < new Date(dateFrom)) || !a.dueAt) return false;
    if (dateTo && new Date(a.dueAt) > new Date(dateTo)) return false;

    return true;
  });

  // Get unique subjects for filtering
  const subjects = Array.from(new Set(assignments.map((a) => a.courseName)));

  return (
    <ScrollArea className="h-[80vh] p-4">
      <h1 className="text-2xl font-bold mb-4">Assignments</h1>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        {/* Status */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="notCompleted">Not Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Subject */}
        <Select value={subjectFilter} onValueChange={(v) => setSubjectFilter(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Due date range */}
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
        />
      </div>

      {/* Assignment cards */}
      <div className="flex flex-wrap gap-4">
        {filteredAssignments.map((a) => (
          <Card key={a.id} className="flex-1 min-w-[250px] max-w-[300px]">
            <CardHeader>
              <CardTitle>{a.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Course:</strong> {a.courseName}
              </p>
              <p>
                <strong>Due:</strong> {a.dueAt || "N/A"}
              </p>
              <p>{a.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button asChild>
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    Open in Canvas
                  </a>
                </Button>
                <Button>Add to project</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

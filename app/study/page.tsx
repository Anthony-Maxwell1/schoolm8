"use client";

/**
 * /study — Study Suite
 *
 * Generates flashcards, practice quizzes, and summaries from the student's real
 * course material (a Canvas assignment, a whole course, or a free topic) via
 * Gemini. Flashcard decks can be saved and reviewed with spaced repetition.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
    BookOpenCheck,
    Sparkles,
    RotateCw,
    Save,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Copy,
    GraduationCap,
} from "lucide-react";
import {
    Button,
    TextInput,
    Select,
    Card,
    Badge,
    Spinner,
    EmptyState,
    Alert,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Progress,
} from "@/components/ui/components";
import { Markdown } from "@/components/ai/Markdown";
import { ConnectGeminiCTA } from "@/components/ai/ConnectGeminiCTA";
import { useAuth } from "@/context/authContext";
import type { Flashcard, QuizQuestion } from "@/lib/ai/study";
import type { DeckSummary, DueCard, Grade } from "@/lib/ai/decks";

type SourceType = "topic" | "assignment" | "course";
type Tab4 = "flashcards" | "quiz" | "summary" | "review";

interface Lite {
    id: string;
    title?: string;
    name?: string;
    courseName?: string;
}

const GRADES: {
    grade: Grade;
    label: string;
    variant: "danger" | "warning" | "info" | "success";
}[] = [
    { grade: "again", label: "Again", variant: "danger" },
    { grade: "hard", label: "Hard", variant: "warning" },
    { grade: "good", label: "Good", variant: "info" },
    { grade: "easy", label: "Easy", variant: "success" },
];

export default function StudyPage() {
    const { token, loading: authLoading } = useAuth();

    const [boot, setBoot] = useState(true);
    const [needsKey, setNeedsKey] = useState(false);
    const [keyInvalid, setKeyInvalid] = useState(false);

    const [tab, setTab] = useState<Tab4>("flashcards");

    // Source selection
    const [sourceType, setSourceType] = useState<SourceType>("topic");
    const [topic, setTopic] = useState("");
    const [assignmentId, setAssignmentId] = useState("");
    const [courseId, setCourseId] = useState("");
    const [assignments, setAssignments] = useState<Lite[]>([]);
    const [courses, setCourses] = useState<Lite[]>([]);
    const [count, setCount] = useState("10");

    const [generating, setGenerating] = useState(false);

    // Results
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [lastLabel, setLastLabel] = useState("");
    const [fcIndex, setFcIndex] = useState(0);
    const [fcFlipped, setFcFlipped] = useState(false);
    const [savingDeck, setSavingDeck] = useState(false);

    const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    const [summary, setSummary] = useState("");

    // Review
    const [decks, setDecks] = useState<DeckSummary[]>([]);
    const [due, setDue] = useState<DueCard[]>([]);
    const [reviewIdx, setReviewIdx] = useState(0);
    const [reviewFlipped, setReviewFlipped] = useState(false);

    const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const loadDecks = useCallback(async () => {
        if (!token) return;
        try {
            const [dRes, rRes] = await Promise.all([
                fetch("/api/ai/study/decks", { headers: authHeaders }),
                fetch("/api/ai/study/review", { headers: authHeaders }),
            ]);
            if (dRes.ok) setDecks((await dRes.json()).decks ?? []);
            if (rRes.ok) setDue((await rRes.json()).due ?? []);
        } catch {
            /* non-fatal */
        }
    }, [token, authHeaders]);

    useEffect(() => {
        if (authLoading || !token) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/ai/key", { headers: authHeaders });
                const data = await res.json();
                if (cancelled) return;
                if (!data.hasKey) setNeedsKey(true);
                else if (data.keyStatus === "invalid") setKeyInvalid(true);
            } catch {
                /* ignore */
            }
            // Load source options + decks.
            try {
                const [aRes, cRes] = await Promise.all([
                    fetch("/api/lms/assignments", { headers: authHeaders }),
                    fetch("/api/lms/courses", { headers: authHeaders }),
                ]);
                if (aRes.ok)
                    setAssignments(Object.values((await aRes.json()).assignments ?? {}) as Lite[]);
                if (cRes.ok) setCourses(Object.values((await cRes.json()).courses ?? {}) as Lite[]);
            } catch {
                /* ignore */
            }
            await loadDecks();
            if (!cancelled) setBoot(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [authLoading, token, authHeaders, loadDecks]);

    const sourcePayload = () => {
        if (sourceType === "topic") {
            if (!topic.trim()) throw new Error("Enter a topic first.");
            return { sourceType, topic: topic.trim() };
        }
        if (sourceType === "assignment") {
            if (!assignmentId) throw new Error("Pick an assignment first.");
            return { sourceType, sourceId: assignmentId };
        }
        if (!courseId) throw new Error("Pick a course first.");
        return { sourceType, sourceId: courseId };
    };

    const generate = async (kind: "flashcards" | "quiz" | "summary") => {
        if (!token || generating) return;
        let payload;
        try {
            payload = sourcePayload();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Pick a source");
            return;
        }
        setGenerating(true);
        try {
            const res = await fetch("/api/ai/study/generate", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    kind,
                    ...payload,
                    count: kind === "summary" ? undefined : parseInt(count, 10),
                }),
            });
            if (res.status === 409) {
                setNeedsKey(true);
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Generation failed");
            setLastLabel(data.label ?? "");
            if (kind === "flashcards") {
                setCards(data.cards ?? []);
                setFcIndex(0);
                setFcFlipped(false);
            } else if (kind === "quiz") {
                setQuiz(data.questions ?? []);
                setAnswers({});
                setQuizSubmitted(false);
            } else {
                setSummary(data.summary ?? "");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const saveDeck = async () => {
        if (!token || cards.length === 0) return;
        setSavingDeck(true);
        try {
            const res = await fetch("/api/ai/study/decks", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: lastLabel || "Flashcards",
                    sourceLabel: lastLabel,
                    cards: cards.map((c) => ({ front: c.front, back: c.back })),
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
            toast.success("Deck saved — review it in the Review tab.");
            await loadDecks();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSavingDeck(false);
        }
    };

    const deleteDeck = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`/api/ai/study/decks?id=${id}`, { method: "DELETE", headers: authHeaders });
            await loadDecks();
        } catch {
            toast.error("Could not delete deck");
        }
    };

    const gradeCurrent = async (grade: Grade) => {
        const item = due[reviewIdx];
        if (!item || !token) return;
        try {
            await fetch("/api/ai/study/review", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ deckId: item.deckId, cardId: item.card.id, grade }),
            });
        } catch {
            /* keep going even if persist hiccups */
        }
        setReviewFlipped(false);
        if (reviewIdx + 1 >= due.length) {
            toast.success("Review complete! 🎉");
            await loadDecks();
            setReviewIdx(0);
        } else {
            setReviewIdx((i) => i + 1);
        }
    };

    const quizScore = useMemo(() => {
        const mcq = quiz.filter((q) => q.type === "mcq");
        const correct = mcq.filter((q) => answers[q.id] === q.answer).length;
        return { correct, total: mcq.length };
    }, [quiz, answers]);

    // ── Gating ──────────────────────────────────────────────────────────────
    if (authLoading || boot) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-[var(--color-text-secondary)]">
                <Spinner size="lg" />
            </div>
        );
    }
    if (needsKey || keyInvalid) {
        return (
            <div className="min-h-screen bg-[var(--color-surface)] px-6 py-20">
                <div className="mx-auto max-w-md">
                    <ConnectGeminiCTA feature="the study suite" invalid={keyInvalid} />
                </div>
            </div>
        );
    }

    const card = cards[fcIndex];
    const reviewCard = due[reviewIdx];

    return (
        <div className="min-h-screen bg-[var(--color-surface)] px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Learn
                </span>
                <h1 className="font-[family-name:var(--font-display)] text-[42px] leading-[1.1] tracking-[-0.01em] text-[var(--color-text-primary)]">
                    Study Suite
                </h1>
                <p className="mt-3 text-[var(--color-text-secondary)]">
                    Turn your course material into flashcards, quizzes, and summaries — then review
                    with spaced repetition.
                </p>

                {/* Source picker */}
                <Card className="mt-8 p-4">
                    <div className="mb-3 flex flex-wrap gap-1">
                        {(["topic", "assignment", "course"] as SourceType[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSourceType(s)}
                                className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm capitalize transition-colors ${
                                    sourceType === s
                                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {sourceType === "topic" && (
                        <TextInput
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Photosynthesis, the French Revolution, quadratic equations…"
                            aria-label="Topic"
                        />
                    )}
                    {sourceType === "assignment" && (
                        <Select
                            value={assignmentId}
                            onChange={(e) => setAssignmentId(e.target.value)}
                            options={[
                                {
                                    value: "",
                                    label: assignments.length
                                        ? "Choose an assignment…"
                                        : "No assignments — sync Canvas",
                                },
                                ...assignments.map((a) => ({
                                    value: a.id,
                                    label: `${a.title ?? "Untitled"}${a.courseName ? ` · ${a.courseName}` : ""}`,
                                })),
                            ]}
                        />
                    )}
                    {sourceType === "course" && (
                        <Select
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            options={[
                                {
                                    value: "",
                                    label: courses.length
                                        ? "Choose a course…"
                                        : "No courses — sync Canvas",
                                },
                                ...courses.map((c) => ({
                                    value: c.id,
                                    label: c.name ?? "Untitled",
                                })),
                            ]}
                        />
                    )}
                </Card>

                {/* Tabs */}
                <div className="mt-8">
                    <Tabs value={tab} onChange={(id) => setTab(id as Tab4)} variant="underline">
                        <TabList>
                            <Tab id="flashcards">Flashcards</Tab>
                            <Tab id="quiz">Quiz</Tab>
                            <Tab id="summary">Summary</Tab>
                            <Tab id="review">Review{due.length ? ` (${due.length})` : ""}</Tab>
                        </TabList>

                        {/* Flashcards */}
                        <TabPanel id="flashcards">
                            <GenBar
                                label="flashcards"
                                count={count}
                                setCount={setCount}
                                generating={generating}
                                onGenerate={() => generate("flashcards")}
                            />
                            {cards.length === 0 ? (
                                <EmptyState
                                    icon={<Sparkles className="h-6 w-6" />}
                                    title="No flashcards yet"
                                    description="Pick a source above and generate a set."
                                />
                            ) : (
                                <div className="mt-4">
                                    <button
                                        onClick={() => setFcFlipped((f) => !f)}
                                        className="flex min-h-48 w-full flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center transition-colors hover:border-[var(--color-border-strong)]"
                                    >
                                        <span className="mb-2 text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                                            {fcFlipped ? "Answer" : "Question"} · tap to flip
                                        </span>
                                        <span className="text-lg text-[var(--color-text-primary)]">
                                            {fcFlipped ? card.back : card.front}
                                        </span>
                                    </button>
                                    <div className="mt-3 flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            leftIcon={<ChevronLeft className="h-4 w-4" />}
                                            disabled={fcIndex === 0}
                                            onClick={() => {
                                                setFcIndex((i) => Math.max(0, i - 1));
                                                setFcFlipped(false);
                                            }}
                                        >
                                            Prev
                                        </Button>
                                        <span className="text-sm text-[var(--color-text-tertiary)]">
                                            {fcIndex + 1} / {cards.length}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            rightIcon={<ChevronRight className="h-4 w-4" />}
                                            disabled={fcIndex >= cards.length - 1}
                                            onClick={() => {
                                                setFcIndex((i) =>
                                                    Math.min(cards.length - 1, i + 1),
                                                );
                                                setFcFlipped(false);
                                            }}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                    <div className="mt-4 flex justify-center">
                                        <Button
                                            variant="outline"
                                            loading={savingDeck}
                                            leftIcon={
                                                !savingDeck ? (
                                                    <Save className="h-4 w-4" />
                                                ) : undefined
                                            }
                                            onClick={saveDeck}
                                        >
                                            Save deck for review
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabPanel>

                        {/* Quiz */}
                        <TabPanel id="quiz">
                            <GenBar
                                label="quiz"
                                count={count}
                                setCount={setCount}
                                generating={generating}
                                onGenerate={() => generate("quiz")}
                            />
                            {quiz.length === 0 ? (
                                <EmptyState
                                    icon={<GraduationCap className="h-6 w-6" />}
                                    title="No quiz yet"
                                    description="Generate a practice quiz from your material."
                                />
                            ) : (
                                <div className="mt-4 space-y-5">
                                    {quizSubmitted && quizScore.total > 0 && (
                                        <Alert
                                            variant={
                                                quizScore.correct === quizScore.total
                                                    ? "success"
                                                    : "info"
                                            }
                                            title={`You scored ${quizScore.correct} / ${quizScore.total} on the multiple-choice questions`}
                                            description="Review the explanations below. Short-answer questions are for self-assessment."
                                        />
                                    )}
                                    {quiz.map((q, i) => {
                                        const picked = answers[q.id];
                                        const isCorrect = picked === q.answer;
                                        return (
                                            <div
                                                key={q.id}
                                                className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4"
                                            >
                                                <p className="mb-3 font-medium text-[var(--color-text-primary)]">
                                                    {i + 1}. {q.question}
                                                </p>
                                                {q.type === "mcq" && q.options ? (
                                                    <div className="space-y-1.5">
                                                        {q.options.map((opt) => {
                                                            const selected = picked === opt;
                                                            const showCorrect =
                                                                quizSubmitted && opt === q.answer;
                                                            const showWrong =
                                                                quizSubmitted &&
                                                                selected &&
                                                                opt !== q.answer;
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    disabled={quizSubmitted}
                                                                    onClick={() =>
                                                                        setAnswers((prev) => ({
                                                                            ...prev,
                                                                            [q.id]: opt,
                                                                        }))
                                                                    }
                                                                    className={`flex w-full items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors ${
                                                                        showCorrect
                                                                            ? "border-[var(--color-success)] bg-[var(--color-success-light)]"
                                                                            : showWrong
                                                                              ? "border-[var(--color-danger)] bg-[var(--color-danger-light)]"
                                                                              : selected
                                                                                ? "border-[var(--color-primary)] bg-[var(--color-accent-subtle)]"
                                                                                : "border-[var(--color-border-subtle)] hover:bg-[var(--color-muted)]"
                                                                    }`}
                                                                >
                                                                    {showCorrect && (
                                                                        <Check className="h-4 w-4 text-[var(--color-success)]" />
                                                                    )}
                                                                    {showWrong && (
                                                                        <X className="h-4 w-4 text-[var(--color-danger)]" />
                                                                    )}
                                                                    <span>{opt}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <TextInput
                                                        value={picked ?? ""}
                                                        disabled={quizSubmitted}
                                                        onChange={(e) =>
                                                            setAnswers((prev) => ({
                                                                ...prev,
                                                                [q.id]: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Type your answer…"
                                                    />
                                                )}
                                                {quizSubmitted && (
                                                    <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-muted)] p-3 text-sm">
                                                        {q.type === "mcq" ? (
                                                            <p className="mb-1 font-medium">
                                                                {isCorrect
                                                                    ? "Correct"
                                                                    : `Answer: ${q.answer}`}
                                                            </p>
                                                        ) : (
                                                            <p className="mb-1 font-medium">
                                                                Sample answer: {q.answer}
                                                            </p>
                                                        )}
                                                        <p className="text-[var(--color-text-secondary)]">
                                                            {q.explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {!quizSubmitted ? (
                                        <Button onClick={() => setQuizSubmitted(true)}>
                                            Submit answers
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            leftIcon={<RotateCw className="h-4 w-4" />}
                                            onClick={() => {
                                                setAnswers({});
                                                setQuizSubmitted(false);
                                            }}
                                        >
                                            Retry
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabPanel>

                        {/* Summary */}
                        <TabPanel id="summary">
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    A key-point study sheet generated from your material.
                                </p>
                                <Button
                                    loading={generating}
                                    leftIcon={
                                        !generating ? <Sparkles className="h-4 w-4" /> : undefined
                                    }
                                    onClick={() => generate("summary")}
                                >
                                    Generate summary
                                </Button>
                            </div>
                            {summary ? (
                                <Card className="mt-4">
                                    <div className="mb-2 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            leftIcon={<Copy className="h-4 w-4" />}
                                            onClick={() => {
                                                navigator.clipboard.writeText(summary);
                                                toast.success("Summary copied");
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <Markdown>{summary}</Markdown>
                                </Card>
                            ) : (
                                <div className="mt-4">
                                    <EmptyState
                                        icon={<BookOpenCheck className="h-6 w-6" />}
                                        title="No summary yet"
                                        description="Generate a summary of your selected material."
                                    />
                                </div>
                            )}
                        </TabPanel>

                        {/* Review */}
                        <TabPanel id="review">
                            {due.length > 0 && reviewCard ? (
                                <div className="mt-4">
                                    <Progress
                                        value={(reviewIdx / due.length) * 100}
                                        label={`Reviewing · ${reviewCard.deckTitle}`}
                                        className="mb-4"
                                    />
                                    <button
                                        onClick={() => setReviewFlipped((f) => !f)}
                                        className="flex min-h-48 w-full flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center transition-colors hover:border-[var(--color-border-strong)]"
                                    >
                                        <span className="mb-2 text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                                            {reviewFlipped ? "Answer" : "Question"} · tap to flip
                                        </span>
                                        <span className="text-lg text-[var(--color-text-primary)]">
                                            {reviewFlipped
                                                ? reviewCard.card.back
                                                : reviewCard.card.front}
                                        </span>
                                    </button>
                                    {reviewFlipped ? (
                                        <div className="mt-3 grid grid-cols-4 gap-2">
                                            {GRADES.map((g) => (
                                                <Button
                                                    key={g.grade}
                                                    variant="outline"
                                                    onClick={() => gradeCurrent(g.grade)}
                                                >
                                                    {g.label}
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-center text-sm text-[var(--color-text-tertiary)]">
                                            Flip the card, then rate how well you knew it.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <EmptyState
                                        icon={<Check className="h-6 w-6" />}
                                        title="Nothing due right now"
                                        description="Save a flashcard deck, then come back to review it on schedule."
                                    />
                                </div>
                            )}

                            {/* Saved decks */}
                            {decks.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                                        Your decks
                                    </h3>
                                    <div className="space-y-2">
                                        {decks.map((d) => (
                                            <div
                                                key={d.id}
                                                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                                                        {d.title}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-tertiary)]">
                                                        {d.cardCount} cards
                                                    </p>
                                                </div>
                                                {d.dueCount > 0 && (
                                                    <Badge variant="primary">
                                                        {d.dueCount} due
                                                    </Badge>
                                                )}
                                                <button
                                                    onClick={() => deleteDeck(d.id)}
                                                    aria-label="Delete deck"
                                                    className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)]"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabPanel>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function GenBar({
    label,
    count,
    setCount,
    generating,
    onGenerate,
}: {
    label: string;
    count: string;
    setCount: (v: string) => void;
    generating: boolean;
    onGenerate: () => void;
}) {
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-secondary)]">Number</span>
                <Select
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    options={["5", "8", "10", "15", "20"].map((n) => ({ value: n, label: n }))}
                    className="w-auto"
                />
            </div>
            <Button
                loading={generating}
                leftIcon={!generating ? <Sparkles className="h-4 w-4" /> : undefined}
                onClick={onGenerate}
            >
                Generate {label}
            </Button>
        </div>
    );
}

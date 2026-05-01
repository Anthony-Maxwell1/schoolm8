"use client";

import { useAuth } from "@/context/authContext";
import { redirect } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const steps = [
    "Preparing deletion...",
    "Deleting cloud data...",
    "Removing authentication...",
    "Removing local data...",
];

export default function FinalDelete() {
    const [finalConfirmed, setFinalConfirmed] = useState(false);
    const [step, setStep] = useState(0);
    const { user, loading, token } = useAuth();
    const abortedRef = useRef(false);
    const [cancelled, setCancelled] = useState(false);
    const queryParams = new URLSearchParams(window.location.search);
    const fromSignIn = queryParams.get("fromSignIn") === "true";

    const cancelDeletion = () => {
        abortedRef.current = true;

        // stop UI progression immediately
        setCancelled(true);
        setFinalConfirmed(false);
        setStep(0);

        // redirect to recovery flow
        redirect("/settings/account/delete/revert");
    };

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    useEffect(() => {
        if (!finalConfirmed || cancelled) return;
        if (!fromSignIn) {
            redirect(
                "/auth/signin?message=" +
                    encodeURIComponent("Please reauthenticate to authorize account deletion.") +
                    "&redirect=" +
                    encodeURIComponent("/settings/account/delete/final?fromSignIn=true"),
            );
        }

        abortedRef.current = false;

        const run = async () => {
            await wait(2000);
            if (abortedRef.current) return;
            setStep(1);
            await fetch("/api/auth/deleteAccount", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            await wait(3000);
            if (abortedRef.current) return;
            setStep(2);

            await user?.delete();

            await wait(3000);
            if (abortedRef.current) return;
            setStep(3);
            // 1. Clear Local and Session Storage
            localStorage.clear();
            sessionStorage.clear();

            // 2. Clear Cookies
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // 3. Clear IndexedDB
            indexedDB.databases().then((dbs) => {
                dbs.forEach((db) => indexedDB.deleteDatabase(db.name!));
            });

            // 4. Clear Cache API
            caches.keys().then((names) => {
                for (let name of names) caches.delete(name);
            });
        };

        run();

        return () => {
            abortedRef.current = true;
        };
    }, [finalConfirmed, cancelled]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading...
            </div>
        );
    }

    if (!finalConfirmed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Delete your account?</h1>

                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        This action is permanent. All your data, settings, and activity will be
                        removed and cannot be recovered.
                    </p>

                    <button
                        onClick={() => setFinalConfirmed(true)}
                        className="
                            mt-6 w-full rounded-lg
                            bg-red-500 px-4 py-2
                            text-white font-medium
                            transition hover:bg-red-600
                        "
                    >
                        I understand, delete my account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-md rounded-2xl bg-gray-800 shadow-2xl p-6">
                {/* HEADER */}
                <h1 className="text-xl font-semibold text-red-400">Deleting account</h1>

                <p className="mt-1 text-sm text-gray-400">Please do not close this page</p>

                {/* STEP LIST */}
                <div className="mt-6 space-y-3">
                    {steps.map((label, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 text-sm transition ${
                                i <= step ? "text-white" : "text-gray-500"
                            }`}
                        >
                            <div
                                className={`h-2 w-2 rounded-full ${
                                    i < step
                                        ? "bg-green-400"
                                        : i === step
                                          ? "bg-yellow-400 animate-pulse"
                                          : "bg-gray-600"
                                }`}
                            />
                            <span>{label}</span>
                        </div>
                    ))}
                    {step === 1 && (
                        <button
                            onClick={cancelDeletion}
                            className="mt-4 w-full rounded-lg bg-gray-600 px-4 py-2 text-white font-medium transition hover:bg-gray-700"
                        >
                            Cancel Deletion
                        </button>
                    )}
                    {step >= 2 && (
                        <div className="mt-4 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-green-300 text-sm">
                            This action is now irreversible.
                        </div>
                    )}
                </div>

                {/* FINAL STATE */}
                {step >= 3 && (
                    <div className="mt-6 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-green-300 text-sm">
                        Account successfully deleted.
                    </div>
                )}
            </div>
        </div>
    );
}

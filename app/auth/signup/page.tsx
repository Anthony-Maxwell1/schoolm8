"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const createFirestoreDoc = async (uid: string, name: string, email: string) => {
        await fetch("/api/auth/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, name, email }),
        });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await createFirestoreDoc(userCredential.user.uid, name, email);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            await createFirestoreDoc(user.uid, user.displayName || "", user.email || "");
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-2xl ring-1 ring-black/10 dark:bg-slate-900/80 dark:ring-white/5">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                            Sign Up
                        </h1>
                    </div>
                    <div className="flex flex-col gap-4">
                        {error && (
                            <div
                                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                                role="alert"
                            >
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <form className="flex flex-col gap-4" onSubmit={handleSignup}>
                            <div className="flex flex-col gap-1">
                                <label>Name</label>
                                <input
                                    className="border border-gray-300 rounded-md p-2"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label>Email</label>
                                <input
                                    className="border border-gray-300 rounded-md p-2"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label>Password</label>
                                <input
                                    className="border border-gray-300 rounded-md p-2"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            >
                                {loading ? "Signing Up..." : "Sign Up"}
                            </button>
                        </form>
                        <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign Up with Google"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

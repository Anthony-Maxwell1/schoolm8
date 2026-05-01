"use client";
import { useAuth } from "@/context/authContext";
import { redirect } from "next/navigation";
import { useState } from "react";
export default function DeleteAccount() {
    const [step, setStep] = useState(0);
    const [textInput, setTextInput] = useState("");
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">You must be signed in to delete your account.</p>
            </div>
        );
    }
    return (
        <div
            className={`min-h-screen flex items-center justify-center px-6 ${step === 2 ? "bg-red-800" : "bg-white"} transition-colors duration-1000`}
        >
            {step === 0 && (
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold text-red-600">
                        Are you sure you want to delete your account?
                    </h1>
                    <p className="mt-4 text-gray-700">
                        This action is irreversible. All your data will be permanently deleted.
                    </p>
                    <button
                        className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium transition"
                        onClick={() => setStep(1)}
                    >
                        Yes, delete my account
                    </button>
                </div>
            )}
            {step === 1 && (
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold text-red-600">Second Confirmation</h1>
                    <p className="mt-4 text-gray-700">
                        Type "DELETE" in the box below to confirm that you want to permanently
                        delete your account and all associated data.
                    </p>
                    <input
                        type="text"
                        className="mt-4 px-3 py-2 border rounded w-full"
                        placeholder='Type "DELETE" here'
                        onChange={(e) => {
                            setTextInput(e.target.value);
                        }}
                    />
                    <button
                        className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                            setStep(2);
                        }}
                        disabled={textInput !== "DELETE"}
                    >
                        Confirm Delete
                    </button>
                </div>
            )}
            {step === 2 && (
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white">Final Confirmation</h1>
                    <p className="mt-4 text-white">
                        Final step, type your email{" "}
                        <span className="font-mono bg-white/20 px-1 rounded">{user.email}</span> to
                        confirm deletion of your account and all associated data.
                    </p>
                    <input
                        type="text"
                        className="mt-4 px-3 py-2 border rounded w-full"
                        placeholder={`Type your email (${user.email}) here`}
                        onChange={(e) => {
                            setTextInput(e.target.value);
                        }}
                    />
                    <button
                        className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                            localStorage.setItem("deleteAccountConfirmed", "true");
                            redirect("/settings/account/delete/final");
                        }}
                        disabled={textInput !== user.email}
                    >
                        Permanently Delete My Account
                    </button>
                    <p className="mt-4 text-gray-300 text-sm">
                        This is your last chance to back out. If you click the button above, your
                        account and all associated data will be permanently deleted and cannot be
                        recovered. Please make sure you have downloaded any important data before
                        proceeding.
                    </p>
                </div>
            )}
            <div className="absolute top-4 right-4">
                <button
                    className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition"
                    onClick={() => setStep(0)}
                >
                    Back
                </button>
            </div>
        </div>
    );
}

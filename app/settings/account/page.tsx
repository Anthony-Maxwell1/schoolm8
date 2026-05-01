"use client";
import { useAuth } from "@/context/authContext";

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function Settings() {
    const { signOut } = useAuth();
    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundAttachment: "fixed" }}
        >
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm" />
            {/* Main container */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 gap-8">
                {/* LEFT PANEL: step list */}
                <div className="w-full max-w-70 rounded-2xl ring-1 ring-white/50 bg-white/30 backdrop-blur-lg overflow-hidden flex flex-col shadow-xl">
                    <button
                        className="text-left w-full p-3 transition text-red-200 hover:bg-black/5 cursor-pointer"
                        onClick={signOut}
                    >
                        Log Out
                    </button>
                    <button className="text-left w-full p-3 transition text-blue-300 hover:bg-black/5 cursor-pointer">
                        Change email
                    </button>
                    <a
                        className="text-left w-full p-3 transition text-red-700 hover:bg-black/5 cursor-pointer"
                        href="/settings/account/delete"
                    >
                        Delete account
                    </a>
                </div>
            </div>
        </div>
    );
}

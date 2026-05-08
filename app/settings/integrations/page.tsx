"use client";
import { useAuth } from "@/context/authContext";
import { SiCanvas, SiGoogleclassroom } from "@icons-pack/react-simple-icons";
import { Table } from "lucide-react";
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
                <div className="w-full max-w-80 rounded-2xl ring-1 ring-white/50 bg-white/30 backdrop-blur-lg overflow-hidden flex flex-col shadow-xl">
                    <details className="bg-white/10 m-4 rounded-xl overflow-hidden">
                        <summary className="cursor-pointer text-center w-full bg-blue-500 text-white py-4 px-4">
                            Learning Management System
                        </summary>
                        <button
                            className="w-full p-3 text-left text-white hover:bg-black/5 cursor-pointer flex items-center gap-2 transition"
                            onClick={signOut}
                        >
                            <SiCanvas />
                            <span>Canvas</span>
                        </button>
                        <button
                            className="w-full p-3 text-left text-white hover:bg-black/5 cursor-pointer flex items-center gap-2 transition"
                            onClick={signOut}
                        >
                            <SiGoogleclassroom />
                            <span>Google Classroom</span>
                        </button>
                    </details>
                    <details className="bg-white/10 m-4 rounded-xl overflow-hidden">
                        <summary className="cursor-pointer text-center w-full bg-blue-500 text-white py-4 px-4">
                            Timetable
                        </summary>
                        <button
                            className="w-full p-3 text-left text-white hover:bg-black/5 cursor-pointer flex items-center gap-2 transition"
                            onClick={signOut}
                        >
                            <img
                                src="https://edumate.com.au/favicon.ico"
                                alt="Website Favicon"
                                className="w-7 h-7"
                                style={{
                                    filter: "invert(100%) sepia(100%) grayscale(100%) brightness(150%)",
                                }}
                            />
                            <span>Edumate</span>
                        </button>
                        <button
                            className="w-full p-3 text-left text-white hover:bg-black/5 cursor-pointer flex items-center gap-2 transition"
                            onClick={signOut}
                        >
                            <Table />
                            <span>Generic</span>
                        </button>
                    </details>
                </div>
            </div>
        </div>
    );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import image0001 from "@/public/images/onboarding/0001.png";
import image0002 from "@/public/images/onboarding/0002.png";
import { useAuth } from "@/context/authContext";

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function Onboarding() {
    const { user, token, loading } = useAuth();

    const [step, setStep] = useState(0);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [lms, setLms] = useState("");
    const [timetable, setTimetable] = useState("");

    // LMS configuration
    // | -> Canvas
    const [canvasBaseUrl, setCanvasBaseUrl] = useState("");
    const [canvasAccessToken, setCanvasAccessToken] = useState("");
    const [canvasConnected, setCanvasConnected] = useState(false);

    // Method for linking timetable, e.g. ical url, file upload, third party etc.
    const [timetableMethod, setTimetableMethod] = useState("");

    // Timetable configuration
    // | -> Generic
    const [genericConnected, setGenericConnected] = useState(false);
    // | | -> iCal URL
    const [icalUrl, setIcalUrl] = useState("");
    const [icalUsername, setIcalUsername] = useState("");
    const [icalPassword, setIcalPassword] = useState("");
    // | | -> iCal File Upload
    const [icalData, setIcalData] = useState("");

    const steps = [
        { title: "Showcase features" },
        { title: "Disclaimer" },
        { title: "Link your LMS" },
        { title: "Link your timetable" },
        { title: "Pick a starting theme" },
        { title: "Pick a starting layout" },
        { title: "Learn more" },
    ];

    const carouselItems = [
        {
            image: "https://picsum.photos/600/400", // unique URLs, remove query params
            title: "All your tools in one portal",
            description:
                "Finally, we don't have to put up with schools putting things in 10 different places at once.",
        },
        {
            image: "https://picsum.photos/601/400",
            title: "Pick the layout that works for you",
            description: "Efficiency? Aesthetics? Why not both? Whatever floats your boat.",
        },
        {
            image: "https://picsum.photos/602/400",
            title: "Themes that look stunning",
            description:
                "It's like having a personal interior designer for your digital study space. Who doesn't want that?",
        },
        {
            image: "https://picsum.photos/603/400",
            title: "Customization at its best",
            description:
                "Neat freak? Customize every pixel to your liking. It's your portal, make it yours.",
        },
        {
            image: "https://picsum.photos/604/400",
            title: "AI at school? But LEGAL?",
            description:
                "AI that adapts to you, building your study plans, organising your notes, and even helping you with homework (when it's allowed to). It's like having a mentor, that never leaves your side.",
        },
    ];

    const nextCarousel = () => {
        setCarouselIndex((i) => (i + 1) % carouselItems.length);
    };

    const prevCarousel = () => {
        setCarouselIndex((i) => (i === 0 ? carouselItems.length - 1 : i - 1));
    };

    const goNextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
    const goPrevStep = () => setStep((s) => Math.max(s - 1, 0));

    const setupCanvas = async () => {
        if (!canvasBaseUrl || !canvasAccessToken) {
            alert("Please enter both the base URL and access token.");
            return;
        }

        try {
            const response = await fetch("/api/canvas/connect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    baseUrl: canvasBaseUrl,
                    token: canvasAccessToken,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to connect to Canvas");
            }
            setCanvasConnected(true);
        } catch (err) {
            console.error("Error connecting to Canvas:", err);
            alert("Failed to connect to Canvas. Please check the console for details.");
        }
    };

    const connectGeneric = async () => {
        if (timetableMethod === "ical-url") {
            if (!icalUrl || !icalUsername || !icalPassword) {
                alert("Please enter the iCal URL, username, and password.");
                return;
            }
            try {
                const response = await fetch("/api/timetable/setup/ical", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        url: icalUrl,
                        username: icalUsername,
                        password: icalPassword,
                    }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to connect to iCal");
                }
                setGenericConnected(true);
            } catch (err) {
                console.error("Error connecting to timetable:", err);
                alert("Failed to connect to timetable. Please check the console for details.");
            }
        } else if (timetableMethod === "ical-file") {
            const result = await fetch("/api/timetable/setup/ical-file", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: icalData,
                }),
            });
            if (!result.ok) {
                const errorData = await result.json();
                console.error("Error connecting to timetable:", errorData);
                alert("Failed to connect to timetable. Please check the console for details.");
                return;
            }
            setGenericConnected(true);
        }
    };

    const setupGoogleClassroom = async () => {
        try {
            const response = await fetch("/api/auth/universalState", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ scopeGroup: "classroom" }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate state");
            }
            const data = await response.json();
            window.location.href = `/api/auth/google/auth?state=${data.state}&scope=classroom`;
        } catch (err) {
            console.error("Error setting up Google Classroom:", err);
            alert("Failed to set up Google Classroom. Please check the console for details.");
        }
    };

    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundAttachment: "fixed" }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm" />

            {/* Main container */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 gap-8">
                {/* LEFT PANEL: step list */}
                <div className="w-full max-w-[280px] rounded-2xl bg-white/90 overflow-hidden flex flex-col shadow-xl">
                    {steps.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={`text-left w-full p-3 transition ${
                                i === step
                                    ? "border-l-4 border-l-green-600 bg-white font-semibold"
                                    : "hover:bg-black/5"
                            }`}
                        >
                            Step {i + 1}: {s.title}
                        </button>
                    ))}
                </div>

                {/* RIGHT PANEL: step content */}
                <div className="w-full max-w-2xl rounded-3xl bg-white/90 p-8 shadow-2xl ring-1 ring-black/10 backdrop-blur-md">
                    {/* Step 1: Carousel */}
                    {step === 0 && (
                        <div>
                            <div className="relative w-full h-[300px] rounded-2xl overflow-hidden mb-6">
                                <Image
                                    src={carouselItems[carouselIndex].image}
                                    alt={carouselItems[carouselIndex].title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {carouselItems[carouselIndex].title}
                                </h2>
                                <p className="text-slate-600">
                                    {carouselItems[carouselIndex].description}
                                </p>
                            </div>

                            {/* Carousel controls */}
                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={prevCarousel}
                                    className="px-4 py-2 bg-black/10 rounded-lg hover:bg-black/20"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={nextCarousel}
                                    className="px-4 py-2 bg-black/10 rounded-lg hover:bg-black/20"
                                >
                                    Next
                                </button>
                            </div>

                            {/* Dots */}
                            <div className="flex justify-center gap-2 mt-4">
                                {carouselItems.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 w-2 rounded-full transition ${
                                            i === carouselIndex
                                                ? "bg-green-600 w-5"
                                                : "bg-slate-300"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Disclaimer */}
                    {step === 1 && (
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-semibold text-slate-900">Disclaimer</h2>
                            <p className="text-slate-600">
                                Schoolm8 is not affiliated with any school or educational
                                institution. We are an independent platform created to help students
                                organize their academic lives. All trademarks and logos belong to
                                their respective owners.
                            </p>
                        </div>
                    )}

                    {/* Steps 3+ : custom HTML placeholder */}
                    {step === 2 && (
                        <div className="text-center space-y-4">
                            <h2 className="text-xl font-semibold text-slate-900">Add your LMS!</h2>
                            <p>Add your Learning Management System.</p>
                            <p>Pick your LMS from the list below.</p>
                            <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg mt-4">
                                <p>
                                    Don't see your LMS? Don't worry, you can still use Schoolm8! We
                                    are working on adding support for more LMS platforms, but in the
                                    meantime you can still use all the other features of Schoolm8
                                    without linking your LMS.
                                </p>
                            </div>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                value={lms}
                                onChange={(e) => setLms(e.target.value)}
                            >
                                <option value="">Select your LMS</option>
                                <option value="canvas">Canvas</option>
                                <option value="moodle" disabled>
                                    Moodle
                                </option>
                                <option value="blackboard" disabled>
                                    Blackboard
                                </option>
                                <option value="google-classroom">Google Classroom</option>
                            </select>
                            {lms === "canvas" &&
                                (canvasConnected ? (
                                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                        <p>Canvas connected successfully!</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                        <p>We need three things to set up your account.</p>
                                        <label className="block mb-2 font-medium">Base URL</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-green-400 rounded-lg"
                                            placeholder="Enter your Canvas base URL"
                                            value={canvasBaseUrl}
                                            onChange={(e) => setCanvasBaseUrl(e.target.value)}
                                        />
                                        <p>Your base url is the url before the first /.</p>
                                        <Image
                                            src={image0001}
                                            alt="Canvas base URL example"
                                            className="my-4 rounded-lg"
                                        />
                                        <label className="block mb-2 font-medium">
                                            Access Token
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-green-400 rounded-lg"
                                            placeholder="Enter your Canvas access token"
                                            value={canvasAccessToken}
                                            onChange={(e) => setCanvasAccessToken(e.target.value)}
                                        />
                                        <p>
                                            You can generate an access token in your Canvas account
                                            settings.
                                        </p>
                                        <Image
                                            src={image0002}
                                            alt="Canvas access token example"
                                            className="my-4 rounded-lg"
                                        />
                                        <p>
                                            Scroll down to Approved Integrations, and click "New
                                            Access Token". Purpose can be anything, e.g. "schoolm8",
                                            and you can set expiration date and time for as far out
                                            as you want us to link canvas for.
                                        </p>
                                        <button
                                            className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                                            onClick={setupCanvas}
                                        >
                                            Connect
                                        </button>
                                    </div>
                                ))}
                            {lms && lms == "google-classroom" && (
                                <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg mt-4">
                                    <p>
                                        Click this button to proceed with setting up Google
                                        Classroom. You will be redirected to Google's OAuth page,
                                        where you can log in and grant permissions. After that,
                                        you'll be redirected back here to finish the setup.
                                    </p>
                                    <button
                                        className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                                        onClick={setupGoogleClassroom}
                                    >
                                        Connect Google Classroom
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {step === 3 && (
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Link your timetable
                            </h2>
                            <p>
                                Link your timetable management system, to get views of your
                                schedule, even more personalised study guides and info, as well as
                                an api for apps on your phone, watch or anything else!
                            </p>
                            <p>
                                Pick your timetable software from the list below. If you don't see
                                yours, pick "Generic" and we'll provide you with all the options to
                                set it up.
                            </p>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg"
                                value={timetable}
                                onChange={(e) => setTimetable(e.target.value)}
                            >
                                <option value="">Select your Timetable</option>
                                <option value="edumate">Edumate</option>
                                <option value="compass">Compass</option>
                                <option value="engage">Engage</option>
                                <option value="edval">Edval</option>
                                <option value="physical">Physical/unable to access online</option>
                                <option value="generic">Generic</option>
                            </select>
                            {timetable === "generic" &&
                                (genericConnected ? (
                                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                        <p>Timetable connected successfully!</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                        <p>There are various methods to link your timetable.</p>
                                        <p>
                                            <b>iCal Url (Recommended)</b>: If your timetable
                                            supports iCal, you can attach it here. This syncs live,
                                            and updates are recieved immediately.
                                        </p>
                                        <p>
                                            <b>iCal File Upload (Not recommended)</b>: You can
                                            upload an iCal file directly. This method does not sync
                                            live, and updates will not be received automatically.
                                            Room changes and events will not be recieved, as it is
                                            static and a frozen snapshot of the timetable at the
                                            time you downloaded it.
                                        </p>
                                        <p>
                                            <b>Via 3rd party (Recommended-ish)</b>: If your
                                            timetable software supporst syncing to apps like Google
                                            calendar, you can use that as a bridge to Schoolm8.
                                            Depending on the setup, it should sync live.
                                        </p>
                                        <select
                                            className="w-full p-2 border border-green-400 rounded-lg mt-4"
                                            value={timetableMethod}
                                            onChange={(e) => setTimetableMethod(e.target.value)}
                                        >
                                            <option value="">Select your linking method</option>
                                            <option value="ical-url">iCal URL</option>
                                            <option value="ical-file">iCal File Upload</option>
                                            <option value="third-party">
                                                Via 3rd party (e.g. Google Calendar)
                                            </option>
                                        </select>
                                        {timetableMethod === "ical-url" && (
                                            <div className="mt-4">
                                                <label className="block mb-2 font-medium">
                                                    iCal URL
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border border-green-400 rounded-lg"
                                                    placeholder="Enter your timetable's iCal URL"
                                                    value={icalUrl}
                                                    onChange={(e) => setIcalUrl(e.target.value)}
                                                />
                                                <p className="mt-2 text-sm text-green-700">
                                                    You can usually find the iCal URL in your
                                                    timetable software's settings or sharing
                                                    options.
                                                </p>

                                                <label className="block mt-4 mb-2 font-medium">
                                                    Username
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border border-green-400 rounded-lg"
                                                    placeholder="Enter your username"
                                                    value={icalUsername}
                                                    onChange={(e) =>
                                                        setIcalUsername(e.target.value)
                                                    }
                                                />
                                                <label className="block mt-4 mb-2 font-medium">
                                                    Password
                                                </label>
                                                <input
                                                    type="password"
                                                    className="w-full p-2 border border-green-400 rounded-lg"
                                                    placeholder="Enter your password"
                                                    value={icalPassword}
                                                    onChange={(e) =>
                                                        setIcalPassword(e.target.value)
                                                    }
                                                />
                                                <button
                                                    className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 mt-4"
                                                    onClick={connectGeneric}
                                                >
                                                    Connect
                                                </button>
                                            </div>
                                        )}
                                        {timetableMethod === "ical-file" && (
                                            <div className="mt-4">
                                                <p>
                                                    Please upload your timetable in iCal format.
                                                    This is a static snapshot and will not sync
                                                    live, but it will allow us to pull your schedule
                                                    and events.
                                                </p>
                                                <input
                                                    type="file"
                                                    accept=".ics"
                                                    className="w-full p-2 border border-green-400 rounded-lg mt-4"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                setIcalData(
                                                                    event.target?.result as string,
                                                                );
                                                            };
                                                            reader.readAsText(file);
                                                            connectGeneric();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={goPrevStep}
                            disabled={step === 0}
                            className="px-4 py-2 rounded-lg bg-black/10 hover:bg-black/20 disabled:opacity-40"
                        >
                            Back
                        </button>
                        <button
                            onClick={() =>
                                step < steps.length - 1
                                    ? goNextStep()
                                    : alert("Onboarding finished!")
                            }
                            className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                        >
                            {step === steps.length - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

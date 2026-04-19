"use client";
import React, { useState } from "react";

export const Stepper = ({
    completedIcon = true,
    children,
}: {
    completedIcon: boolean;
    children: React.ReactNode;
}) => {
    const steps = React.Children.toArray(children) as React.ReactElement<{
        title: string;
        children: React.ReactNode;
    }>[];
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="flex w-full max-w-full overflow-hidden rounded-2xl ring-1 ring-white/20 bg-white/10 backdrop-blur-lg shadow-xl">
            {" "}
            {/* Left panel: step list */}
            <div className="flex w-56 flex-col gap-1 border-r border-white/20 p-3">
                {steps.map((step, i) => {
                    const isActive = i === activeIndex;
                    const isCompleted = i < activeIndex && completedIcon; // Show completed icon only if the step is completed and completedIcon is true
                    return (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150
                                ${isActive ? "bg-white/25 shadow-sm" : "hover:bg-white/10"}`}
                        >
                            {/* Step number bubble */}
                            <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
                                ${isActive ? "bg-white text-black" : isCompleted ? "bg-white/40 text-white" : "bg-white/15 text-white/60"}`}
                            >
                                {isCompleted ? "✓" : i + 1}
                            </span>
                            <span
                                className={`text-sm font-medium truncate transition-colors
                                ${isActive ? "text-white" : "text-white/60"}`}
                            >
                                {step.props.title}
                            </span>
                        </button>
                    );
                })}
            </div>
            {/* Right panel: active step content, scrollable */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6">
                {/* Step header */}
                <div className="mb-4 relative flex items-center">
                    {/* bubble */}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white">
                        {activeIndex + 1}
                    </span>

                    {/* centered title */}
                    <h2 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold text-white">
                        {steps[activeIndex]?.props.title}
                    </h2>
                </div>

                {/* Step content */}
                <div className="text-white/80">{steps[activeIndex]?.props.children}</div>

                {/* Prev / Next navigation */}
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                        disabled={activeIndex === 0}
                        className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={() => setActiveIndex((i) => Math.min(steps.length - 1, i + 1))}
                        disabled={activeIndex === steps.length - 1}
                        className="rounded-xl bg-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/35 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Step = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="step-item">
        <h3>{title}</h3>
        <div className="step-content">{children}</div>
    </div>
);

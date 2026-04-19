"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
    label: string;
    value: string;
};
export default function AnimatedSwitcher({
    options,
    value,
    onChange,
}: {
    options: Option[];
    value?: string;
    onChange?: (value: string) => void;
}) {
    const [indicatorStyle, setIndicatorStyle] = useState({
        left: 0,
        width: 0,
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // move indicator when value changes
    useEffect(() => {
        const el = buttonRefs.current[value ?? options[0].value];
        const container = containerRef.current;

        if (!el || !container) return;

        const containerRect = container.getBoundingClientRect();
        const rect = el.getBoundingClientRect();

        setIndicatorStyle({
            left: rect.left - containerRect.left,
            width: rect.width,
        });
    }, [value]);

    // external effect hook (your requirement)
    useEffect(() => {
        console.log("Selected:", value);
        // do whatever you want here
    }, [value]);

    return (
        <div
            ref={containerRef}
            className="relative flex w-fit rounded-xl bg-white/10 backdrop-blur-lg p-1"
        >
            {/* sliding highlight */}
            <div
                className="absolute top-1 bottom-1 rounded-lg bg-white/20 transition-all duration-300 ease-out"
                style={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                }}
            />

            {options.map((opt) => {
                const active = value === opt.value;

                return (
                    <button
                        key={opt.value}
                        ref={(el) => {
                            buttonRefs.current[opt.value] = el;
                        }}
                        onClick={() => onChange?.(opt.value)}
                        className={`relative z-10 px-4 py-1 text-sm transition-colors ${
                            active ? "text-white" : "text-white/60"
                        }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

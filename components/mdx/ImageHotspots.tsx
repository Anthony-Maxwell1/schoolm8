"use client";

import { useState } from "react";

type Hotspot = {
    id: string;
    x: number; // % left
    y: number; // % top
    width: number; // % width
    height: number; // % height
    label: string;
    title: string;
    content: string;
};

export function ImageHotspots({
    src,
    alt,
    hotspots,
}: {
    src: string;
    alt?: string;
    hotspots: Hotspot[];
}) {
    const [active, setActive] = useState<string | null>(null);

    return (
        <div className="relative w-full rounded-xl border border-white/10">
            {/* image (clipped only for image, NOT overlays) */}
            <div className="overflow-hidden rounded-xl">
                <img src={src} alt={alt ?? ""} className="w-full block" />
            </div>

            {/* overlay layer */}
            <div className="absolute inset-0">
                {hotspots.map((spot) => {
                    const isActive = active === spot.id;

                    return (
                        <div key={spot.id}>
                            {/* YELLOW HIGHLIGHT BOX */}
                            <div
                                className="absolute bg-yellow-400/20 border border-yellow-300/40 rounded-md transition-opacity duration-150"
                                style={{
                                    left: `${spot.x}%`,
                                    top: `${spot.y}%`,
                                    width: `${spot.width}%`,
                                    height: `${spot.height}%`,
                                    opacity: isActive ? 1 : 0.6,
                                }}
                                onMouseEnter={() => setActive(spot.id)}
                                onMouseLeave={() => setActive(null)}
                            />

                            {/* GREEN LABEL DOT */}
                            <button
                                className="absolute flex items-center gap-2"
                                style={{
                                    left: `${spot.x + spot.width / 2}%`,
                                    top: `${spot.y + spot.height / 2}%`,
                                    transform: "translate(-50%, -50%)",
                                }}
                                onMouseEnter={() => setActive(spot.id)}
                                onMouseLeave={() => setActive(null)}
                                onClick={() => setActive(isActive ? null : spot.id)}
                            >
                                {/* green circle */}
                                <div className="h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-black/40 shadow-md" />

                                {/* label */}
                                <span className="text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur">
                                    {spot.label}
                                </span>
                            </button>

                            {/* TOOLTIP */}
                            {isActive && (
                                <div
                                    className="absolute z-50 max-w-xs rounded-xl bg-black/80 text-white text-sm p-3 shadow-xl backdrop-blur-md"
                                    style={{
                                        left: `${spot.x + spot.width}%`,
                                        top: `${spot.y}%`,
                                        transform: "translate(10px, -20px)",
                                    }}
                                >
                                    <div className="font-semibold mb-1">{spot.title}</div>
                                    <div className="text-white/70 text-xs">{spot.content}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

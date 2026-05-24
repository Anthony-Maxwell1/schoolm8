"use client";

import { useEffect, useMemo, useState } from "react";

type Coordinates = { lat: number; lng: number; name?: string };

type WeatherResponse = {
    current: {
        time: string;
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        weather_code: number;
        is_day: number;
    };
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
    };
};

const weatherMap: Record<
    number,
    {
        label: string;
        icon: string;
        theme: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "foggy";
    }
> = {
    0: { label: "Clear sky", icon: "☀️", theme: "sunny" },
    1: { label: "Mainly clear", icon: "🌤️", theme: "sunny" },
    2: { label: "Partly cloudy", icon: "⛅", theme: "cloudy" },
    3: { label: "Overcast", icon: "☁️", theme: "cloudy" },
    45: { label: "Fog", icon: "🌫️", theme: "foggy" },
    48: { label: "Depositing rime fog", icon: "🌫️", theme: "foggy" },
    51: { label: "Light drizzle", icon: "🌦️", theme: "rainy" },
    53: { label: "Drizzle", icon: "🌦️", theme: "rainy" },
    55: { label: "Dense drizzle", icon: "🌧️", theme: "rainy" },
    56: { label: "Freezing drizzle", icon: "🌧️", theme: "rainy" },
    57: { label: "Dense freezing drizzle", icon: "🌧️", theme: "rainy" },
    61: { label: "Slight rain", icon: "🌦️", theme: "rainy" },
    63: { label: "Rain", icon: "🌧️", theme: "rainy" },
    65: { label: "Heavy rain", icon: "🌧️", theme: "rainy" },
    66: { label: "Freezing rain", icon: "🌧️", theme: "rainy" },
    67: { label: "Heavy freezing rain", icon: "🌧️", theme: "rainy" },
    71: { label: "Slight snow", icon: "🌨️", theme: "snowy" },
    73: { label: "Snow", icon: "❄️", theme: "snowy" },
    75: { label: "Heavy snow", icon: "❄️", theme: "snowy" },
    77: { label: "Snow grains", icon: "🌨️", theme: "snowy" },
    80: { label: "Rain showers", icon: "🌦️", theme: "rainy" },
    81: { label: "Rain showers", icon: "🌧️", theme: "rainy" },
    82: { label: "Violent showers", icon: "⛈️", theme: "stormy" },
    85: { label: "Snow showers", icon: "🌨️", theme: "snowy" },
    86: { label: "Heavy snow showers", icon: "❄️", theme: "snowy" },
    95: { label: "Thunderstorm", icon: "⛈️", theme: "stormy" },
    96: { label: "Thunderstorm with hail", icon: "⛈️", theme: "stormy" },
    99: { label: "Severe thunderstorm with hail", icon: "⛈️", theme: "stormy" },
};

function getWeatherInfo(code: number) {
    return weatherMap[code] ?? { label: "Unknown", icon: "🌤️", theme: "cloudy" as const };
}

function dayName(dateString: string) {
    return new Date(dateString).toLocaleDateString(undefined, { weekday: "short" });
}

function bgByTheme(theme: ReturnType<typeof getWeatherInfo>["theme"]) {
    switch (theme) {
        case "sunny":
            return "from-amber-300 via-orange-300 to-yellow-200";
        case "cloudy":
            return "from-sky-300 via-slate-300 to-slate-200";
        case "rainy":
            return "from-sky-600 via-sky-500 to-indigo-400";
        case "snowy":
            return "from-cyan-100 via-sky-100 to-slate-200";
        case "stormy":
            return "from-slate-700 via-indigo-700 to-slate-500";
        case "foggy":
            return "from-gray-300 via-gray-200 to-slate-200";
        default:
            return "from-sky-300 via-slate-300 to-slate-200";
    }
}

function WeatherAnimation({
    theme,
    icon,
}: {
    theme: ReturnType<typeof getWeatherInfo>["theme"];
    icon: string;
}) {
    return (
        <div className="relative h-20 w-20 sm:h-24 sm:w-24">
            <div
                className={[
                    "absolute inset-0 grid place-items-center text-5xl sm:text-6xl",
                    theme === "sunny" ? "sun-spin" : "",
                    theme === "cloudy" ? "cloud-float" : "",
                    theme === "rainy" ? "cloud-float" : "",
                    theme === "snowy" ? "cloud-float" : "",
                    theme === "stormy" ? "storm-pulse" : "",
                    theme === "foggy" ? "fog-drift" : "",
                ].join(" ")}
            >
                {icon}
            </div>

            {theme === "rainy" && (
                <div className="pointer-events-none absolute -bottom-3 left-1/2 w-12 -translate-x-1/2">
                    <div className="rain-drop delay-0" />
                    <div className="rain-drop delay-1" />
                    <div className="rain-drop delay-2" />
                </div>
            )}

            {theme === "snowy" && (
                <div className="pointer-events-none absolute -bottom-3 left-1/2 w-12 -translate-x-1/2">
                    <div className="snow-flake delay-0">•</div>
                    <div className="snow-flake delay-1">•</div>
                    <div className="snow-flake delay-2">•</div>
                </div>
            )}
        </div>
    );
}

export const WeatherTile = ({ location }: { location: string }) => {
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [weather, setWeather] = useState<WeatherResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function geocodeLocation() {
            const q = encodeURIComponent(location);
            const res = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`,
            );
            if (!res.ok) throw new Error("Could not geocode location.");
            const data = await res.json();
            const first = data?.results?.[0];
            if (!first) throw new Error("No coordinates found for location.");
            if (!cancelled) {
                setCoords({ lat: first.latitude, lng: first.longitude, name: first.name });
            }
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (cancelled) return;
                    setCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        name: "Your location",
                    });
                },
                async () => {
                    try {
                        await geocodeLocation();
                    } catch (e) {
                        if (!cancelled)
                            setError(e instanceof Error ? e.message : "Location unavailable.");
                    }
                },
                { enableHighAccuracy: true, timeout: 6000 },
            );
        } else {
            geocodeLocation().catch((e) =>
                setError(e instanceof Error ? e.message : "Location unavailable."),
            );
        }

        return () => {
            cancelled = true;
        };
    }, [location]);

    useEffect(() => {
        let cancelled = false;
        if (!coords) return;

        async function fetchWeather() {
            setLoading(true);
            setError(null);
            try {
                const url = new URL("https://api.open-meteo.com/v1/forecast");
                url.searchParams.set("latitude", String(coords.lat));
                url.searchParams.set("longitude", String(coords.lng));
                url.searchParams.set(
                    "current",
                    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
                );
                url.searchParams.set(
                    "daily",
                    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                );
                url.searchParams.set("timezone", "auto");
                url.searchParams.set("forecast_days", "7");

                const res = await fetch(url.toString());
                if (!res.ok) throw new Error("Weather request failed.");
                const data: WeatherResponse = await res.json();

                if (!cancelled) setWeather(data);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Weather fetch failed.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchWeather();
        return () => {
            cancelled = true;
        };
    }, [coords]);

    const currentInfo = useMemo(() => {
        if (!weather) return null;
        return getWeatherInfo(weather.current.weather_code);
    }, [weather]);

    if (loading) {
        return (
            <div className="rounded-2xl bg-slate-100 p-4 shadow-sm animate-pulse">
                <div className="h-4 w-40 rounded bg-slate-300 mb-3" />
                <div className="h-16 w-full rounded-xl bg-slate-300 mb-3" />
                <div className="h-20 w-full rounded-xl bg-slate-300" />
            </div>
        );
    }

    if (error || !weather || !currentInfo) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="font-semibold">Weather unavailable</p>
                <p className="text-sm">{error ?? "No weather data."}</p>
            </div>
        );
    }

    const current = weather.current;
    const placeLabel = coords?.name || location;

    return (
        <div
            className={`rounded-2xl bg-linear-to-br ${bgByTheme(currentInfo.theme)} p-4 shadow-lg text-slate-900`}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide opacity-80">Weather</p>
                    <h3 className="text-lg font-bold">{placeLabel}</h3>
                    <p className="text-sm opacity-90">{currentInfo.label}</p>
                </div>
                <WeatherAnimation theme={currentInfo.theme} icon={currentInfo.icon} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/60 p-3 backdrop-blur-sm">
                <div>
                    <p className="text-xs opacity-70">Now</p>
                    <p className="text-3xl font-extrabold">
                        {Math.round(current.temperature_2m)}°C
                    </p>
                </div>
                <div className="text-sm space-y-1">
                    <p>
                        Feels like: <strong>{Math.round(current.apparent_temperature)}°C</strong>
                    </p>
                    <p>
                        Humidity: <strong>{Math.round(current.relative_humidity_2m)}%</strong>
                    </p>
                    <p>
                        Wind: <strong>{Math.round(current.wind_speed_10m)} km/h</strong>
                    </p>
                </div>
            </div>

            <div className="mt-3">
                <p className="mb-2 text-sm font-semibold">7-day forecast</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {weather.daily.time.map((t, i) => {
                        const info = getWeatherInfo(weather.daily.weather_code[i]);
                        return (
                            <div
                                key={t}
                                className="rounded-xl bg-white/55 p-2 text-center backdrop-blur-sm"
                            >
                                <p className="text-xs font-semibold">{dayName(t)}</p>
                                <p className="text-xl">{info.icon}</p>
                                <p className="text-xs">
                                    {Math.round(weather.daily.temperature_2m_max[i])}° /{" "}
                                    {Math.round(weather.daily.temperature_2m_min[i])}°
                                </p>
                                <p className="text-[10px] opacity-70">
                                    💧 {weather.daily.precipitation_probability_max[i]}%
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
                .sun-spin {
                    animation: spin-slow 9s linear infinite;
                }
                .cloud-float {
                    animation: float 2.8s ease-in-out infinite;
                }
                .storm-pulse {
                    animation: storm 1.3s ease-in-out infinite;
                }
                .fog-drift {
                    animation: fog 4s ease-in-out infinite;
                }
                .rain-drop {
                    position: absolute;
                    top: 0;
                    width: 3px;
                    height: 12px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.9);
                    animation: rain 1s linear infinite;
                }
                .rain-drop:nth-child(1) {
                    left: 6px;
                }
                .rain-drop:nth-child(2) {
                    left: 18px;
                }
                .rain-drop:nth-child(3) {
                    left: 30px;
                }

                .snow-flake {
                    position: absolute;
                    top: 0;
                    color: #fff;
                    font-size: 12px;
                    animation: snow 1.6s linear infinite;
                }
                .snow-flake:nth-child(1) {
                    left: 6px;
                }
                .snow-flake:nth-child(2) {
                    left: 18px;
                }
                .snow-flake:nth-child(3) {
                    left: 30px;
                }

                .delay-0 {
                    animation-delay: 0s;
                }
                .delay-1 {
                    animation-delay: 0.2s;
                }
                .delay-2 {
                    animation-delay: 0.4s;
                }

                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-4px);
                    }
                }
                @keyframes storm {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.08);
                        opacity: 0.7;
                    }
                }
                @keyframes fog {
                    0%,
                    100% {
                        transform: translateX(0px);
                        opacity: 0.85;
                    }
                    50% {
                        transform: translateX(4px);
                        opacity: 1;
                    }
                }
                @keyframes rain {
                    0% {
                        transform: translateY(0px);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(14px);
                        opacity: 0;
                    }
                }
                @keyframes snow {
                    0% {
                        transform: translateY(0px);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(12px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

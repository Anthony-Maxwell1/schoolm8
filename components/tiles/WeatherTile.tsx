"use client";
import { fetchWeatherApi } from "openmeteo";
import { useEffect, useState } from "react";

export const WeatherTile = ({ location }: { location: string }) => {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("got location");
                    setCoords({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (err) => {
                    console.error("Geolocation error:", err);
                },
            );
            console.log("b");
        }
        console.log("a");
    }, []);

    useEffect(() => {
        console.log("d");
        if (!coords) return;
        console.log("c");

        async function fetchWeather() {
            console.log("e");
            try {
                const params = {
                    latitude: coords.lat,
                    longitude: coords.lng,
                    hourly: ["temperature_2m"],
                };

                const url = "https://api.open-meteo.com/v1/forecast";
                const responses = await fetchWeatherApi(url, params);

                console.log("API responses:", responses);

                const response = responses[0];

                const hourly = response.hourly();
                console.log("Hourly:", hourly);
            } catch (err) {
                console.error("Weather fetch failed:", err);
            }
        }

        fetchWeather();
    }, [coords]);
    return <div className="p-2">🌤 Weather for {location}</div>;
};

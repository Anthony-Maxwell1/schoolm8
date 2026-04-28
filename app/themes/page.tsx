"use client";

import { useEffect, useState } from "react";

export default function CommunityThemesPage() {
    const [popularThemes, setPopularThemes] = useState([]);
    const [newThemes, setNewThemes] = useState([]);
    const [recentUpdated, setRecentUpdated] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    function search() {
        // Implementation for search functionality
    }
    useEffect(() => {
        try {
            async function fetchThemes() {
                const popularRes = await fetch(
                    "/api/themes/search?count=20&filter=popular&filterOnly=true",
                );
                const newRes = await fetch(
                    "/api/themes/search?count=20&filter=new&filterOnly=true",
                );
                const recentRes = await fetch(
                    "/api/themes/search?count=20&filter=recent&filterOnly=true",
                );

                const popularData = await popularRes.json();
                const newData = await newRes.json();
                const recentData = await recentRes.json();

                setPopularThemes(popularData);
                setNewThemes(newData);
                setRecentUpdated(recentData);
            }

            fetchThemes();
        } catch {
            alert("Error fetching themes.");
        }
    });
    return (
        <div>
            <input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={search}>search</button>
            <h3>Popular</h3>
            <div>
                {popularThemes.map((theme: any) => (
                    <button key={theme.id}>
                        <h4>{theme.name}</h4>
                        <p>{theme.description}</p>
                    </button>
                ))}
            </div>
            <h3>New</h3>
            <div>
                {newThemes.map((theme: any) => (
                    <button key={theme.id}>
                        <h4>{theme.name}</h4>
                        <p>{theme.description}</p>
                    </button>
                ))}
            </div>
            <h3>Recently Updated</h3>
            <div>
                {recentUpdated.map((theme: any) => (
                    <button key={theme.id}>
                        <h4>{theme.name}</h4>
                        <p>{theme.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

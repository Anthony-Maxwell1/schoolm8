"use client";

import { Text } from "@/components/ui/components";
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";

export default function AlternativeDashboard() {
    const { user, token, loading } = useAuth();
    // const [name, setName] = useState("");

    // useEffect(() => {
    //     if (!user || !token || loading) return;
    //     // fetch("/api/user/get", {
    //     //     headers: {
    //     //         Authorization: `Bearer ${token}`,
    //     //     },
    //     // })
    //     //     .then((res) => res.json())
    //     //     .then((data) => {
    //     //         if (data.status === "ok") {
    //     //             setName(data.userData.name || "");
    //     //         }
    //     //     })
    //     //     .catch((err) => {
    //     //         console.error("Failed to fetch user data:", err);
    //     //     });
    // }, [user, token, loading]);

    if (loading || !user || !token) {
        return (
            <div className="p-16">
                <Text variant="h2">Loading...</Text>
            </div>
        );
    }

    return (
        <div className="p-16">
            <Text variant="h2">
                Welcome,{" "}
                <em>
                    {user?.displayName?.split(" ")[0] ||
                        (user && user.email && user.email.split("@")[0])}
                </em>
            </Text>
        </div>
    );
}

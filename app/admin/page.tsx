"use client";

export default function AdminPage() {
    if (loading) {
        return <div>Loading...</div>;
    }

    if (!allowed) {
        return <div>Unauthorized</div>;
    }

    return (
        <div>
            <h1>Admin Page</h1>
            <p>This page is only accessible to users with admin permissions.</p>
        </div>
    );
}

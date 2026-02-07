"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, token, loading } = useAuth();
  const [oneDriveConnected, setOneDriveConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canvasConnected, setCanvasConnected] = useState(false);
  const router = useRouter();
  const [canvasInstance, setCanvasInstance] = useState("");
  const [canvasToken, setCanvasToken] = useState("");
  const [iCalUrl, setICalUrl] = useState("");
  const [iCalUsername, setICalUsername] = useState("");
  const [iCalPassword, setICalPassword] = useState("");
  const [icalConnected, setIcalConnected] = useState(false);

  useEffect(() => {
    console.log("EFFECT RUNNING");
    fetch("/api/canvas/connect", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }, []);

  const disconnectCanvas = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/canvas/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to disconnect Canvas");
      }
      setCanvasConnected(false);
      alert("Canvas disconnected successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Error disconnecting Canvas: " + err.message);
    }
  };

  const connectCanvas = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/canvas/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseUrl: canvasInstance,
          token: canvasToken,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to connect Canvas");
      }
      setCanvasConnected(true);
      alert("Canvas connected successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Error connecting Canvas: " + err.message);
    }
  };

  const syncCanvas = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/canvas/sync`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to sync Canvas");
      }

      alert("Canvas sync initiated successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Error syncing Canvas: " + err.message);
    }
  };

  const setupICal = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/timetable/setup/ical`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: iCalUrl,
          username: iCalUsername,
          password: iCalPassword,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to set up iCal timetable");
      }
      alert("iCal timetable set up successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Error setting up iCal timetable: " + err.message);
    }
  };
  
  const disconnectICal = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/timetable/disconnect/ical`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to disconnect iCal timetable");
      }
      setIcalConnected(false);
      alert("iCal timetable disconnected successfully.");
    } catch (err: any) {
      console.error(err);
      alert("Error disconnecting iCal timetable: " + err.message);
    }
  };

  useEffect(() => {
    if (!user) return;

    const checkOneDrive = async () => {
      try {
        setChecking(true);
        const res = await fetch(`/api/auth/onedrive/status?uid=${user.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setOneDriveConnected(data.authenticated || false);
      } catch (err) {
        console.error(err);
      }
    };

    const checkCanvas = async () => {
      try {
        const res = await fetch(`/api/canvas/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setCanvasConnected(data.connected || false);
      } catch (err) {
        console.error(err);
      }
    };

    const checkIcal = async () => {
      try {
        const res = await fetch(`/api/timetable/fetch`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.timetable && data.timetable.length > 0) {
          setIcalConnected(true);
        } else {
          setIcalConnected(false);
        }
      } catch (err) {
        console.error(err);
      }
    }

    const checkConnections = async () => {
      await checkOneDrive();
      await checkCanvas();
      await checkIcal();
      setChecking(false);
    };

    checkConnections();
  }, [user]);

  const connectOneDrive = () => {
    if (!user) return;

    const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/onedrive/callback`,
    );
    const scope = encodeURIComponent("Files.ReadWrite offline_access User.Read");
    const responseType = "code";
    const responseMode = "query";
    const uid = user?.uid;
    const csrf = crypto.randomUUID();
    const state = encodeURIComponent(JSON.stringify({ uid, csrf }));

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&response_mode=${responseMode}&scope=${scope}&state=${state}`;

    window.location.href = authUrl;
  };

  const disconnectOneDrive = async () => {
    router.push(
      "/api/auth/onedrive/disconnect?token=" +
        encodeURIComponent(JSON.stringify({ uid: user?.uid })),
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* OneDrive Card */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>OneDrive</CardTitle>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p>Checking connection...</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p>Status: {oneDriveConnected ? "Connected ✅" : "Not connected ❌"}</p>
              <div className="flex gap-2 mt-2">
                {oneDriveConnected ? (
                  <Button variant="destructive" onClick={disconnectOneDrive}>
                    Disconnect
                  </Button>
                ) : (
                  <Button onClick={connectOneDrive}>Connect OneDrive</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Canvas LMS</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Manage your Canvas LMS integration settings here.</p>
          <div className="flex gap-2 mt-2">
            {canvasConnected ? (
              <div className="flex flex-col gap-2">
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => syncCanvas()}
                >
                  Sync Canvas
                </button>
                <Button variant="destructive" onClick={disconnectCanvas}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Canvas Access Token"
                  onChange={(e) => setCanvasToken(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Canvas Instance Base URL"
                  onChange={(e) => setCanvasInstance(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <Button onClick={connectCanvas}>Connect Canvas</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>iCal Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Set up your iCal timetable integration here.</p>
          <div className="flex flex-col gap-2 mt-2">
            {icalConnected ? (<div>
              <p>iCal timetable is set up and connected. ✅</p>
              <Button variant="destructive" onClick={disconnectICal}>
              Disconnect
              </Button>
            </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="iCal URL"
                  onChange={(e) => setICalUrl(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Username (if required)"
                  onChange={(e) => setICalUsername(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="password"
                  placeholder="Password (if required)"
                  onChange={(e) => setICalPassword(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <Button onClick={setupICal}>Set Up iCal Timetable</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other settings placeholders */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Other Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>More settings can go here in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}

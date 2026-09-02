"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, EmailAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential } from "firebase/auth";
import { KeyRound, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from "@/context/authContext";
import apiFetch from "@/lib/fetch";

type App = { appId: string; name: string; logoUrl?: string };
type Client = { clientId: string; appId?: string; name: string; redirectUris: string[]; scopes: string[]; authMethod: string };

export default function DevelopersPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.push("/developers/applications");
    })

    return <></>;
}
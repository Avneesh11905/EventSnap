"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AuthForm from "@/components/custom/AuthForm";

export default function AuthPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect logged-in users based on role
    React.useEffect(() => {
        if (status === "authenticated") {
            const role = (session?.user as any)?.role;
            if (role === "organizer") {
                router.replace("/organizer/dashboard");
            } else {
                router.replace("/attendee/dashboard");
            }
        }
    }, [status, session, router]);

    if (status === "loading" || status === "authenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 size={32} className="animate-spin text-[var(--foreground-secondary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--background)] font-sans selection:bg-[var(--primary)] selection:text-white">
            <div className="w-full max-w-[420px] z-10 relative mt-[-5vh] bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 sm:p-10">
                <AuthForm />
            </div>
        </div>
    );
}


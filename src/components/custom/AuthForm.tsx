"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("attendee");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                role: !isLogin ? role : undefined,
                redirect: false,
            });

            if (res?.error) {
                setError(res.error);
            } else {
                if (onSuccess) onSuccess();
                
                // Redirect based on role from session
                const sessionRes = await fetch("/api/auth/session");
                const sessionData = await sessionRes.json();
                
                if (sessionData?.user?.role === "organizer") {
                    window.location.href = "/organizer/dashboard";
                } else {
                    window.location.href = "/attendee/dashboard";
                }
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center justify-center mb-6 select-none">
                <Image src="/logo1.png" alt="EventSnap Logo" width={280} height={80} className="h-16 w-auto object-contain" priority />
            </div>
            
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-1.5 tracking-tight text-[var(--foreground)]">
                    {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-[var(--foreground-secondary)] text-[14px]">
                    {isLogin 
                        ? "Please enter your details to sign in." 
                        : "Join Eventsnap to start finding your memories."}
                </p>
            </div>

            {error && (
                <div className="mb-6 w-full px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] text-center font-medium">
                    {error}
                </div>
            )}

            {/* OAuth Buttons */}
            <div className="grid grid-cols-1 gap-3 w-full mb-6">
                <button
                    onClick={() => signIn("google", { callbackUrl: "/attendee/dashboard" })}
                    type="button"
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-medium transition-colors text-[13px] shadow-sm"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>
            </div>

            <div className="relative mb-5 w-full flex items-center">
                <div className="flex-grow border-t border-[var(--border)]"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] uppercase tracking-wider font-bold text-[var(--foreground-secondary)]">Or Email</span>
                <div className="flex-grow border-t border-[var(--border)]"></div>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5 w-full">
                {!isLogin && (
                    <div className="space-y-3.5">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-[var(--foreground)]">I am an</label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--primary)] transition-colors">
                                    <input type="radio" name="role" value="attendee" checked={role === "attendee"} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-[var(--primary)] accent-[var(--primary)]" />
                                    <span className="text-[14px] text-[var(--foreground)]">Attendee</span>
                                </label>
                                <label className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer hover:border-[var(--primary)] transition-colors">
                                    <input type="radio" name="role" value="organizer" checked={role === "organizer"} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-[var(--primary)] accent-[var(--primary)]" />
                                    <span className="text-[14px] text-[var(--foreground)]">Organizer</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-[var(--foreground)]">Full Name</label>
                            <div className="relative flex items-center">
                                <User className="absolute left-3 w-4 h-4 text-[var(--foreground-secondary)]" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full h-11 pl-10 pr-4 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[14px] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[var(--foreground)]">Email address</label>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3 w-4 h-4 text-[var(--foreground-secondary)]" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full h-11 pl-10 pr-4 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[14px] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-[var(--foreground)]">Password</label>
                        {isLogin && (
                            <a href="#" className="text-[12px] font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                                Forgot password?
                            </a>
                        )}
                    </div>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3 w-4 h-4 text-[var(--foreground-secondary)]" />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full h-11 pl-10 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[14px] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all shadow-sm"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors outline-none"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {!isLogin && (
                        <p className="text-[11px] text-[var(--foreground-secondary)] mt-1">
                            Must be at least 6 characters.
                        </p>
                    )}
                </div>
                
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-[var(--primary)] hover:bg-[var(--accent)] text-white font-semibold rounded-lg text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-5 shadow-sm"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        isLogin ? "Sign in" : "Create account"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center text-[13px] text-[var(--foreground-secondary)]">
                {isLogin ? (
                    <>
                        Don't have an account?{" "}
                        <button onClick={() => setIsLogin(false)} className="text-[var(--foreground)] font-bold hover:text-[var(--primary)] transition-colors">
                            Sign up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <button onClick={() => setIsLogin(true)} className="text-[var(--foreground)] font-bold hover:text-[var(--primary)] transition-colors">
                            Sign in
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}


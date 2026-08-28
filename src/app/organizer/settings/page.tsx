"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Settings, Bell, Shield, User } from "lucide-react";

export default function SettingsPage() {
    const { data: session } = useSession();

    return (
        <div className="py-10 md:py-14 max-w-4xl mx-auto px-6 md:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2">Settings</h1>
                <p className="text-[15px] text-[var(--foreground-secondary)]">Manage your organizer profile and preferences.</p>
            </div>
            
            <div className="glass-card rounded-xl p-8 mb-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
                    {session?.user?.image ? (
                        <img 
                            src={session.user.image} 
                            alt="Profile" 
                            className="w-14 h-14 rounded-full border border-[var(--border)] shadow-sm"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "O"}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-lg text-[var(--foreground)]">{session?.user?.name || "Organizer Account"}</h3>
                        <p className="text-sm text-[var(--foreground-secondary)]">{session?.user?.email || "Update your billing and profile details."}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <User size={16} className="text-[var(--foreground-secondary)]"/> Profile Information
                        </h4>
                        <div className="space-y-4 bg-[var(--background-secondary)] p-5 rounded-lg border border-[var(--border)]">
                            <div>
                                <label className="text-[12px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider block mb-1">Full Name</label>
                                <div className="text-[14px] font-medium text-[var(--foreground)]">{session?.user?.name || "—"}</div>
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-[var(--foreground-secondary)] uppercase tracking-wider block mb-1">Email Address</label>
                                <div className="text-[14px] font-medium text-[var(--foreground)]">{session?.user?.email || "—"}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <Bell size={16} className="text-[var(--foreground-secondary)]"/> Preferences
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                                <div>
                                    <p className="font-medium text-sm text-[var(--foreground)]">Email Notifications</p>
                                    <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">Receive updates when events finish processing.</p>
                                </div>
                                <div className="w-10 h-6 bg-[var(--primary)] rounded-full relative cursor-not-allowed opacity-60">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="text-[12px] text-center text-[var(--foreground-secondary)]">
                More settings options are currently under development.
            </p>
        </div>
    );
}

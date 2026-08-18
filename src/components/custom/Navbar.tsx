"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    Camera,
    Image as ImageIcon
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_LINKS = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#features", label: "Features" },
    { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const isOrganizer = session?.user?.role === "organizer";
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const initials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-3 items-center">
                {/* Left: Logo */}
                <div className="flex items-center justify-start">
                    <Link href="/" className="flex items-center group cursor-pointer select-none">
                        <Image src="/logo2.png" alt="EventSnap Logo" width={240} height={80} className="dark:hidden h-16 w-auto object-contain" priority />
                        <Image src="/logo1.png" alt="EventSnap Logo" width={240} height={80} className="hidden dark:block h-16 w-auto object-contain" priority />
                    </Link>
                </div>

                {/* Center: Nav Links (desktop) */}
                <nav className="hidden md:flex items-center justify-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${pathname === link.href
                                ? "text-[var(--foreground)] bg-[var(--card-hover)]"
                                : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Auth / Actions */}
                <div className="flex items-center justify-end gap-3">
                    <ThemeToggle />
                    {session ? (
                        <div className="flex items-center gap-1">
                            {isOrganizer && (
                                <>
                                    <Link
                                        href="/organizer/dashboard"
                                        className="px-3 py-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center gap-2 text-[13px] font-medium"
                                        title="Organizer Dashboard"
                                    >
                                        <LayoutDashboard size={14} />
                                        <span>Organizer</span>
                                    </Link>
                                    <Link
                                        href="/attendee/dashboard"
                                        className="px-3 py-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center gap-2 text-[13px] font-medium"
                                        title="Find My Photos"
                                    >
                                        <ImageIcon size={14} />
                                        <span>Attendee</span>
                                    </Link>
                                </>
                            )}
                            {!isOrganizer && (
                                <Link
                                    href="/attendee/dashboard"
                                    className="px-3 py-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center gap-2 text-[13px] font-medium"
                                    title="Dashboard"
                                >
                                    <LayoutDashboard size={14} />
                                    <span>Dashboard</span>
                                </Link>
                            )}

                            <div className="hidden sm:block w-[1px] h-4 bg-[var(--border)] mx-2"></div>

                            {/* Profile */}
                            {session.user?.image ? (
                                <div className="hidden sm:block ml-1 px-1 cursor-default">
                                    <Image
                                        src={session.user.image}
                                        alt=""
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 rounded-full border border-[var(--border)]"
                                    />
                                </div>
                            ) : (
                                <div className="hidden sm:flex ml-1 w-6 h-6 rounded-full bg-[var(--card-bg)] border border-[var(--border)] items-center justify-center text-[10px] font-medium text-[var(--foreground)] cursor-default">
                                    {initials}
                                </div>
                            )}

                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="hidden sm:block p-1.5 rounded-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer ml-1"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={() => router.push("?auth=login")} className="h-9 px-5 inline-flex items-center justify-center rounded-md bg-[var(--primary)] hover:bg-[var(--accent)] text-white text-[13px] font-medium transition-colors cursor-pointer shadow-sm">
                                Log in
                            </button>
                        </div>
                    )}
                    
                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-md hover:bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer ml-2"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
                    <div className="px-6 py-5 space-y-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`block px-4 py-2.5 rounded-md text-[14px] font-medium transition-colors cursor-pointer ${pathname === link.href
                                    ? "text-[var(--foreground)] bg-[var(--card-hover)]"
                                    : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {session && (
                            <div className="pt-2 pb-2">
                                {isOrganizer && (
                                    <Link
                                        href="/organizer/dashboard"
                                        className="block px-4 py-2.5 rounded-md text-[14px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                                    >
                                        Organizer Dashboard
                                    </Link>
                                )}
                                <Link
                                    href="/attendee/dashboard"
                                    className="block px-4 py-2.5 rounded-md text-[14px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                                >
                                    Attendee Dashboard
                                </Link>
                            </div>
                        )}

                        <div className="pt-4 mt-2 border-t border-[var(--border)]">
                            {session ? (
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="w-full px-4 py-2.5 rounded-md text-[14px] font-medium text-red-500 hover:bg-[var(--card-hover)] transition-colors text-left cursor-pointer flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setMobileOpen(false); router.push("?auth=login"); }}
                                        className="block w-full text-center py-2.5 rounded-md text-[14px] font-medium bg-[var(--primary)] hover:bg-[var(--accent)] transition-colors text-white"
                                    >
                                        Log in
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

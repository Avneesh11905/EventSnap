"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard,
    CalendarDays,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Camera
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const SIDEBAR_LINKS = [
    { href: "/organizer/events", label: "Events", icon: CalendarDays },
    { href: "/organizer/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/organizer/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [collapsed, setCollapsed] = React.useState(false);

    React.useEffect(() => {
        const stored = localStorage.getItem("eventsnap_sidebar_collapsed");
        if (stored === "true") setCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem("eventsnap_sidebar_collapsed", next.toString());
    };

    // Close mobile menu on route change
    React.useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Reusable Sidebar content component
    const SidebarContent = ({ isMobile = false }) => {
        const isCollapsed = !isMobile && collapsed;
        const widthClass = isCollapsed ? "w-[72px]" : "w-64";

        return (
            <div className={`flex flex-col h-full bg-[var(--background-secondary)] border-r border-[var(--border)] transition-all duration-300 ${widthClass} text-[var(--foreground)] relative`}>
                
                {/* Desktop Collapse Toggle */}
                {!isMobile && (
                    <button 
                        onClick={toggleCollapse}
                        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:border-[var(--foreground-secondary)] transition-colors z-50 shadow-sm"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                )}

                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 md:px-6 border-b border-[var(--border)] shrink-0">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0">
                        {isCollapsed ? (
                            <>
                                <Image src="/logo_light.webp" alt="EventSnap Icon" width={32} height={32} className="dark:hidden h-8 w-8 object-contain scale-[1.5]" priority />
                                <Image src="/logo_dark.webp" alt="EventSnap Icon" width={32} height={32} className="hidden dark:block h-8 w-8 object-contain scale-[1.5]" priority />
                            </>
                        ) : (
                            <>
                                <Image src="/logo_text_light.webp" alt="EventSnap" width={120} height={40} className="dark:hidden h-12 w-auto object-contain scale-[2.5] origin-left" priority />
                                <Image src="/logo_text_dark.webp" alt="EventSnap" width={120} height={40} className="hidden dark:block h-12 w-auto object-contain scale-[2.5] origin-left" priority />
                            </>
                        )}
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className={`flex-1 overflow-y-auto py-6 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    <div className={`mb-4 px-2 text-xs font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider ${isCollapsed ? 'text-center' : ''}`}>
                        {isCollapsed ? "..." : "Organizer Menu"}
                    </div>
                    {SIDEBAR_LINKS.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                title={isCollapsed ? link.label : undefined}
                                className={`flex items-center rounded-[var(--radius)] transition-colors text-sm font-medium ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2'} ${
                                    isActive
                                        ? "bg-[var(--primary)] text-white shadow-sm"
                                        : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                                }`}
                            >
                                <Icon size={18} className="shrink-0" />
                                {!isCollapsed && <span>{link.label}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Section (Profile & Actions) */}
                <div className={`p-4 border-t border-[var(--border)] space-y-2 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
                    <Link
                        href="/attendee/dashboard"
                        title={isCollapsed ? "Back to Attendee" : undefined}
                        className={`flex items-center rounded-[var(--radius)] text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors ${isCollapsed ? 'justify-center p-3 w-full' : 'gap-3 px-3 py-2'}`}
                    >
                        <ChevronLeft size={18} className="shrink-0" />
                        {!isCollapsed && <span>Back to Attendee</span>}
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        title={isCollapsed ? "Sign Out" : undefined}
                        className={`flex items-center rounded-[var(--radius)] text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors ${isCollapsed ? 'justify-center p-3 w-full' : 'gap-3 px-3 py-2 w-full'}`}
                    >
                        <LogOut size={18} className="shrink-0" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                    
                    {session?.user && (
                        <div className={`mt-4 flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-2 py-2'}`}>
                            {session.user.image ? (
                                <Image
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    width={32}
                                    height={32}
                                    className="rounded-full border border-[var(--border)] shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">
                                    {session.user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {!isCollapsed && (
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{session.user.name}</span>
                                    <span className="text-xs text-[var(--foreground-secondary)] truncate">{session.user.email}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`pt-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                        {!isCollapsed && <span className="text-xs text-[var(--foreground-secondary)]">Theme</span>}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Mobile Header (Hamburger) */}
            <div className="md:hidden flex items-center justify-between h-16 px-4 bg-[var(--background-secondary)] border-b border-[var(--border)] sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <Image src="/logo_text_light.webp" alt="EventSnap" width={100} height={32} className="dark:hidden h-10 w-auto object-contain scale-[2.5] origin-left" />
                    <Image src="/logo_text_dark.webp" alt="EventSnap" width={100} height={32} className="hidden dark:block h-10 w-auto object-contain scale-[2.5] origin-left" />
                </Link>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <div className="relative z-50 h-full transform transition-transform">
                        <SidebarContent isMobile={true} />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-screen sticky top-0 left-0 z-40">
                <SidebarContent isMobile={false} />
            </div>
        </>
    );
}

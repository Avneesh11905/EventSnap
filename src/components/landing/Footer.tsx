"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-[var(--background)] border-t border-[var(--border)] pt-20 pb-10 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center group mb-6 inline-flex select-none">
                            <Image src="/logo2.png" alt="EventSnap Logo" width={280} height={80} className="dark:hidden h-16 w-auto object-contain" priority />
                            <Image src="/logo1.png" alt="EventSnap Logo" width={280} height={80} className="hidden dark:block h-16 w-auto object-contain" priority />
                        </Link>
                        <p className="text-[15px] text-[var(--foreground-secondary)] max-w-sm mb-6 leading-relaxed">
                            Find the moments you were part of. Advanced facial recognition for event photography delivery.
                        </p>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-bold text-[var(--foreground)] mb-6 text-[14px] uppercase tracking-wider">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="#how-it-works" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">How It Works</Link></li>
                            <li><Link href="#features" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Features</Link></li>
                            <li><Link href="#" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Find My Photos</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[var(--foreground)] mb-6 text-[14px] uppercase tracking-wider">Organizers</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Create an Event</Link></li>
                            <li><Link href="#" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Event Codes</Link></li>
                            <li><Link href="#" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Organizer Guide</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-[var(--foreground)] mb-6 text-[14px] uppercase tracking-wider">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="/#how-it-works" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">How It Works</Link></li>
                            <li><Link href="/#features" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Features</Link></li>
                            <li><Link href="/#contact" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Contact Us</Link></li>
                            <li><Link href="#" className="text-[14px] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] text-[var(--foreground-secondary)]">
                        © {new Date().getFullYear()} EventSnap. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-[13px] text-[var(--foreground-secondary)]">
                        <span className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

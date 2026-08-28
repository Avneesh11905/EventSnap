"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Lock, BarChart3, ChevronRight } from "lucide-react";
import { Footer } from "@/components/custom/Footer";

export default function LandingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [eventCode, setEventCode] = useState("");

    const handleOrganizerCTA = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (session) {
            router.push("/organizer/events");
        } else {
            router.push("?auth=login", { scroll: false });
        }
    };

    const handleAttendeeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (eventCode.trim()) {
            router.push(`/attendee/events/${eventCode.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[var(--primary)] selection:text-white flex flex-col">
            
            <main className="flex-1">
                {/* 1. HERO SECTION (Dual CTA) */}
                <section className="relative min-h-[calc(100vh-64px)] flex flex-col justify-center px-6 overflow-hidden">
                    {/* Glowing Background Orbs */}
                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] max-w-[1000px] h-[400px] rounded-[100%] bg-gradient-to-r from-[var(--primary)] to-purple-600 blur-[100px] opacity-20 md:opacity-30 pointer-events-none" />
                    
                    {/* Subtle grid background for B2B SaaS feel */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
                    
                    <div className="max-w-5xl mx-auto w-full relative z-10 text-center">

                        <motion.h1 
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold tracking-tight leading-[1.05] mb-6"
                        >
                            Automate event photo <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
                                delivery with AI.
                            </span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg md:text-xl text-[var(--foreground-secondary)] max-w-2xl mx-auto mb-10 font-medium"
                        >
                            Stop manually sorting and emailing galleries. Upload your raw event photos, and our AI instantly delivers personalized, private galleries to every guest.
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-2xl mx-auto"
                        >
                            {/* Organizer CTA */}
                            <button onClick={handleOrganizerCTA} className="btn-primary w-full md:w-auto px-8 py-4 text-base shadow-lg shadow-[var(--glow)]">
                                Start Organizing Events
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </button>

                            <div className="text-[var(--foreground-secondary)] text-sm font-medium hidden md:block">OR</div>
                            <div className="text-[var(--foreground-secondary)] text-sm font-medium flex md:hidden w-full items-center gap-4">
                                <div className="flex-1 h-px bg-[var(--border)]"></div>
                                <span>OR</span>
                                <div className="flex-1 h-px bg-[var(--border)]"></div>
                            </div>

                            {/* Attendee Quick Access */}
                            <form onSubmit={handleAttendeeSubmit} className="flex w-full md:w-auto relative group">
                                <input 
                                    type="text" 
                                    placeholder="Have an Event Code?" 
                                    value={eventCode}
                                    onChange={(e) => setEventCode(e.target.value)}
                                    className="input-field pr-12 py-4 text-base w-full md:w-[260px] bg-[var(--background)] shadow-sm group-hover:border-[var(--foreground-secondary)] transition-colors"
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </section>

                {/* 2. DASHBOARD PREVIEW GRAPHIC */}
                <section className="relative px-6 pb-20 md:pb-32 overflow-hidden bg-[var(--background)]">
                    <motion.div 
                        id="how-it-works"
                        initial={{ opacity: 0, y: 50 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-5xl mx-auto w-full relative block scroll-mt-24"
                    >
                        <div className="absolute inset-[-2px] bg-gradient-to-b from-[var(--border)] to-transparent rounded-2xl opacity-50 pointer-events-none" />
                        <div className="glass-card rounded-xl p-2 md:p-4 bg-[var(--background)] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />
                            <div className="aspect-[16/9] md:aspect-[21/9] bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] flex items-center justify-center relative overflow-hidden">
                                {/* Faux Dashboard UI */}
                                <div className="absolute top-0 left-0 w-48 h-full border-r border-[var(--border)] p-4 hidden md:flex flex-col gap-3">
                                    <div className="h-6 w-24 bg-[var(--border)] rounded mb-4" />
                                    <div className="h-4 w-full bg-[var(--card-hover)] rounded" />
                                    <div className="h-4 w-3/4 bg-[var(--card-hover)] rounded" />
                                    <div className="h-4 w-5/6 bg-[var(--card-hover)] rounded" />
                                </div>
                                <div className="flex-1 h-full md:ml-48 p-6 flex flex-col gap-6">
                                    <div className="flex gap-4">
                                        <div className="h-24 flex-1 bg-[var(--card-hover)] rounded-lg border border-[var(--border)] p-4 flex flex-col justify-end">
                                            <div className="h-8 w-16 bg-[var(--border)] rounded" />
                                        </div>
                                        <div className="h-24 flex-1 bg-[var(--card-hover)] rounded-lg border border-[var(--border)] p-4 flex flex-col justify-end">
                                            <div className="h-8 w-16 bg-[var(--border)] rounded" />
                                        </div>
                                        <div className="h-24 flex-1 bg-[var(--card-hover)] rounded-lg border border-[var(--border)] p-4 flex flex-col justify-end">
                                            <div className="h-8 w-16 bg-[var(--primary)] opacity-20 rounded" />
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-[var(--card-hover)] rounded-lg border border-[var(--border)]" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* 3. CORE FEATURES GRID */}
                <section id="features" className="py-24 md:py-32 px-6 scroll-mt-12">
                    <div className="max-w-6xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                            className="text-center max-w-2xl mx-auto mb-16"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to deliver photos at scale.</h2>
                            <p className="text-lg text-[var(--foreground-secondary)]">Enterprise-grade facial recognition meets a beautifully simple organizer dashboard.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div 
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="glass-card p-8 flex flex-col items-start text-left"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-6 text-[var(--primary)]">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Instant AI Matching</h3>
                                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                                    Upload thousands of raw event photos in seconds. Our localized AI pipeline processes facial encodings in real-time, matching guests instantly.
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="glass-card p-8 flex flex-col items-start text-left"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-6 text-[var(--primary)]">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                                    Guests only see photos they are in. No more sharing a public Google Drive link with 5,000 uncurated photos of strangers.
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="glass-card p-8 flex flex-col items-start text-left"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center mb-6 text-[var(--primary)]">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Real-time Analytics</h3>
                                <p className="text-[var(--foreground-secondary)] leading-relaxed">
                                    Track exactly how many photos were processed, how many attendees claimed their galleries, and storage usage natively.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 4. BOTTOM CTA */}
                <section id="contact" className="py-24 px-6 relative overflow-hidden bg-[var(--background-secondary)] border-t border-[var(--border)] scroll-mt-12">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--glow),transparent_50%)] pointer-events-none" />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto text-center relative z-10"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Ready to upgrade your events?</h2>
                        <p className="text-lg text-[var(--foreground-secondary)] mb-10">
                            Join the next generation of event managers who automate their photo delivery workflows.
                        </p>
                        <button onClick={handleOrganizerCTA} className="btn-primary w-full md:w-auto px-10 py-4 text-lg mx-auto shadow-xl shadow-[var(--glow)]">
                            Create Your First Event
                            <ArrowRight className="w-5 h-5 ml-1" />
                        </button>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

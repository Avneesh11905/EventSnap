"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Share2, Users } from "lucide-react";

export function OrganizerSection({ onAuthClick }: { onAuthClick: () => void }) {
    return (
        <section className="py-16 md:py-24 px-6 bg-[var(--background-secondary)] border-b border-[var(--border)] overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Left side text content */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-start order-2 lg:order-1"
                >
                    <div className="px-3 py-1 bg-zinc-500/10 text-[var(--foreground-secondary)] text-[12px] font-bold tracking-wider uppercase rounded-full mb-6">
                        FOR ORGANIZERS
                    </div>

                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-6 leading-tight">
                        Give Every Guest<br/>
                        <span className="text-[var(--foreground-secondary)]">Their Moment.</span>
                    </h2>

                    <p className="text-[17px] text-[var(--foreground-secondary)] mb-8 leading-relaxed max-w-md">
                        Upload the event gallery once, generate an event code, and let attendees find their own photos. No more endless email threads or shared drives.
                    </p>

                    <button
                        onClick={onAuthClick}
                        className="group h-12 px-8 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-[15px] font-medium transition-colors shadow-sm"
                    >
                        Create an Event
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100" />
                    </button>
                </motion.div>

                {/* Right side visual composition */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    className="relative w-full aspect-[4/3] order-1 lg:order-2 flex justify-center items-center"
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-[var(--glow)] opacity-30 blur-3xl rounded-full" />

                    {/* Organizer Mockup UI */}
                    <div className="relative z-10 w-full max-w-sm bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
                            <span className="text-[12px] font-bold text-[var(--foreground-secondary)] uppercase tracking-wider">Event Created</span>
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>

                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Summer Night 2026</h3>
                        <p className="text-[14px] text-[var(--foreground-secondary)] mb-6 flex items-center gap-2">
                            <Users className="w-4 h-4" /> 2,486 Photos Processed
                        </p>

                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 mb-6 text-center">
                            <span className="text-[11px] text-[var(--foreground-secondary)] uppercase tracking-wider font-bold block mb-2">Event Code</span>
                            <span className="text-3xl font-mono font-bold text-[var(--primary)] tracking-widest">ES-7K4P9</span>
                        </div>

                        <button className="w-full h-10 bg-[var(--primary)] text-white rounded-lg text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[var(--accent)] transition-colors">
                            <Share2 className="w-4 h-4" />
                            Share Event Link
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

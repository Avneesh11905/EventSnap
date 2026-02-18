"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function AttendeeSection({ onAuthClick }: { onAuthClick: () => void }) {
    const features = [
        "Upload one selfie",
        "Find matching event photos",
        "Preview your memories",
        "Download everything as a ZIP"
    ];

    return (
        <section className="py-16 md:py-24 px-6 bg-[var(--background)] border-b border-[var(--border)] overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Left side visual composition */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative w-full aspect-[4/3]"
                >
                    <div className="absolute inset-0 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 shadow-xl overflow-hidden flex flex-col">
                        <div className="w-full h-10 border-b border-[var(--border)] flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3 opacity-60">
                            <div className="bg-[var(--card-hover)] rounded-lg overflow-hidden relative">
                                <div className="absolute inset-0 border border-[var(--primary)] rounded-lg m-1 bg-[var(--primary)]/5" />
                            </div>
                            <div className="bg-[var(--card-hover)] rounded-lg" />
                            <div className="bg-[var(--card-hover)] rounded-lg" />
                            <div className="bg-[var(--card-hover)] rounded-lg relative overflow-hidden">
                                <div className="absolute inset-0 border border-[var(--primary)] rounded-lg m-1 bg-[var(--primary)]/5" />
                            </div>
                        </div>
                    </div>

                    <motion.div 
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute right-0 md:-right-4 top-1/4 bg-[var(--card-bg)] border border-[var(--border)] shadow-xl rounded-xl p-4 flex flex-col gap-2 backdrop-blur-md"
                    >
                        <span className="text-[12px] text-[var(--foreground-secondary)] font-medium">Found Memories</span>
                        <div className="flex -space-x-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--card-bg)] bg-[var(--card-hover)]" />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right side text content */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    className="flex flex-col items-start"
                >
                    <div className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-[12px] font-bold tracking-wider uppercase rounded-full mb-6">
                        FOR ATTENDEES
                    </div>

                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-6 leading-tight">
                        Stop Searching.<br/>
                        <span className="text-[var(--foreground-secondary)]">Start Remembering.</span>
                    </h2>

                    <p className="text-[17px] text-[var(--foreground-secondary)] mb-8 leading-relaxed">
                        You shouldn't have to scroll through hundreds or thousands of event photos to find yourself. Upload one photo and let EventSnap do the work.
                    </p>

                    <ul className="space-y-4 mb-10">
                        {features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-[15px] text-[var(--foreground)] font-medium">
                                <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={onAuthClick}
                        className="group relative h-12 px-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] hover:bg-[var(--accent)] text-white text-[15px] font-medium transition-all duration-300 shadow-[0_0_15px_var(--glow)]"
                    >
                        Find My Photos
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

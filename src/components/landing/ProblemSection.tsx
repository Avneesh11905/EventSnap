"use client";

import React from "react";
import { motion } from "framer-motion";
import { SearchX, ScanFace, ArrowRight } from "lucide-react";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.5, ease: "easeOut" as any }
};

export function ProblemSection() {
    return (
        <section className="py-16 md:py-24 px-6 border-y border-[var(--border)] bg-[var(--background-secondary)] relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div {...fadeInUp} className="text-center mb-20">
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-6">
                        Thousands of Photos.<br/>
                        <span className="text-[var(--foreground-secondary)]">One Problem.</span>
                    </h2>
                    <p className="text-[17px] text-[var(--foreground-secondary)] max-w-2xl mx-auto leading-relaxed">
                        Your photos are somewhere in that gallery. Finding them shouldn't mean scrolling through thousands of images manually.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                    {/* Manual Search (The Problem) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center text-center opacity-80"
                    >
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                            <SearchX className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Manual Search</h3>
                        <div className="flex flex-col gap-3 text-[15px] text-[var(--foreground-secondary)] w-full max-w-xs mx-auto">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                                <span>Thousands of photos</span>
                                <ArrowRight className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                                <span>Endless scrolling</span>
                                <ArrowRight className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                                <span>Missed memories</span>
                                <SearchX className="w-4 h-4 text-red-400" />
                            </div>
                        </div>
                    </motion.div>

                    {/* EventSnap (The Solution) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-[var(--card-bg)] border border-[var(--primary)] rounded-2xl p-8 flex flex-col items-center text-center relative shadow-[0_0_30px_var(--glow)]"
                    >
                        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[var(--primary)] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-md">
                            The Solution
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[var(--glow)] flex items-center justify-center mb-6 border border-[var(--border)]">
                            <ScanFace className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">EventSnap</h3>
                        <div className="flex flex-col gap-3 text-[15px] text-[var(--foreground-secondary)] w-full max-w-xs mx-auto">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--card-hover)]">
                                <span>Upload one selfie</span>
                                <ArrowRight className="w-4 h-4 text-[var(--primary)]" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--card-hover)]">
                                <span>AI finds matches</span>
                                <ArrowRight className="w-4 h-4 text-[var(--primary)]" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--primary)] bg-[var(--glow)] text-[var(--foreground)] font-medium">
                                <span>Download your memories</span>
                                <ScanFace className="w-4 h-4 text-[var(--primary)]" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

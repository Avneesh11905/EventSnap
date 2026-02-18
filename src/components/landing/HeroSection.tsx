"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ScanFace, Upload, Image as ImageIcon } from "lucide-react";

export function HeroSection({ onAuthClick, onOrganizerClick }: { onAuthClick: () => void, onOrganizerClick: () => void }) {
    return (
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-32 px-6 overflow-hidden bg-[var(--background)]">
            <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Left Text Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-start text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card-bg)] text-[13px] font-medium text-[var(--foreground-secondary)] mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                        </span>
                        Eventsnap Engine 2.0
                    </div>

                    <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-bold leading-[1.1] tracking-tight mb-6 text-[var(--foreground)]">
                        Find your event photos in seconds.
                    </h1>

                    <p className="text-[16px] md:text-[18px] text-[var(--foreground-secondary)] max-w-xl mb-10 leading-relaxed">
                        Stop endlessly scrolling through event galleries. Upload one photo of yourself, and our system will instantly deliver every moment you were part of.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={onAuthClick}
                            className="group relative h-12 px-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] hover:bg-[var(--accent)] text-white text-[14px] font-bold transition-colors shadow-sm"
                        >
                            Find My Photos
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onOrganizerClick}
                            className="group h-12 px-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-transparent hover:bg-[var(--card-hover)] text-[var(--foreground)] text-[14px] font-medium transition-colors"
                        >
                            I'm an Organizer
                        </button>
                    </div>
                </motion.div>

                {/* Right Visual Composition - Clean, Professional UI */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="relative w-full aspect-square md:aspect-auto md:h-[500px] flex items-center justify-center lg:justify-end"
                >
                    <div className="relative w-full max-w-md">
                        {/* Main App Window Mockup */}
                        <div className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col">
                            {/* Mac-style Window Header */}
                            <div className="h-10 border-b border-[var(--border)] bg-[var(--card-bg)] flex items-center px-4 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                            </div>
                            
                            <div className="p-5 flex flex-col gap-4">
                                {/* Upload Step */}
                                <div className="border border-[var(--border)] border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center bg-[var(--card-bg)]">
                                    <div className="w-10 h-10 rounded-full bg-[var(--card-hover)] flex items-center justify-center mb-3">
                                        <Upload className="w-4 h-4 text-[var(--foreground-secondary)]" />
                                    </div>
                                    <span className="text-[13px] font-medium text-[var(--foreground)] mb-1">Selfie uploaded successfully</span>
                                    <span className="text-[12px] text-[var(--foreground-secondary)]">reference.jpg • 2.4 MB</span>
                                </div>

                                {/* Processing / Match Result */}
                                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <ScanFace className="w-4 h-4 text-[var(--primary)]" />
                                            <span className="text-[13px] font-medium text-[var(--foreground)]">Analysis Complete</span>
                                        </div>
                                        <span className="text-[12px] text-[var(--foreground-secondary)] font-mono">100%</span>
                                    </div>

                                    {/* Clean Photo Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="aspect-square bg-[var(--card-hover)] rounded-md flex items-center justify-center relative overflow-hidden group border border-[var(--border)]">
                                            <ImageIcon className="w-4 h-4 text-[var(--foreground-secondary)] opacity-50" />
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)]" />
                                        </div>
                                        <div className="aspect-square bg-[var(--card-hover)] rounded-md flex items-center justify-center relative border border-[var(--border)]">
                                            <ImageIcon className="w-4 h-4 text-[var(--foreground-secondary)] opacity-50" />
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)]" />
                                        </div>
                                        <div className="aspect-square bg-[var(--card-hover)] rounded-md flex items-center justify-center relative border border-[var(--border)]">
                                            <ImageIcon className="w-4 h-4 text-[var(--foreground-secondary)] opacity-50" />
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)]" />
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                        <span className="text-[12px] font-medium text-[var(--foreground)]">18 Matches Found</span>
                                        <button className="text-[12px] font-medium bg-[var(--primary)] text-white px-3 py-1.5 rounded-md hover:bg-[var(--accent)] transition-colors">
                                            Download ZIP
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements behind */}
                        <div className="hidden md:block absolute -bottom-6 -left-6 w-32 h-32 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl -z-10 shadow-lg" />
                        <div className="hidden md:block absolute -top-6 -right-6 w-24 h-24 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl -z-10 shadow-lg" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

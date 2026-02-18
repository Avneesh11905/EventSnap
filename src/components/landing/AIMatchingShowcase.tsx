"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScanFace, ArrowRight } from "lucide-react";

export function AIMatchingShowcase({ onAuthClick }: { onAuthClick: () => void }) {
    return (
        <section className="py-32 px-6 border-t border-[var(--border)] bg-[var(--background)] relative overflow-hidden">
            {/* Custom Background specific to AI Showcase for immersive dark feel */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--glow)_0%,transparent_70%)] opacity-30 pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                {/* Left side text */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full lg:w-1/2"
                >
                    <h2 className="text-[clamp(2.5rem,4vw,3.5rem)] font-bold tracking-tight text-[var(--foreground)] mb-6 leading-tight">
                        Thousands of Photos.<br/>
                        <span className="text-[var(--primary)]">One Search.</span>
                    </h2>
                    <p className="text-[17px] text-[var(--foreground-secondary)] max-w-lg mb-8 leading-relaxed">
                        Behind the scenes, EventSnap generates secure facial encodings to match attendees with near-perfect accuracy, even in low light or crowded shots. 
                    </p>

                    <button
                        onClick={onAuthClick}
                        className="group inline-flex items-center gap-2 text-white font-medium bg-[var(--primary)] hover:bg-[var(--accent)] px-6 py-3 rounded-full transition-all duration-300 shadow-[0_0_15px_var(--glow)] hover:shadow-[0_0_25px_var(--glow)]"
                    >
                        View My Photos
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Right side visual showcase */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full lg:w-1/2 relative"
                >
                    <div className="bg-[var(--card-bg)] border border-[var(--primary)]/30 rounded-2xl p-2 shadow-2xl relative overflow-hidden aspect-[4/3] flex items-center justify-center">
                        
                        {/* Faux Large Photo */}
                        <div className="absolute inset-2 bg-[var(--background-secondary)] rounded-xl overflow-hidden border border-[var(--border)] flex items-center justify-center">
                            
                            {/* Scanning line animation */}
                            <motion.div 
                                animate={{ y: ["-10%", "110%"] }} 
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] shadow-[0_0_20px_var(--primary)] z-20"
                            />

                            {/* Faux faces in crowd */}
                            <div className="grid grid-cols-4 gap-4 w-3/4 h-3/4 opacity-40">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="border border-[var(--border)] rounded-md relative flex items-center justify-center">
                                        {i === 6 && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0, 1, 1, 0] }}
                                                transition={{ duration: 3, repeat: Infinity, times: [0, 0.5, 0.8, 1] }}
                                                className="absolute inset-[-4px] border-2 border-[var(--primary)] rounded-md shadow-[0_0_10px_var(--primary)] z-10 bg-[var(--primary)]/10"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Overlay Panel */}
                        <motion.div 
                            className="absolute bottom-6 left-6 right-6 bg-[var(--background)]/90 backdrop-blur-md border border-[var(--primary)]/30 rounded-xl p-4 flex flex-col gap-3 shadow-xl z-30"
                        >
                            <div className="flex items-center justify-between text-[var(--foreground)] text-[13px] font-medium">
                                <span>AI Photo Search</span>
                                <span className="text-[var(--primary)]">86%</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                <motion.div 
                                    animate={{ width: ["0%", "86%"] }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="h-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
                                />
                            </div>

                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-[var(--foreground-secondary)]">Scanning 2,486 photos...</span>
                                <span className="flex items-center gap-1 text-green-400 font-medium">
                                    <ScanFace size={14} /> 18 Found
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

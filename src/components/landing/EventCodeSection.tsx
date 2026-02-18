"use client";

import React from "react";
import { motion } from "framer-motion";
import { QrCode, LockKeyhole, Share2, ArrowRight } from "lucide-react";

export function EventCodeSection() {
    return (
        <section className="py-16 md:py-24 px-6 border-b border-[var(--border)] overflow-hidden relative bg-[var(--background)]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
                
                {/* Left side text */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="w-full md:w-1/2 flex flex-col items-start"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card-bg)] text-[12px] font-medium text-[var(--foreground-secondary)] mb-6">
                        <LockKeyhole className="w-3.5 h-3.5 text-[var(--foreground)]" />
                        Private & Secure Access
                    </div>

                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-6 leading-[1.1]">
                        One Event.<br/>
                        One Code.<br/>
                        Zero Hassle.
                    </h2>
                    
                    <p className="text-[17px] text-[var(--foreground-secondary)] mb-8 max-w-lg leading-relaxed">
                        No complex logins or shared gallery links. Organizers generate a simple 6-character code, and attendees use it to access their private matches instantly.
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <div className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border)] p-4 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-[var(--card-hover)] flex items-center justify-center font-mono text-[12px] font-bold">1</div>
                            <span className="text-[14px] font-medium text-[var(--foreground)]">Organizer shares the code</span>
                        </div>
                        <div className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border)] p-4 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-[var(--card-hover)] flex items-center justify-center font-mono text-[12px] font-bold">2</div>
                            <span className="text-[14px] font-medium text-[var(--foreground)]">Attendees enter the code</span>
                        </div>
                    </div>
                </motion.div>

                {/* Right side visual (Premium Ticket/Card Mockup) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full md:w-1/2 flex justify-center lg:justify-end"
                >
                    <div className="relative w-full max-w-sm">
                        {/* Background subtle blur */}
                        <div className="absolute inset-0 bg-[var(--primary)] blur-[100px] opacity-10 rounded-full" />
                        
                        {/* Event Card Mockup */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center">
                            
                            <div className="w-16 h-16 bg-[var(--background)] border border-[var(--border)] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <QrCode className="w-8 h-8 text-[var(--foreground)]" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Join Event</h3>
                            <p className="text-[13px] text-[var(--foreground-secondary)] mb-8">Enter the 6-character code from the organizer</p>

                            <div className="w-full flex gap-2 mb-8">
                                {['E', 'S', '-', '7', 'K', '4'].map((char, idx) => (
                                    <div key={idx} className={`flex-1 aspect-[3/4] rounded-lg border flex items-center justify-center text-2xl font-mono font-bold ${char === '-' ? 'border-transparent text-[var(--foreground-secondary)]' : 'border-[var(--primary)]/50 bg-[var(--primary)]/5 text-[var(--primary)] shadow-[0_0_10px_var(--primary)] shadow-[var(--primary)]/10'}`}>
                                        {char}
                                    </div>
                                ))}
                            </div>

                            <button className="w-full h-12 bg-[var(--primary)] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--accent)] transition-colors">
                                Access Photos <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Share tooltip floating */}
                        <motion.div 
                            animate={{ y: [-5, 5, -5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute right-0 bottom-0 md:-right-6 md:-bottom-6 bg-[var(--background)] border border-[var(--border)] p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
                        >
                            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <Share2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-[var(--foreground)]">Share Code</p>
                                <p className="text-[11px] text-[var(--foreground-secondary)]">WhatsApp, Email, etc.</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { ScanFace, Download, QrCode, SearchX, Smartphone, ShieldCheck } from "lucide-react";

export function FeaturesGrid() {
    const features = [
        {
            title: "AI-Powered Matching",
            desc: "Find yourself across the entire event gallery instantly using advanced facial recognition.",
            icon: <ScanFace className="w-5 h-5 text-[var(--foreground)]" />
        },
        {
            title: "One-Click Download",
            desc: "Get all your matched photos together in a single, optimized ZIP file.",
            icon: <Download className="w-5 h-5 text-[var(--foreground)]" />
        },
        {
            title: "Event Codes",
            desc: "Simple 6-character event-based access for attendees. No complex logins required.",
            icon: <QrCode className="w-5 h-5 text-[var(--foreground)]" />
        },
        {
            title: "No Endless Scrolling",
            desc: "Stop manually searching through thousands of images to find the three you're actually in.",
            icon: <SearchX className="w-5 h-5 text-[var(--foreground)]" />
        },
        {
            title: "Mobile Friendly",
            desc: "Find your memories directly from your phone on the way home from the event.",
            icon: <Smartphone className="w-5 h-5 text-[var(--foreground)]" />
        },
        {
            title: "Privacy First",
            desc: "Keep the photo discovery experience private and secure. You only see what you're in.",
            icon: <ShieldCheck className="w-5 h-5 text-[var(--foreground)]" />
        }
    ];

    return (
        <section id="features" className="py-32 px-6 bg-[var(--background)] border-b border-[var(--border)]">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="mb-16"
                >
                    <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-4">
                        Built for speed.<br/>
                        <span className="text-[var(--foreground-secondary)]">Designed for memories.</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)] transition-colors duration-300 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[var(--card-hover)] border border-[var(--border)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)]/10 group-hover:border-[var(--primary)]/30 transition-colors">
                                {item.icon}
                            </div>
                            <h3 className="text-[17px] font-bold text-[var(--foreground)] mb-2">{item.title}</h3>
                            <p className="text-[14px] text-[var(--foreground-secondary)] leading-relaxed">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

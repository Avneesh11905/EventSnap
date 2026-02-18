"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, EyeOff, SlidersHorizontal } from "lucide-react";

export function PrivacyTrust() {
    const points = [
        {
            title: "Private by Design",
            desc: "Your uploaded selfie is only used to find your matches within the specific event you are attending.",
            icon: <EyeOff className="w-6 h-6 text-[var(--primary)]" />
        },
        {
            title: "Secure Experience",
            desc: "Event access remains tied to the intended event flow via unique access codes.",
            icon: <Lock className="w-6 h-6 text-[var(--primary)]" />
        },
        {
            title: "Transparent Handling",
            desc: "We prioritize clarity. Your face data is processed securely and ephemeral matching is prioritized.",
            icon: <Shield className="w-6 h-6 text-[var(--primary)]" />
        },
        {
            title: "You Stay in Control",
            desc: "Organizers manage the event, but you manage your own memories and downloads.",
            icon: <SlidersHorizontal className="w-6 h-6 text-[var(--primary)]" />
        }
    ];

    return (
        <section className="py-16 md:py-24 px-6 bg-[var(--background)] border-b border-[var(--border)] relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-4">
                        Your Memories. <span className="text-[var(--primary)]">Your Privacy.</span>
                    </h2>
                    <p className="text-[17px] text-[var(--foreground-secondary)] max-w-xl mx-auto">
                        Because this product involves face matching, privacy isn't just an afterthought. It's the foundation.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {points.map((point, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-[var(--card-bg)] border border-[var(--primary)]/20 rounded-2xl p-8 flex gap-6"
                        >
                            <div className="shrink-0 mt-1">
                                {point.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{point.title}</h3>
                                <p className="text-[15px] text-[var(--foreground-secondary)] leading-relaxed">
                                    {point.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

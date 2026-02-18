"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { UploadCloud, ScanFace, Download } from "lucide-react";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.5, ease: "easeOut" as any }
};

export function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Track scroll progress relative to this section
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end center"]
    });

    // Map scroll progress (0 to 1) to width (0% to 100%)
    const lineWidth = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);

    const steps = [
        { 
            step: "01", 
            title: "Upload Your Selfie", 
            desc: "Give EventSnap one clear photo of yourself.",
            icon: <UploadCloud className="w-5 h-5 text-[var(--primary)]" />
        },
        { 
            step: "02", 
            title: "Let AI Find You", 
            desc: "EventSnap searches through the event gallery and identifies photos you're in.",
            icon: <ScanFace className="w-5 h-5 text-[var(--primary)]" />
        },
        { 
            step: "03", 
            title: "Download Your Memories", 
            desc: "Review your matches and download all your photos together.",
            icon: <Download className="w-5 h-5 text-[var(--primary)]" />
        }
    ];

    return (
        <section id="how-it-works" className="py-16 md:py-24 px-6" ref={containerRef}>
            <div className="max-w-6xl mx-auto">
                <motion.div {...fadeInUp} className="mb-20 text-center">
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-4">
                        From Event Photos to Your Memories.
                    </h2>
                    <p className="text-[17px] text-[var(--foreground-secondary)] max-w-xl mx-auto leading-relaxed">
                        Three simple steps. That's it.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Background track line */}
                    <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-[var(--border)] z-0 rounded-full" />
                    
                    {/* Animated fill line */}
                    <motion.div 
                        className="hidden md:block absolute top-12 left-[15%] h-[2px] bg-[var(--primary)] z-0 rounded-full origin-left"
                        style={{ width: "70%", scaleX: scrollYProgress, transformOrigin: "left" }} 
                    />
                    
                    {steps.map((item, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative z-10 flex flex-col md:items-center md:text-center group"
                        >
                            <div className="w-24 h-24 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] flex flex-col items-center justify-center mb-8 shadow-sm group-hover:border-[var(--primary)] transition-colors duration-300 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-[var(--glow)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    {item.icon}
                                    <span className="font-mono text-[11px] font-bold text-[var(--foreground-secondary)] tracking-wider">STEP {item.step}</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">{item.title}</h3>
                            <p className="text-[15px] text-[var(--foreground-secondary)] leading-relaxed max-w-[280px]">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

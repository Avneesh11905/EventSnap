"use client";

import React from "react";
import { motion } from "framer-motion";

export function LogoCloud() {
    return (
        <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="py-12 border-y border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-[12px] font-semibold tracking-wider uppercase text-[var(--foreground-secondary)] mb-8">
                    Perfect for every kind of event
                </p>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
                    <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">Weddings</span>
                    <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">College Events</span>
                    <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">Corporate Events</span>
                    <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">Conferences</span>
                    <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">Birthdays</span>
                    <span className="font-bold text-[15px] tracking-tight text-[var(--foreground)]">Parties</span>
                </div>
            </div>
        </motion.section>
    );
}

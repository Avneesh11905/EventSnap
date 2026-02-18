"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function FAQAccordion() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: "How does EventSnap find my photos?",
            a: "When you upload a selfie, our system generates a mathematical representation of your face (an encoding). It then compares this encoding against all the photos in the event album to find matches."
        },
        {
            q: "Do I need to create an account?",
            a: "Attendees typically just need their event code and a quick selfie to get started. Full registration is usually handled seamlessly depending on the organizer's settings."
        },
        {
            q: "What is an Event Code?",
            a: "An event code is a unique 6-character identifier (like ES-7K4P9) created by the event organizer. It ensures that only attendees of that specific event can access its photos."
        },
        {
            q: "How does an organizer upload event photos?",
            a: "Organizers can log into their dashboard, create a new event, and upload photos either individually or in batches. Our background workers handle the processing automatically."
        },
        {
            q: "Can I download all my photos at once?",
            a: "Yes! Once EventSnap finds your matches, you can click 'Download All' to instantly receive a ZIP file containing all your high-quality photos."
        },
        {
            q: "Does EventSnap work on mobile?",
            a: "Absolutely. The entire experience is fully responsive, meaning you can find and download your event photos directly from your smartphone while heading home from the event."
        },
        {
            q: "How is my uploaded photo handled?",
            a: "Your selfie is used strictly for the matching process within that specific event. We prioritize privacy by design and do not use attendee selfies for public galleries."
        }
    ];

    return (
        <section className="py-16 md:py-24 px-6 bg-[var(--background-secondary)] border-b border-[var(--border)]">
            <div className="max-w-3xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight text-[var(--foreground)] mb-4">
                        Common Questions
                    </h2>
                </motion.div>

                <div className="flex flex-col gap-4">
                    {faqs.map((faq, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className="border border-[var(--border)] bg-[var(--card-bg)] rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--card-hover)] transition-colors"
                            >
                                <span className="font-bold text-[15px] text-[var(--foreground)]">{faq.q}</span>
                                <ChevronDown 
                                    className={`w-5 h-5 text-[var(--foreground-secondary)] transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`} 
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-5 pt-1 text-[15px] text-[var(--foreground-secondary)] leading-relaxed">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

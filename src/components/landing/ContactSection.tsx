"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";

export function ContactSection() {
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        // Simulate API call
        setTimeout(() => setStatus("success"), 1500);
    };

    return (
        <section id="contact" className="py-16 md:py-32 px-6 bg-[var(--background-secondary)] border-b border-[var(--border)] overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
                
                {/* Left side text */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-[12px] font-bold tracking-wider uppercase rounded-full mb-6">
                        <MessageSquare className="w-4 h-4" />
                        Get in Touch
                    </div>

                    <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tight text-[var(--foreground)] mb-6 leading-tight">
                        Let's Talk About<br/>
                        <span className="text-[var(--foreground-secondary)]">Your Next Event.</span>
                    </h2>

                    <p className="text-[17px] text-[var(--foreground-secondary)] max-w-md mb-12 leading-relaxed">
                        Have questions about how EventSnap works? Need custom pricing for a massive festival? Send us a message and we'll get back to you within 24 hours.
                    </p>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4 text-[var(--foreground)]">
                            <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center">
                                <Mail className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <div>
                                <p className="text-[13px] text-[var(--foreground-secondary)] font-medium">Email Us</p>
                                <p className="font-medium">hello@eventsnap.com</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right side form */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                >
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
                        {status === "success" ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Message Sent!</h3>
                                <p className="text-[var(--foreground-secondary)] max-w-[250px]">
                                    Thanks for reaching out. We'll get back to you shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="name" className="text-[13px] font-medium text-[var(--foreground-secondary)]">First Name</label>
                                        <input 
                                            type="text" 
                                            id="name" 
                                            required
                                            className="w-full h-12 px-4 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors text-[var(--foreground)]"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email" className="text-[13px] font-medium text-[var(--foreground-secondary)]">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            required
                                            className="w-full h-12 px-4 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors text-[var(--foreground)]"
                                            placeholder="jane@example.com"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="subject" className="text-[13px] font-medium text-[var(--foreground-secondary)]">Subject</label>
                                    <input 
                                        type="text" 
                                        id="subject" 
                                        required
                                        className="w-full h-12 px-4 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors text-[var(--foreground)]"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div className="flex flex-col gap-2 mb-2">
                                    <label htmlFor="message" className="text-[13px] font-medium text-[var(--foreground-secondary)]">Message</label>
                                    <textarea 
                                        id="message" 
                                        required
                                        rows={4}
                                        className="w-full p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition-colors text-[var(--foreground)] resize-none"
                                        placeholder="Tell us about your event..."
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={status === "submitting"}
                                    className="w-full h-12 flex items-center justify-center gap-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--accent)] transition-colors disabled:opacity-70"
                                >
                                    {status === "submitting" ? (
                                        "Sending..."
                                    ) : (
                                        <>
                                            Send Message <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

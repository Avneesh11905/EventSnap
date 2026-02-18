"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import AuthForm from "./AuthForm";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isOpen = searchParams.get("auth") === "login";

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;

    const handleClose = () => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("auth");
        // Using replace so it doesn't clutter history, keeping scroll position
        router.replace(`?${newParams.toString()}`, { scroll: false });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative z-10 w-full max-w-[400px] bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8"
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-6 right-6 p-1.5 rounded-full text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors z-50"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="mt-2">
                            <AuthForm onSuccess={handleClose} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

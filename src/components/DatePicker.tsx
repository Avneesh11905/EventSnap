"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
    value: string; // "YYYY-MM-DD"
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, label, placeholder = "Select date" }: DatePickerProps) {
    const today = new Date();
    const parsed = value ? new Date(value + "T00:00:00") : null;

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Sync view when value changes externally
    useEffect(() => {
        if (parsed) {
            setViewYear(parsed.getFullYear());
            setViewMonth(parsed.getMonth());
        }
    }, [value]);

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectDay = (day: number) => {
        const m = String(viewMonth + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        onChange(`${viewYear}-${m}-${d}`);
        setOpen(false);
    };

    const isSelected = (day: number) =>
        parsed?.getFullYear() === viewYear &&
        parsed?.getMonth() === viewMonth &&
        parsed?.getDate() === day;

    const isToday = (day: number) =>
        today.getFullYear() === viewYear &&
        today.getMonth() === viewMonth &&
        today.getDate() === day;

    const displayValue = parsed
        ? parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "";

    return (
        <div ref={ref} className="relative select-none">
            {label && (
                <label className="block text-[13px] font-medium text-[var(--foreground-secondary)] mb-1.5">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between bg-[var(--card-hover)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 hover:border-[var(--foreground-secondary)]/30 cursor-pointer"
            >
                <span className={displayValue ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)]"}>
                    {displayValue || placeholder}
                </span>
                <Calendar size={15} className="text-[var(--foreground-secondary)] shrink-0" />
            </button>

            {open && (
                <div className="absolute z-50 bottom-full mb-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl shadow-black/50 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1.5 rounded-md hover:bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-[14px] font-semibold text-[var(--foreground)] select-none">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1.5 rounded-md hover:bg-[var(--card-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[11px] font-medium text-[var(--foreground-secondary)] py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const selected = isSelected(day);
                            const todayMark = isToday(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    className={`
                                        relative w-full aspect-square flex items-center justify-center rounded-lg text-[13px] font-medium transition-all
                                        ${selected
                                            ? "bg-sky-500 text-white font-semibold shadow-sm shadow-sky-500/30"
                                            : todayMark
                                            ? "bg-[var(--card-hover)] text-sky-400 ring-1 ring-sky-500/40"
                                            : "text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer: Today shortcut */}
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                const y = today.getFullYear();
                                const m = String(today.getMonth() + 1).padStart(2, "0");
                                const d = String(today.getDate()).padStart(2, "0");
                                onChange(`${y}-${m}-${d}`);
                                setOpen(false);
                            }}
                            className="text-[12px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-[12px] font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

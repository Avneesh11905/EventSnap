import React from "react";
import Sidebar from "@/components/custom/Sidebar";

export default function OrganizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[var(--background)]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen w-full">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}

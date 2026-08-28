import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
    Calendar, 
    ImageIcon, 
    Users, 
    HardDrive,
    TrendingUp,
    BarChart3
} from "lucide-react";

export const metadata = {
    title: "Analytics | EventSnap",
};

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/signin");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        redirect("/signin");
    }

    // Get events for analytics
    const events = await prisma.event.findMany({
        where: { owner_id: user.id },
        include: {
            attendees: true
        }
    });

    const totalEvents = events.length;
    
    const totalPhotos = events.reduce((sum, e) => sum + (e.photo_count || 0), 0);
    const totalSizeMB = events.reduce((sum, e) => sum + (e.total_size_mb || 0), 0);
    const totalAttendees = events.reduce((sum, e) => sum + (e.attendees.length || 0), 0);
    // const totalDownloads = events.reduce((sum, e) => sum + (e.download_count || 0), 0);

    return (
        <div className="py-10 md:py-14 max-w-6xl mx-auto px-6 md:px-8">
            <div className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2 flex items-center gap-3">
                    <BarChart3 className="text-[var(--primary)] w-8 h-8" />
                    Analytics Dashboard
                </h1>
                <p className="text-[15px] text-[var(--foreground-secondary)]">
                    Overview of your event performance and engagement.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--primary)] opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-[var(--foreground-secondary)] text-[12px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-[var(--primary)]" />
                        Total Events
                    </div>
                    <div className="text-4xl font-extrabold text-[var(--foreground)]">{totalEvents}</div>
                    <div className="text-sm text-[var(--foreground-secondary)] mt-2 flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="text-emerald-500 font-medium">All time</span>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500 opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-[var(--foreground-secondary)] text-[12px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ImageIcon size={16} className="text-purple-500" />
                        Photos Processed
                    </div>
                    <div className="text-4xl font-extrabold text-[var(--foreground)]">{totalPhotos.toLocaleString()}</div>
                     <div className="text-sm text-[var(--foreground-secondary)] mt-2">
                        Delivered automatically
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-[var(--foreground-secondary)] text-[12px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        Attendees Reached
                    </div>
                    <div className="text-4xl font-extrabold text-[var(--foreground)]">{totalAttendees.toLocaleString()}</div>
                     <div className="text-sm text-[var(--foreground-secondary)] mt-2">
                        Unique connections
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500 opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
                    <div className="text-[var(--foreground-secondary)] text-[12px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <HardDrive size={16} className="text-amber-500" />
                        Storage Used
                    </div>
                    <div className="text-4xl font-extrabold text-[var(--foreground)]">{totalSizeMB.toFixed(1)} <span className="text-lg">MB</span></div>
                     <div className="text-sm text-[var(--foreground-secondary)] mt-2">
                        Of cloud capacity
                    </div>
                </div>
            </div>
            
            {/* Extended Analytics (Placeholder for future charts) */}
            <div className="mt-12 glass-card rounded-xl p-8 border border-[var(--border)] text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--background-secondary)] mb-4">
                    <TrendingUp size={28} className="text-[var(--foreground-secondary)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">More Insights Coming Soon</h3>
                <p className="text-[var(--foreground-secondary)] max-w-md mx-auto">
                    We're building detailed charts, attendee engagement heatmaps, and gallery download statistics. Check back soon for deeper analytics!
                </p>
            </div>
        </div>
    );
}

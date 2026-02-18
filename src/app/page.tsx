"use client";

import React, { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Landing Components
import { HeroSection } from "@/components/landing/HeroSection";
import { LogoCloud } from "@/components/landing/LogoCloud";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AIMatchingShowcase } from "@/components/landing/AIMatchingShowcase";
import { AttendeeSection } from "@/components/landing/AttendeeSection";
import { OrganizerSection } from "@/components/landing/OrganizerSection";
import { EventCodeSection } from "@/components/landing/EventCodeSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PrivacyTrust } from "@/components/landing/PrivacyTrust";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const handleAuthClick = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        
        if (session) {
            const role = (session.user as any)?.role;
            if (role === "organizer") {
                router.push("/organizer/dashboard");
            } else {
                router.push("/attendee/dashboard");
            }
        } else {
            router.push("?auth=login", { scroll: false });
        }
    };

    const handleOrganizerClick = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        
        if (session) {
            router.push("/organizer/dashboard");
        } else {
            router.push("?auth=login", { scroll: false });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-[var(--primary)] selection:text-white">
            {/* Assemble the massive premium landing page */}
            <main>
                <HeroSection 
                    onAuthClick={handleAuthClick} 
                    onOrganizerClick={handleOrganizerClick} 
                />
                <LogoCloud />
                <ProblemSection />
                <HowItWorks />
                <AIMatchingShowcase onAuthClick={handleAuthClick} />
                <AttendeeSection onAuthClick={handleAuthClick} />
                <OrganizerSection onAuthClick={handleOrganizerClick} />
                <EventCodeSection />
                <FeaturesGrid />
                <PrivacyTrust />
                <FAQAccordion />
                <ContactSection />
            </main>

            <Footer />
        </div>
    );
}

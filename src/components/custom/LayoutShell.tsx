"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/custom/Navbar";
import AuthModal from "@/components/custom/AuthModal";

const HIDE_NAVBAR_ROUTES = [
    "/organizer/upload",
    "/signin",
];

export default function LayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const showNavbar = !HIDE_NAVBAR_ROUTES.some((route) => pathname.startsWith(route));

    return (
        <>
            <Suspense fallback={null}>
                <AuthModal />
            </Suspense>
            {showNavbar && <Navbar />}
            <main>{children}</main>
        </>
    );
}

import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/signin",
    },
});

export const config = {
    matcher: [
        "/organizer/events",
        "/organizer/events/:path*",
        "/attendee/dashboard/:path*",
        "/attendee/events/:path*",
        "/attendee/sort/:path*",
    ],
};

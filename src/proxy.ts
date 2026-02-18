import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/signin",
    },
});

export const config = {
    matcher: [
        "/organizer/dashboard/:path*",
        "/organizer/events/:path*",
        "/attendee/dashboard/:path*",
        "/attendee/events/:path*",
        "/attendee/sort/:path*",
    ],
};

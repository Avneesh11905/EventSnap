# Eventsnap — Find Your Event Photos Instantly

Eventsnap is an AI-powered photo platform designed to make event memories accessible to everyone. No more hunting through huge galleries or waiting days for a link. Just upload a selfie and let our AI do the work.

## 📸 For Attendees: Find Yourself in Seconds

Experience the magic of instant photo matching.

- **Instantly Find Your Photos**: Our advanced facial recognition scans through entire event galleries to find every photo you're in.
- **Guided Face Scan**: A simple, 3-angle selfie capture ensures we find your best shots from every perspective.
- **Private & Direct**: No need to browse through other people's photos. You get a personalized gallery just for you.
- **High-Quality Downloads**: Receive your matched photos in high resolution, ready for social media or print.

## 🎪 For Organizers: Elevate Your Event Experience

Give your guests something to talk about with zero extra effort.

- **Effortless Distribution**: Simply upload your event's photos as a ZIP file, and Eventsnap handles the rest.
- **Unique Event Codes**: Generate simple, shareable codes (e.g., `GALA24`) that guests can use to access their personalized photos.
- **Real-Time Indexing**: Our AI indexes photos as they are uploaded, making them available to guests almost immediately.
- **Simple Dashboard**: Track guest engagement and manage multiple events from one clean, professional interface.

## 🚀 How It Works

1.  **Organizer Creates Event**: An organizer creates a new event and receives a unique code.
2.  **Photos are Uploaded**: The organizer uploads the full event gallery.
3.  **Attendees Join**: Guests go to the event link, enter the code, and take a quick selfie scan.
4.  **Instant Matching**: Eventsnap matches the selfie to the gallery and presents the guest with their personal photos.

---

## 💻 Local Development Setup

This project uses **Bun**, **Next.js**, **Prisma 7**, and **Infisical** (for secure, in-memory secrets injection).

### 1. Install Dependencies
```bash
bun install
```
*(Note: This will automatically generate the Prisma Client using our custom Infisical secrets wrapper.)*

### 2. Configure Environment Variables
We use Infisical to securely inject secrets directly into memory. 
1. Copy `.env.example` to `.env`.
2. Add your `INFISICAL_TOKEN` (or Machine Identity credentials) to the `.env` file. 

*(If you are not using Infisical, you can just manually fill out the raw variables inside `.env` and the app will natively fall back to using them.)*

### 3. Database Commands
Because we inject secrets dynamically, do not use the raw `prisma` CLI. Instead, use our custom Bun shortcuts:
```bash
bun db:push     # Push schema changes to your database
bun db:migrate  # Run migration files
bun db:studio   # Open Prisma Studio to view your database
```

### 4. Start the Dev Server
```bash
bun run dev
```
The application will boot up on `http://localhost:3000`.

---

*Eventsnap — Making event photo sharing personal.*

/*
  Warnings:

  - You are about to drop the column `matched_photos` on the `event_attendees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_attendees" DROP COLUMN "matched_photos";

-- CreateTable
CREATE TABLE "matched_photos" (
    "id" TEXT NOT NULL,
    "event_attendee_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matched_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matched_photos_event_attendee_id_idx" ON "matched_photos"("event_attendee_id");

-- CreateIndex
CREATE INDEX "event_attendees_attendee_id_idx" ON "event_attendees"("attendee_id");

-- CreateIndex
CREATE INDEX "events_owner_id_idx" ON "events"("owner_id");

-- AddForeignKey
ALTER TABLE "matched_photos" ADD CONSTRAINT "matched_photos_event_attendee_id_fkey" FOREIGN KEY ("event_attendee_id") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

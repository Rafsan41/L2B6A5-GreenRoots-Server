-- AlterTable
ALTER TABLE "medicines" ADD COLUMN     "dosageAdults" TEXT,
ADD COLUMN     "dosageChildren" TEXT,
ADD COLUMN     "dosageMaxDaily" TEXT,
ADD COLUMN     "dosageNotes" TEXT,
ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keyBadges" TEXT[],
ADD COLUMN     "sideEffects" TEXT[],
ADD COLUMN     "storage" TEXT,
ADD COLUMN     "uses" TEXT[];

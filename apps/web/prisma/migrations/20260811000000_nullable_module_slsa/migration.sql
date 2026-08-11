-- Module.slsa is no longer claimed by the republish pipeline.
-- Make the column nullable so new writes can set null.
ALTER TABLE "Module" ALTER COLUMN "slsa" DROP NOT NULL;

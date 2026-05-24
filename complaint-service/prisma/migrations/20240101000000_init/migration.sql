-- CreateEnum
CREATE TYPE "Department" AS ENUM ('WATER', 'ELECTRICITY', 'ROADS', 'HEALTH', 'SANITATION', 'EDUCATION', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "citizenEmail" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "slaHours" DOUBLE PRECISION NOT NULL,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "assignedOfficerId" TEXT,
    "assignedOfficerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintEvent" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComplaintEvent" ADD CONSTRAINT "ComplaintEvent_complaintId_fkey"
    FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

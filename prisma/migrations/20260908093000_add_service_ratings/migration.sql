CREATE TABLE "ServiceRating" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "foodQuality" INTEGER,
    "customerService" INTEGER,
    "staffFriendliness" INTEGER,
    "speedOfService" INTEGER,
    "cleanliness" INTEGER,
    "ambiance" INTEGER,
    "valueForMoney" INTEGER,
    "overallExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceRating_reviewId_key" ON "ServiceRating"("reviewId");

ALTER TABLE "ServiceRating" ADD CONSTRAINT "ServiceRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

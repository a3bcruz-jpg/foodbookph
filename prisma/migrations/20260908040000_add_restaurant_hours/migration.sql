-- Add restaurant business hours
CREATE TABLE "RestaurantHours" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "openTime" TEXT,
  "closeTime" TEXT,
  CONSTRAINT "RestaurantHours_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestaurantHours_restaurantId_dayOfWeek_key" ON "RestaurantHours"("restaurantId", "dayOfWeek");
CREATE INDEX "RestaurantHours_restaurantId_dayOfWeek_idx" ON "RestaurantHours"("restaurantId", "dayOfWeek");

ALTER TABLE "RestaurantHours" ADD CONSTRAINT "RestaurantHours_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

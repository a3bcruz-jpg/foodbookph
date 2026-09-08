import { getPrisma } from "@/lib/prisma";

export type OwnerHourInput = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
};

const validDays = new Set([0, 1, 2, 3, 4, 5, 6]);
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateHour(input: OwnerHourInput) {
  if (!validDays.has(input.dayOfWeek)) return "Invalid day of week.";
  if (input.isClosed) return null;
  if (!input.openTime || !input.closeTime) return "Open and close times are required for an open day.";
  if (!timePattern.test(input.openTime) || !timePattern.test(input.closeTime)) return "Times must use HH:MM format.";
  return null;
}

async function ownedRestaurant(userId: string, restaurantId?: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma.restaurant.findFirst({
    where: {
      ...(restaurantId ? { id: restaurantId } : {}),
      memberships: { some: { userId, role: { in: ["OWNER", "MANAGER"] } } },
    },
    select: { id: true },
  });
}

export async function getOwnerHours(userId: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const restaurant = await ownedRestaurant(userId);
  if (!restaurant) return null;
  const hours = await prisma.restaurantHours.findMany({ where: { restaurantId: restaurant.id }, orderBy: { dayOfWeek: "asc" } });
  return { restaurantId: restaurant.id, hours };
}

export async function saveOwnerHours(userId: string, restaurantId: string, input: OwnerHourInput[]) {
  const prisma = getPrisma();
  if (!prisma) return null;
  const restaurant = await ownedRestaurant(userId, restaurantId);
  if (!restaurant) return null;
  if (input.length !== 7) throw new Error("Exactly seven days are required.");
  const seen = new Set<number>();
  for (const day of input) {
    if (seen.has(day.dayOfWeek)) throw new Error("Each day can only appear once.");
    seen.add(day.dayOfWeek);
    const error = validateHour(day);
    if (error) throw new Error(error);
  }
  return prisma.$transaction(async (transaction) => {
    for (const day of input) {
      await transaction.restaurantHours.upsert({
        where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: day.dayOfWeek } },
        update: { isClosed: day.isClosed, openTime: day.isClosed ? null : day.openTime, closeTime: day.isClosed ? null : day.closeTime },
        create: { restaurantId: restaurant.id, dayOfWeek: day.dayOfWeek, isClosed: day.isClosed, openTime: day.isClosed ? null : day.openTime, closeTime: day.isClosed ? null : day.closeTime },
      });
    }
    return transaction.restaurantHours.findMany({ where: { restaurantId: restaurant.id }, orderBy: { dayOfWeek: "asc" } });
  });
}

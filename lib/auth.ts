export type Role = "CUSTOMER" | "RESTAURANT_OWNER" | "ADMIN";

export type SessionUser = { id: string; email: string; roles: Role[] };

export function hasRole(user: SessionUser | null, role: Role) {
  return Boolean(user?.roles.includes(role));
}

export function canManageRestaurant(user: SessionUser | null, restaurantId: string, memberships: Array<{ userId: string; restaurantId: string }>) {
  return Boolean(user && memberships.some((membership) => membership.userId === user.id && membership.restaurantId === restaurantId));
}

export function canReviewRestaurant(user: SessionUser | null, restaurantId: string, memberships: Array<{ userId: string; restaurantId: string }>) {
  return Boolean(user && !canManageRestaurant(user, restaurantId, memberships));
}

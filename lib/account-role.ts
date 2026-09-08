import type { AccountRole } from "@/lib/account-store";

export const CUSTOMER_ROLE = "CUSTOMER" as const;
export const RESTAURANT_OWNER_ROLE = "RESTAURANT_OWNER" as const;

export function isCustomerAccount(roles: AccountRole[] | string[]) {
  return roles.includes(CUSTOMER_ROLE) && !roles.includes(RESTAURANT_OWNER_ROLE);
}

export function isRestaurantOwnerAccount(roles: AccountRole[] | string[]) {
  return roles.includes(RESTAURANT_OWNER_ROLE) && !roles.includes(CUSTOMER_ROLE);
}

export function isAdminAccount(roles: AccountRole[] | string[]) {
  return roles.includes("ADMIN");
}

export function hasExclusiveAccountRole(roles: AccountRole[] | string[], role: "CUSTOMER" | "RESTAURANT_OWNER") {
  return role === "CUSTOMER" ? isCustomerAccount(roles) : isRestaurantOwnerAccount(roles);
}

"use client";

import { apiFetch } from "./utils";

export const SELLER_ROLES = new Set(["SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]);

export function hasSellerAccess(role?: string | null) {
  return Boolean(role && SELLER_ROLES.has(role));
}

type BecomeSellerResponse = {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: string;
      avatar: string | null;
      isActive: boolean;
      createdAt: string;
    };
  };
};

export function becomeSeller(token: string) {
  return apiFetch<BecomeSellerResponse>("/users/me/become-seller", {
    method: "POST",
    token,
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "./utils";

function useToken() {
  const { data: session } = useSession();
  return session?.user?.accessToken;
}

export function useApiQuery<T>(key: string[], endpoint: string, opts?: { enabled?: boolean; auth?: boolean }) {
  const token = useToken();
  const authEnabled = opts?.auth !== false;
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiFetch<T>(endpoint, authEnabled && token ? { token } : undefined),
    enabled: opts?.enabled !== false && (!authEnabled || !!token),
  });
}

export function useFeaturedProperties() {
  return useApiQuery<{ success: boolean; data: unknown[] }>(
    ["properties", "featured"],
    "/properties/featured",
    { auth: false }
  );
}

export function useDashboardStats() {
  const token = useToken();
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch<{ success: boolean; data: Record<string, unknown> }>("/users/me/stats", { token: token! }),
    enabled: !!token,
  });
}

export function useFavorites() {
  const token = useToken();
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiFetch<{ success: boolean; data: unknown[] }>("/favorites", { token: token! }),
    enabled: !!token,
  });
}

export function useRemoveFavorite() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) =>
      apiFetch(`/favorites/${propertyId}`, { method: "DELETE", token: token! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

export interface SavedSearchItem {
  id: string;
  name: string | null;
  type: string | null;
  listingType: string | null;
  state: string | null;
  district: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  search: string | null;
  active: boolean;
  createdAt: string;
}

export function useSavedSearches() {
  const token = useToken();
  return useQuery({
    queryKey: ["saved-searches"],
    queryFn: () => apiFetch<{ success: boolean; data: SavedSearchItem[] }>("/saved-searches", { token: token! }),
    enabled: !!token,
  });
}

export function useCreateSavedSearch() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<SavedSearchItem, "id" | "active" | "createdAt">>) =>
      apiFetch<{ success: boolean; data: SavedSearchItem }>("/saved-searches", {
        method: "POST",
        body: JSON.stringify(data),
        token: token!,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
}

export function useUpdateSavedSearch() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; active?: boolean; name?: string }) =>
      apiFetch(`/saved-searches/${id}`, { method: "PATCH", body: JSON.stringify(data), token: token! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
}

export function useDeleteSavedSearch() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/saved-searches/${id}`, { method: "DELETE", token: token! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
  });
}

export function useMyInquiries(status?: string) {
  const token = useToken();
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  return useQuery({
    queryKey: ["inquiries", "mine", status || "ALL"],
    queryFn: () => apiFetch<{ success: boolean; data: unknown[] }>(`/inquiries?${params}`, { token: token! }),
    enabled: !!token,
  });
}

export function useMyProperties() {
  const token = useToken();
  return useQuery({
    queryKey: ["properties", "mine"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: unknown[] }>("/properties?ownerId=me&limit=100", { token: token! }),
    enabled: !!token,
  });
}

export function useProfile() {
  const token = useToken();
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch<{ success: boolean; data: Record<string, unknown> }>("/users/me", { token: token! }),
    enabled: !!token,
  });
}

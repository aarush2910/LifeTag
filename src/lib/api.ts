// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const userId = localStorage.getItem("user_id") || localStorage.getItem("farmerId");
  const vetId = localStorage.getItem("vet_id");
  const shelterId = localStorage.getItem("shelter_id");
  const inaphId = localStorage.getItem("inaph_id");

  const headers = new Headers(opts.headers || {}); //making headers as per the reading values from local storage
  // set JSON if not present
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (role) headers.set("x-role", role);

  // Role-aware headers
  if (role === "farmer") {
    if (userId) headers.set("x-owner-id", userId);
    if (inaphId) headers.set("x-inaph-id", inaphId);
  } else if (role === "vet") {
    if (vetId) headers.set("x-vet-id", vetId);
    // also provide user_id for compatibility if present
    if (userId) headers.set("x-owner-id", userId);
  } else if (role === "shelter") {
    if (shelterId) headers.set("x-shelter-id", shelterId);
    if (userId) headers.set("x-owner-id", userId);
  } else {
    // unknown role: still attach any IDs present
    if (userId) headers.set("x-owner-id", userId);
    if (inaphId) headers.set("x-inaph-id", inaphId);
    if (vetId) headers.set("x-vet-id", vetId);
    if (shelterId) headers.set("x-shelter-id", shelterId);
  }


   console.log(">>> Headers being sent:", Object.fromEntries(headers.entries()));
   
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });
}

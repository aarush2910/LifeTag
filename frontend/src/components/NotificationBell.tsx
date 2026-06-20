// NotificationBell.tsx
// Notification bell icon with dropdown panel for the Farmer (and other) dashboards.
// Uses GET /api/notifications/ and GET /api/notifications/unread-count
// Both endpoints use the x-user-id header (UUID) and Authorization (Bearer token).

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function getAuthHeaders(): Record<string, string> {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    const token = u.access_token || u.token || "";
    // Different roles store their ID under different keys
    const userId = u.user_id || u.vet_id || u.shelter_id || u.fid || "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    // Only add x-user-id if we actually have a value — an empty string causes 400
    if (userId) headers["x-user-id"] = String(userId);
    return headers;
  } catch {
    return { "Content-Type": "application/json" };
  }
}

function formatDateTime(dateStr: string): string {
  // Backend (PostgreSQL naive datetime) sends UTC without timezone marker.
  // Append 'Z' so JS correctly interprets it as UTC → converts to local IST.
  const normalized = dateStr && !dateStr.endsWith("Z") && !dateStr.includes("+")
    ? dateStr + "Z"
    : dateStr;
  const date = new Date(normalized);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000) return "Just now";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ───── Fetch unread count (poll every 30s) ─────
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setUnread(d.unread_count ?? 0);
      }
    } catch { /* offline = silent */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const timer = setInterval(fetchUnread, 30_000);
    return () => clearInterval(timer);
  }, [fetchUnread]);

  // ───── Close on outside click ─────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ───── Fetch notifications when panel opens ─────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/?limit=20`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.results ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = () => {
    setOpen(prev => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  };

  // ───── Mark single notification as read ─────
  const markRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  // ───── Mark all as read ─────
  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 ring-2 ring-background">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border bg-background shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}

            {!loading && notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

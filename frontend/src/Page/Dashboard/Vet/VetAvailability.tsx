import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { Clock, Calendar, Check, AlertCircle, Pencil, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

type AvailabilityRow = {
  vet_id: string;
  available_date: string;
  work_start: string;
  work_end: string;
  slot_minutes: number;
  slots?: string[];
};

export default function VetAvailability() {
  const user = getUser();
  const vetId = user.vet_id || user.user_id || "";
  const token = user.access_token || user.token || "";

  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(vetId ? { "x-user-id": vetId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [configuredDates, setConfiguredDates] = useState<AvailabilityRow[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState("");

  const fetchSlotsForDate = async (d: string) => {
    if (!vetId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/vet/appointments/availability/${vetId}?appointment_date=${d}`
      );
      if (!res.ok) { setPreviewSlots([]); return; }
      const data = await res.json() as AvailabilityRow;
      setWorkStart(data.work_start || "09:00");
      setWorkEnd(data.work_end || "17:00");
      setSlotMinutes(data.slot_minutes || 30);
      setPreviewSlots(data.slots || []);
    } catch { setPreviewSlots([]); }
  };

  const fetchConfiguredDates = async () => {
    if (!vetId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/vet/appointments/availability/me/list?days=60`,
        { headers: { "x-user-id": vetId, ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setConfiguredDates(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchSlotsForDate(selectedDate); }, [selectedDate]);
  useEffect(() => { fetchConfiguredDates(); }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetId) return;
    setLoading(true); setSaveStatus("idle");
    try {
      const res = await fetch(`${API_BASE}/api/vet/appointments/availability/me`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          available_date: selectedDate,
          work_start: workStart,
          work_end: workEnd,
          slot_minutes: Number(slotMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to save");
      setSaveStatus("success");
      setSaveMsg(
        `Saved for ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
          weekday: "long", day: "numeric", month: "long",
        })}`
      );
      await fetchSlotsForDate(selectedDate);
      await fetchConfiguredDates();
      setTimeout(() => setSaveStatus("idle"), 5000);
    } catch (err: any) {
      setSaveStatus("error");
      setSaveMsg(err?.message || "Could not save");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally { setLoading(false); }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Availability</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your working hours and appointment slots for each date
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-muted/30">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="font-semibold">Set Availability</h2>
        </div>

        <div className="p-6">
          <form onSubmit={onSave} className="space-y-5">
            {/* Date Picker */}
            <div className="space-y-1.5">
              <Label htmlFor="avail-date" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Availability Date
              </Label>
              <Input
                id="avail-date" type="date" value={selectedDate} min={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 max-w-[240px]" required
              />
              {selectedDate && (
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Times + Slot */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="work-start">Working Start</Label>
                <Input
                  id="work-start" type="time" value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)} className="h-10" required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="work-end">Working End</Label>
                <Input
                  id="work-end" type="time" value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)} className="h-10" required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slot-min">Slot Duration</Label>
                <select
                  id="slot-min" value={slotMinutes}
                  onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[15, 20, 30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slot Preview */}
            {previewSlots.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {previewSlots.length} slots currently configured for {selectedDate}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewSlots.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-md border bg-muted/50 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            {saveStatus !== "idle" && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                saveStatus === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              }`}>
                {saveStatus === "success"
                  ? <Check className="w-4 h-4" />
                  : <AlertCircle className="w-4 h-4" />}
                {saveMsg}
              </div>
            )}

            <Button type="submit" disabled={loading} className="gap-2">
              {loading
                ? <><Spinner size={14} /> Saving...</>
                : <><Check className="w-4 h-4" /> Save Availability</>}
            </Button>
          </form>
        </div>
      </div>

      {/* Configured Dates List */}
      {configuredDates.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="font-semibold">Upcoming Configured Dates</h2>
            </div>
            <button
              onClick={fetchConfiguredDates}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="p-4 space-y-2">
            {configuredDates.map((row) => (
              <div
                key={`${row.vet_id}-${row.available_date}`}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/30 ${
                  row.available_date === selectedDate ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(row.available_date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.work_start} – {row.work_end} &nbsp;·&nbsp; {row.slot_minutes} min slots
                  </p>
                </div>
                <Button
                  type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    setSelectedDate(row.available_date);
                    setWorkStart(row.work_start);
                    setWorkEnd(row.work_end);
                    setSlotMinutes(row.slot_minutes);
                  }}
                >
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

export default function RetirementForm() {
  const user = getUser();
  const [cattleList, setCattleList] = useState<any[]>([]);
  const [shelterList, setShelterList] = useState<any[]>([]);
  const [shelterSearch, setShelterSearch] = useState("");
  const [form, setForm] = useState({ cattle_id: "", reason: "Retirement", notes: "", shelter_id: "" });
  const [loading, setLoading] = useState(false);
  const [fetchingCattle, setFetchingCattle] = useState(true);
  const [fetchingShelters, setFetchingShelters] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  const token = user.access_token || user.token || "";
  const userId = user.user_id || "";

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-user-id": userId,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    // Fetch cattle list — use user_id (UUID) as identifier so backend finds via fid
    const fetchCattle = async () => {
      try {
        const identifier = userId || user.faadhar || user.identifier || user.user_name;
        const res = await fetch(`${API_BASE}/api/auth/farmer-info?identifier=${identifier}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.cattles) {
          console.log("🐄 Cattle from API:", data.cattles);
          setCattleList(data.cattles);
          // pre-select first cattle if available
          const first = data.cattles[0];
          const firstId = first?.cid || first?.id || "";
          console.log("🐄 Pre-selecting cattle_id:", firstId, "| full object:", first);
          if (firstId) setForm(f => ({ ...f, cattle_id: firstId }));
        } else {
          console.warn("⚠️ Cattle fetch failed or no cattles:", res.status, data);
        }
      } catch (e) { console.error(e); }
      finally { setFetchingCattle(false); }
    };

    // Fetch all shelters from DB
    const fetchShelters = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/shelter/list`);
        const data = await res.json();
        if (res.ok) setShelterList(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      finally { setFetchingShelters(false); }
    };

    // Fetch existing requests
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/farmer/retirement-requests`, {
          headers: { Authorization: `Bearer ${token}`, "x-user-id": userId },
        });
        if (res.ok) {
          const data = await res.json();
          setRequests(Array.isArray(data) ? data : []);
        }
      } catch (e) { console.error(e); }
      finally { setFetchingRequests(false); }
    };

    fetchCattle();
    fetchShelters();
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cattle_id) { setError("Please select a cattle."); return; }
    if (!form.shelter_id) { setError("Please select a shelter."); return; }
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const payload = {
        farmer_id: userId,
        cattle_id: form.cattle_id,
        reason: form.reason,
        notes: form.notes || null,
        shelter_id: form.shelter_id,
      };
      console.log("📤 Submitting retirement request:", payload);
      const res = await fetch(`${API_BASE}/api/farmer/retirement-request`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("📥 Response:", res.status, data);
      if (!res.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
          : (data.detail || "Failed to submit");
        throw new Error(detail);
      }
      setSuccess(true);
      setRequests(prev => [data, ...prev]);
      setForm(f => ({ ...f, notes: "", shelter_id: "" }));
      setShelterSearch("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "Approved") return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (s === "Rejected") return "text-red-600 bg-red-50 dark:bg-red-900/20";
    return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
  };

  // Safe filter — guard against null/undefined saddress
  const filteredShelters = shelterList.filter(s => {
    const name = (s.sname || "").toLowerCase();
    const addr = (s.saddress || "").toLowerCase();
    const q = shelterSearch.toLowerCase();
    return name.includes(q) || addr.includes(q);
  });

  const selectedShelter = shelterList.find(s => s.sid === form.shelter_id);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Retirement / Transfer Form</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a retirement or death notice for your cattle. Select a shelter to send the request directly to them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-card shadow-sm p-6 space-y-5">
        {/* Select Cattle */}
        <div className="space-y-1.5">
          <Label htmlFor="cattle">Select Cattle *</Label>
          {fetchingCattle ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner size={14} /> Loading cattle...</div>
          ) : cattleList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No cattle registered under your account.</p>
          ) : (
            <select
              id="cattle"
              value={form.cattle_id}
              onChange={e => setForm(f => ({ ...f, cattle_id: e.target.value }))}
              required
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            >
              <option value="">-- Select a cattle --</option>
              {cattleList.map((c: any) => {
                const id = c.cid || c.id || "";
                const tag = c.cattle_tag_id || c.inaph_tag_id || c.local_cattle_id || "No Tag";
                return (
                  <option key={id} value={id}>
                    {c.cattle_name} — {tag}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Select Shelter */}
        <div className="space-y-1.5">
          <Label htmlFor="shelter">Select Shelter *</Label>
          {fetchingShelters ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner size={14} /> Loading shelters...</div>
          ) : shelterList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No shelters available in the system.</p>
          ) : (
            <div className="space-y-2">
              {/* Search filter */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or address..."
                  value={shelterSearch}
                  onChange={e => setShelterSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-md border bg-background text-sm"
                />
              </div>

              {/* Shelter dropdown */}
              <select
                id="shelter"
                value={form.shelter_id}
                onChange={e => setForm(f => ({ ...f, shelter_id: e.target.value }))}
                required
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">-- Select a shelter --</option>
                {filteredShelters.map((s: any) => (
                  <option key={s.sid} value={s.sid}>
                    {s.sname}{s.saddress ? ` — ${s.saddress}` : ""}{s.scapacity ? ` (Cap: ${s.scapacity})` : ""}
                  </option>
                ))}
              </select>

              {/* Selected shelter info card */}
              {selectedShelter && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm space-y-0.5">
                  <div className="font-semibold">✅ {selectedShelter.sname}</div>
                  {selectedShelter.saddress && <div className="text-muted-foreground text-xs">📍 {selectedShelter.saddress}</div>}
                  {selectedShelter.sphone && <div className="text-muted-foreground text-xs">📞 {selectedShelter.sphone}</div>}
                  {selectedShelter.scapacity && <div className="text-muted-foreground text-xs">🏠 Capacity: {selectedShelter.scapacity}</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason *</Label>
          <select
            id="reason"
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            required
            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
          >
            <option value="Retirement">Retirement (Transfer to Shelter)</option>
            <option value="Death">Death (Death Notice)</option>
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Additional Notes</Label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Health condition, reason for retirement, etc."
            className="w-full px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">✓ Request submitted to shelter! They will review it shortly.</p>}

        <Button type="submit" disabled={loading || !form.cattle_id || !form.shelter_id} className="w-full">
          {loading ? <><Spinner size={16} /> Submitting...</> : "Submit Request to Selected Shelter"}
        </Button>
      </form>

      {/* Previous Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-3">My Previous Requests</h2>
        {fetchingRequests ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner size={14} /> Loading...</div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No requests submitted yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Cattle</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((r: any) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.cattle_name || r.cattle_id}</td>
                    <td className="px-4 py-3">{r.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import Spinner from "../../components/ui/spinner";
import { AlertCircle, PlusCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

export default function HealthRecords() {
  const user = getUser();
  const userId = user.user_id || user.sid || "";
  const token = user.access_token || user.token || "";

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-user-id": userId,
    "Content-Type": "application/json",
  };

  // Form state
  const [form, setForm] = useState({
    cattle_id: "",
    vet_id: "",
    record_type: "Vaccination",
    description: "",
    medicine: "",
    record_date: new Date().toISOString().split("T")[0],
  });

  // Dropdown data
  const [cattleList, setCattleList] = useState<any[]>([]);
  const [vetList, setVetList] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  // UI state
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) { setLoadingDropdowns(false); return; }

    Promise.all([
      // Shelter's accepted cattle
      fetch(`${API_BASE}/api/shelter/cattle`, {
        headers: { Authorization: `Bearer ${token}`, "x-user-id": userId },
      }).then(r => r.json()).catch(() => []),
      // All vets (public endpoint)
      fetch(`${API_BASE}/api/vet/appointments/vets`).then(r => r.json()).catch(() => []),
      // Existing health records
      fetch(`${API_BASE}/api/shelter/health-records`, {
        headers: { Authorization: `Bearer ${token}`, "x-user-id": userId },
      }).then(r => r.json()).catch(() => []),
    ]).then(([cattle, vets, records]) => {
      setCattleList(Array.isArray(cattle) ? cattle : []);
      setVetList(Array.isArray(vets) ? vets : []);
      setTimeline(Array.isArray(records) ? records : []);
      // Auto-select first cattle
      if (Array.isArray(cattle) && cattle.length > 0) {
        setForm(f => ({ ...f, cattle_id: cattle[0].cid }));
      }
    }).finally(() => setLoadingDropdowns(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!form.cattle_id) { setError("Please select a cattle."); setSubmitting(false); return; }
    if (!form.description.trim()) { setError("Description is required."); setSubmitting(false); return; }

    try {
      const res = await fetch(`${API_BASE}/api/shelter/health-records`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          cattle_id: form.cattle_id,
          vet_id: form.vet_id || null,
          record_type: form.record_type,
          description: form.description.trim(),
          medicine: form.medicine.trim() || null,
          record_date: form.record_date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("✅ Health record saved successfully!");
        setTimeline(prev => [data, ...prev]);
        setForm(f => ({ ...f, description: "", medicine: "" }));
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.detail || "Failed to save record");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const typeBadgeColor = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("vaccination")) return "text-blue-600 border-blue-400";
    if (t.includes("sick")) return "text-red-600 border-red-400";
    if (t.includes("checkup")) return "text-green-600 border-green-400";
    return "text-yellow-600 border-yellow-400";
  };

  return (
    <div className="p-4 space-y-6">
      {/* Add Health Record Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="w-5 h-5 text-primary" />
            Add Health Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDropdowns ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner size={16} /> Loading...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Cattle */}
              <div className="space-y-1.5">
                <Label>Select Animal *</Label>
                {cattleList.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No animals under shelter care yet.</p>
                ) : (
                  <select
                    value={form.cattle_id}
                    onChange={e => setForm(f => ({ ...f, cattle_id: e.target.value }))}
                    required
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="">Choose animal...</option>
                    {cattleList.map((c: any) => (
                      <option key={c.cid} value={c.cid}>
                        {c.cattle_name} — {c.inaph_tag_id || c.local_cattle_id || "No Tag"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Vet (from DB) */}
              <div className="space-y-1.5">
                <Label>Vet (optional)</Label>
                <select
                  value={form.vet_id}
                  onChange={e => setForm(f => ({ ...f, vet_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">Select vet (optional)...</option>
                  {vetList.map((v: any) => (
                    <option key={v.vid} value={v.vid}>
                      Dr. {v.name} {v.specialization ? `(${v.specialization})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Record Type */}
              <div className="space-y-1.5">
                <Label>Record Type *</Label>
                <select
                  value={form.record_type}
                  onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))}
                  required
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="Vaccination">Vaccination</option>
                  <option value="Sick">Sick / Treatment</option>
                  <option value="Checkup">Regular Checkup</option>
                  <option value="Deworming">Deworming</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Record Date */}
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <input
                  type="date"
                  value={form.record_date}
                  onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))}
                  required
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Medicine */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Medicine Used</Label>
                <input
                  type="text"
                  placeholder="e.g. FMD Vac-20, ORS"
                  value={form.medicine}
                  onChange={e => setForm(f => ({ ...f, medicine: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the treatment, symptoms, findings..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  rows={3}
                />
              </div>

              {error && (
                <div className="sm:col-span-2 flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              {success && (
                <div className="sm:col-span-2 text-green-600 text-sm font-medium">{success}</div>
              )}

              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting || cattleList.length === 0} className="gap-2">
                  {submitting ? <><Spinner size={14} /> Saving...</> : "Save Record"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Health Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No health records yet.</p>
          ) : (
            <ul className="space-y-4">
              {timeline.map((entry: any, i: number) => (
                <li key={entry.id || i} className={`border-l-4 pl-4 ${typeBadgeColor(entry.record_type)}`}>
                  <p className="font-semibold text-sm">{entry.record_type} — {entry.record_date}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Animal: {entry.cattle_name || entry.cattle_id}
                    {entry.vet_name && ` | Vet: Dr. ${entry.vet_name}`}
                    {entry.medicine && ` | Medicine: ${entry.medicine}`}
                  </p>
                  <p className="text-sm mt-1">{entry.description}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
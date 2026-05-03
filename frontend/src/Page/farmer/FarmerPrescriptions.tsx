import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function downloadPDF(record: any, type: "prescription" | "event" = "prescription") {
  const now = new Date().toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const content = type === "prescription"
    ? `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Prescription — ${record.appointment_code || "N/A"}</title>
<style>
* { margin:0;padding:0;box-sizing:border-box }
body { font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:0 }
.page { max-width:740px;margin:0 auto;padding:40px 48px;min-height:100vh;display:flex;flex-direction:column }
.header { display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #e67200;padding-bottom:18px;margin-bottom:24px }
.brand { display:flex;align-items:center;gap:12px }
.brand-icon { width:44px;height:44px;background:#e67200;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:bold }
.brand-name { font-size:22px;font-weight:800;color:#e67200;letter-spacing:-0.5px }
.brand-sub { font-size:11px;color:#777 }
.rx-badge { font-size:52px;font-weight:900;color:#e67200;opacity:0.15;font-style:italic;line-height:1 }
h1 { font-size:18px;font-weight:700;color:#1a1a1a }
.code-badge { display:inline-block;background:#fff4e6;border:1px solid #e67200;color:#e67200;font-size:12px;font-weight:700;border-radius:6px;padding:3px 10px;margin-left:10px;font-family:monospace }
.info-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;background:#f9f9f9;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #eee }
.info-item { display:flex;flex-direction:column;gap:2px }
.info-label { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#999 }
.info-value { font-size:13px;font-weight:600;color:#222 }
.section { margin-bottom:20px }
.section-label { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#e67200;margin-bottom:6px;border-left:3px solid #e67200;padding-left:8px }
.section-value { font-size:14px;color:#333;line-height:1.6;background:#f9f9f9;border-radius:8px;padding:12px 16px;white-space:pre-wrap }
.medicine-tag { display:inline-block;background:#fff4e6;border:1px solid #ffd0a0;border-radius:20px;padding:4px 12px;font-size:12px;color:#c05800;font-weight:600;margin:3px 4px 3px 0 }
.footer { margin-top:auto;padding-top:24px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end }
.footer-left { font-size:11px;color:#aaa;line-height:1.6 }
.signature-box { border-top:1.5px solid #555;width:160px;text-align:center;padding-top:6px;font-size:11px;color:#777 }
@media print { .page{padding:24px 32px}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="brand"><div class="brand-icon">L</div><div><div class="brand-name">LifeTag</div><div class="brand-sub">Veterinary Health Platform</div></div></div>
    <div class="rx-badge">Rx</div>
  </div>
  <div style="margin-bottom:24px">
    <h1 style="display:inline">Veterinary Prescription</h1>
    <span class="code-badge">${record.appointment_code || "N/A"}</span>
    <div style="font-size:12px;color:#999;margin-top:6px">Issued: ${now}</div>
  </div>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Farmer INAPH ID</span><span class="info-value">${record.inaph_id || "—"}</span></div>
    <div class="info-item"><span class="info-label">Cattle ID / Tag</span><span class="info-value">${record.cattle_id || "—"}</span></div>
    <div class="info-item"><span class="info-label">Follow-up Date</span><span class="info-value">${record.follow_up_date || "Not specified"}</span></div>
    <div class="info-item"><span class="info-label">Record Created</span><span class="info-value">${record.created_at ? new Date(record.created_at + "Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span></div>
  </div>
  <div class="section"><div class="section-label">Diagnosis</div><div class="section-value">${record.diagnosis || "—"}</div></div>
  <div class="section"><div class="section-label">Treatment / Prescription</div><div class="section-value">${record.treatment || "—"}</div></div>
  <div class="section"><div class="section-label">Medicines Prescribed</div>
    <div class="section-value">${record.medicines ? record.medicines.split(",").map((m: string) => `<span class="medicine-tag">💊 ${m.trim()}</span>`).join("") : '<span style="color:#aaa">None prescribed</span>'}</div>
  </div>
  ${record.remarks ? `<div class="section"><div class="section-label">Remarks / Notes</div><div class="section-value">${record.remarks}</div></div>` : ""}
  <div class="footer">
    <div class="footer-left"><div>LifeTag Veterinary Health Platform</div><div>This prescription is computer-generated and digitally verified.</div><div style="margin-top:4px;font-size:10px">Document Reference: ${record.appointment_code || "N/A"} · ${now}</div></div>
    <div class="signature-box">Veterinarian's Signature</div>
  </div>
</div></body></html>`
    : `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Vaccination Record — ${record.event_name || "Event"}</title>
<style>
* { margin:0;padding:0;box-sizing:border-box }
body { font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;padding:0 }
.page { max-width:740px;margin:0 auto;padding:40px 48px;min-height:100vh;display:flex;flex-direction:column }
.header { display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #16a34a;padding-bottom:18px;margin-bottom:24px }
.brand-icon { width:44px;height:44px;background:#16a34a;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:bold }
.brand-name { font-size:22px;font-weight:800;color:#16a34a }
.brand-sub { font-size:11px;color:#777 }
h1 { font-size:18px;font-weight:700;color:#1a1a1a }
.badge { display:inline-block;background:#f0fdf4;border:1px solid #16a34a;color:#16a34a;font-size:12px;font-weight:700;border-radius:6px;padding:3px 10px;margin-left:10px }
.info-grid { display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e7eb }
.info-label { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#999 }
.info-value { font-size:13px;font-weight:600;color:#222;margin-top:2px }
.section { margin-bottom:20px }
.section-label { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#16a34a;margin-bottom:6px;border-left:3px solid #16a34a;padding-left:8px }
.section-value { font-size:14px;color:#333;line-height:1.6;background:#f9fafb;border-radius:8px;padding:12px 16px }
.footer { margin-top:auto;padding-top:24px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end }
.footer-left { font-size:11px;color:#aaa;line-height:1.6 }
.signature-box { border-top:1.5px solid #555;width:160px;text-align:center;padding-top:6px;font-size:11px;color:#777 }
@media print { .page{padding:24px 32px}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important} }
</style></head><body>
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="brand-icon">L</div>
      <div><div class="brand-name">LifeTag</div><div class="brand-sub">Veterinary Health Platform</div></div>
    </div>
    <div style="font-size:48px;opacity:0.1;font-weight:900">💉</div>
  </div>
  <div style="margin-bottom:24px">
    <h1 style="display:inline">Vaccination / Event Record</h1>
    <span class="badge">${record.event_type || "Event"}</span>
    <div style="font-size:12px;color:#999;margin-top:6px">Issued: ${now}</div>
  </div>
  <div class="info-grid">
    <div><div class="info-label">Cattle ID</div><div class="info-value">${record.cattle_id || "—"}</div></div>
    <div><div class="info-label">Event Type</div><div class="info-value">${record.event_type || "—"}</div></div>
    <div><div class="info-label">Event Date</div><div class="info-value">${record.event_date || "—"}</div></div>
    <div><div class="info-label">Next Due Date</div><div class="info-value">${record.next_due_date || "Not specified"}</div></div>
  </div>
  <div class="section"><div class="section-label">Vaccine / Event Name</div><div class="section-value">${record.event_name || "—"}</div></div>
  ${record.remarks ? `<div class="section"><div class="section-label">Remarks / Notes</div><div class="section-value">${record.remarks}</div></div>` : ""}
  <div class="footer">
    <div class="footer-left"><div>LifeTag Veterinary Health Platform</div><div>This record is computer-generated and digitally verified.</div><div style="margin-top:4px;font-size:10px">Event: ${record.event_name || "N/A"} · ${now}</div></div>
    <div class="signature-box">Veterinarian's Signature</div>
  </div>
</div></body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(content);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

export default function FarmerPrescriptions() {
  const user = getUser();
  const token = user.access_token || user.token || "";

  const [inaph, setInaph] = useState<string>("");
  const [records, setRecords] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"prescriptions" | "vaccinations">("prescriptions");

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Step 1: Resolve inaph_id — token doesn't have it, so call /api/auth/me
        let resolvedInaph = user.inaph_id || user.faadhar || localStorage.getItem("inaph_id") || "";

        if (!resolvedInaph && token) {
          const meRes = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            resolvedInaph = me.inaph_id || me.faadhar || "";
          }
        }

        if (!resolvedInaph) {
          setError("INAPH ID not found. Please log out and log in again.");
          setLoading(false);
          return;
        }
        setInaph(resolvedInaph);

        // Step 2: Resolve farmer UUID — try multiple sources
        const userId =
          user.user_id ||
          localStorage.getItem("user_id") ||
          localStorage.getItem("farmerId") ||
          "";

        // Step 3: Fetch prescriptions + vaccination events in parallel
        const [recRes, evtRes] = await Promise.all([
          fetch(`${API_BASE}/api/vet/health-record/farmer/${resolvedInaph}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          userId
            ? fetch(`${API_BASE}/api/vet/vaccination-events/farmer/${userId}`, {
                headers: { Authorization: `Bearer ${token}`, "x-user-id": userId },
              })
            : Promise.resolve(null),
        ]);

        if (recRes.ok) {
          const data = await recRes.json();
          setRecords(Array.isArray(data) ? data : []);
        } else {
          const err = await recRes.json().catch(() => ({}));
          setError(err.detail || `Prescriptions: ${recRes.status}`);
        }

        if (evtRes && evtRes.ok) {
          const evtData = await evtRes.json();
          setEvents(Array.isArray(evtData) ? evtData : []);
        }
      } catch (err: any) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Health Records</h1>
        <p className="text-sm text-muted-foreground mt-1">Prescriptions and vaccination records from your vet.</p>
        {inaph && <p className="text-xs text-muted-foreground mt-0.5">INAPH: <span className="font-mono">{inaph}</span></p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["prescriptions", "vaccinations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "prescriptions" ? `📋 Prescriptions (${records.length})` : `💉 Vaccinations (${events.length})`}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner size={18} /> Loading records...</div>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && !loading && (
        <>
          {records.length === 0 && !error && (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              No prescriptions found yet. They will appear here after a vet completes your appointment.
            </div>
          )}
          <div className="space-y-4">
            {records.map((r, i) => (
              <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex justify-between items-center flex-wrap gap-3 px-5 py-4 border-b bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary rounded-lg px-3 py-1 font-mono text-xs font-bold">{r.appointment_code || "N/A"}</div>
                    <span className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}
                    </span>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={() => downloadPDF(r, "prescription")}>📄 Download Prescription</Button>
                </div>
                <div className="p-5 grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3 text-xs bg-muted/30 rounded-lg p-3">
                    <div><span className="font-semibold text-muted-foreground">INAPH ID</span><p className="mt-0.5 font-mono">{r.inaph_id || "—"}</p></div>
                    <div><span className="font-semibold text-muted-foreground">Cattle ID</span><p className="mt-0.5 font-mono">{r.cattle_id || "—"}</p></div>
                  </div>
                  <div><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">🔬 Diagnosis</span><p className="mt-1 text-sm">{r.diagnosis}</p></div>
                  <div><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">💉 Treatment</span><p className="mt-1 text-sm">{r.treatment}</p></div>
                  {r.medicines && (
                    <div className="sm:col-span-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">💊 Medicines</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.medicines.split(",").map((m: string, idx: number) => (
                          <span key={idx} className="bg-primary/10 text-primary text-xs font-medium rounded-full px-3 py-1">{m.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.follow_up_date && (
                    <div><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">📅 Follow-up Date</span><p className="mt-1 text-sm font-semibold text-primary">{r.follow_up_date}</p></div>
                  )}
                  {r.remarks && (
                    <div className={r.follow_up_date ? "" : "sm:col-span-2"}>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">📝 Remarks</span>
                      <p className="mt-1 text-sm text-muted-foreground">{r.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vaccinations Tab */}
      {activeTab === "vaccinations" && !loading && (
        <>
          {events.length === 0 && !error && (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              No vaccination records found yet.
            </div>
          )}
          <div className="space-y-4">
            {events.map((e, i) => (
              <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex justify-between items-center flex-wrap gap-3 px-5 py-4 border-b bg-green-500/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg px-3 py-1 text-xs font-bold">{e.event_type}</div>
                    <span className="text-sm font-semibold">{e.event_name}</span>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 border-green-500/30 text-green-600 dark:text-green-400" onClick={() => downloadPDF(e, "event")}>
                    📄 Download Record
                  </Button>
                </div>
                <div className="p-5 grid sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">📅 Event Date</span><p className="mt-1 font-medium">{e.event_date}</p></div>
                  {e.next_due_date && <div><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">⏭ Next Due</span><p className="mt-1 font-semibold text-primary">{e.next_due_date}</p></div>}
                  {e.remarks && <div className="sm:col-span-2"><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">📝 Remarks</span><p className="mt-1 text-muted-foreground">{e.remarks}</p></div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

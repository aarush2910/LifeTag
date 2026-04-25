import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SelectNative } from "@/components/ui/select-native";
import Spinner from "@/components/ui/spinner";

/**
 * Health.tsx
 * - Posts to: {API_BASE}/vet/health-record/
 * - Request body matches VetHealthRecordCreate
 */

export default function Health() {
  const [searchParams] = useSearchParams();

  // ── Resolve pre-fill: URL params (fresh accept) → sessionStorage (navigated back) ──
  function resolveContext() {
    const urlCode = searchParams.get("appointment_code") || "";
    const urlInaph = searchParams.get("inaph_id") || "";
    const urlCattle = searchParams.get("cattle_id") || "";

    if (urlInaph || urlCattle) {
      // Fresh accept flow — also refresh sessionStorage so it stays in sync
      if (urlCode || urlInaph || urlCattle) {
        sessionStorage.setItem(
          "pendingHealthForm",
          JSON.stringify({
            appointment_code: urlCode,
            inaph_id: urlInaph,
            cattle_id: urlCattle,
            expires_at: Date.now() + 8 * 3600 * 1000,
          })
        );
      }
      return { code: urlCode, inaph: urlInaph, cattle: urlCattle };
    }

    // Navigated away and came back — restore from sessionStorage
    try {
      const stored = sessionStorage.getItem("pendingHealthForm");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at && Date.now() < parsed.expires_at) {
          return {
            code: parsed.appointment_code || "",
            inaph: parsed.inaph_id || "",
            cattle: parsed.cattle_id || "",
          };
        }
        // Expired — remove it
        sessionStorage.removeItem("pendingHealthForm");
      }
    } catch { /* ignore */ }

    return { code: "", inaph: "", cattle: "" };
  }

  const ctx = resolveContext();
  const preAppointmentCode = ctx.code;
  const preInaph = ctx.inaph;
  const preCattleId = ctx.cattle;

  const [inaphId, setInaphId] = useState(preInaph);
  const [cattleId, setCattleId] = useState(preCattleId);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medicines, setMedicines] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedRecord, setSavedRecord] = useState<any>(null);

  const validate = () => {
    if (!inaphId.trim()) return "INAPH ID is required.";
    if (!cattleId.trim()) return "Cattle ID is required.";
    if (!diagnosis.trim()) return "Diagnosis is required.";
    if (!treatment.trim()) return "Treatment is required.";
    // optional: prevent follow-up date in the past
    if (followUpDate) {
      const today = new Date();
      const fu = new Date(followUpDate + "T00:00:00");
      // zero time portion for today
      today.setHours(0, 0, 0, 0);
      if (fu < today) return "Follow-up date cannot be in the past.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setSavedRecord(null);

    const vErr = validate();
    if (vErr) {
      setError(vErr);
      setLoading(false);
      return;
    }

    const requestData: {
      inaph_id: string;
      cattle_id: string;
      diagnosis: string;
      treatment: string;
      medicines?: string | null;
      follow_up_date?: string | null;
      remarks?: string | null;
    } = {
      inaph_id: inaphId.trim(),
      cattle_id: cattleId.trim(),
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      medicines: medicines.trim() || null,
      follow_up_date: followUpDate ? followUpDate : null,
      remarks: remarks.trim() || null,
    };

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user.access_token || user.token || "";
      const codeParam = preAppointmentCode ? `?appointment_code=${encodeURIComponent(preAppointmentCode)}` : "";
      const res = await fetch(`${API_BASE}/api/vet/health-record/${codeParam}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || data.error || "Failed to create health record");
      } else {
        setSuccess(true);
        setSavedRecord(data);
        // Clear the pending context — record has been saved
        sessionStorage.removeItem("pendingHealthForm");
        // reset
        setInaphId("");
        setCattleId("");
        setDiagnosis("");
        setTreatment("");
        setMedicines("");
        setFollowUpDate("");
        setRemarks("");
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err: any) {
      console.error("Network error:", err);
      setError("Network error or server unreachable");
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="flex min-h-screen bg-[var(--color-background)] px-4 py-16 md:py-24">
      <form
        onSubmit={handleSubmit}
        className="m-auto w-[80%] md:w-[70%] lg:w-[60%] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)] overflow-hidden shadow-md"
      >
        <div className="bg-[var(--color-primary)] p-8 text-[var(--color-primary-foreground)] rounded-t-2xl">
          <h1 className="text-2xl font-bold">Add Health Record</h1>
          <p className="text-[var(--color-primary-foreground)/80] text-sm mt-1">
            Fill details for the selected cattle
          </p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="mb-6 rounded-lg bg-[var(--color-destructive)] bg-opacity-20 border border-[var(--color-destructive)] p-4 text-[var(--color-destructive-foreground)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && savedRecord && (
            <div className="mb-6">
              <Card>
                <CardHeader className="p-4">
                  <h3 className="font-semibold">✅ Record Created</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Health record created with ID:</p>
                  <p className="mt-2 font-mono">{savedRecord.health_record_id}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* INAPH ID */}
          <div className="space-y-2">
            <Label htmlFor="inaph" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              INAPH ID *
            </Label>
            <Input
              id="inaph"
              type="text"
              className="w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              placeholder="Enter farmer INAPH ID (e.g., INAPH-F0049)"
              value={inaphId}
              onChange={(e) => setInaphId(e.target.value)}
              required
            />
          </div>

          {/* Cattle ID */}
          <div className="space-y-2">
            <Label htmlFor="cattle" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              Cattle ID *
            </Label>
            <Input
              id="cattle"
              type="text"
              className="w-full h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              placeholder="Enter cattle tag ID (e.g., TAG1001)"
              value={cattleId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCattleId(e.target.value)}
              required
            />
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              Diagnosis *
            </Label>
            <Input
              id="diagnosis"
              type="text"
              className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              placeholder="Enter diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
          </div>

          {/* Treatment */}
          <div className="space-y-2">
            <Label htmlFor="treatment" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              Treatment / Prescription *
            </Label>
            <Input
              id="treatment"
              type="text"
              className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              placeholder="Enter treatment or prescription"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              required
            />
          </div>

          {/* Medicines */}
          <div className="space-y-2">
            <Label htmlFor="medicines" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              Medicines
            </Label>
            <Input
              id="medicines"
              type="text"
              className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              placeholder="List medicines (comma separated)"
              value={medicines}
              onChange={(e) => setMedicines(e.target.value)}
            />
          </div>

          {/* Follow-up Date */}
          <div className="space-y-2">
            <Label htmlFor="followUpDate" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              Follow-up Date
            </Label>
            <Input
              id="followUpDate"
              type="date"
              className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-semibold text-[var(--color-muted-foreground)]">
              Remarks
            </Label>
            <Input
              id="remarks"
              type="text"
              className="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-input)] text-[var(--color-foreground)]"
              placeholder="Additional notes"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </form>
    </section>
  );
}

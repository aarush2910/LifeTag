import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";

/**
 * Health.tsx
 * - Posts to: http://127.0.0.1:8000/vet/health-record/
 * - Request body matches VetHealthRecordCreate
 */

export default function Health() {
  const [inaphId, setInaphId] = useState("");
  const [cattle, setCattle] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medicines, setMedicines] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const validate = () => {
    if (!inaphId.trim()) return "INAPH ID is required.";
    if (!cattle.trim()) return "Cattle ID is required.";
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
    setCreatedId(null);

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
      cattle_id: cattle.trim(),
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      medicines: medicines.trim() || null,
      follow_up_date: followUpDate ? followUpDate : null,
      remarks: remarks.trim() || null,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/vet/health-record/vet-prescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add Authorization header here if your API requires auth:
          // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      // If success (201), backend returns created VetHealthRecordResponse
      if (res.status === 201) {
        const data = await res.json();
        // Expecting health_record_id in response
        setCreatedId(data.health_record_id ?? null);
        alert("✅ Health record saved successfully!");
        // reset
        setInaphId("");
        setCattle("");
        setDiagnosis("");
        setTreatment("");
        setMedicines("");
        setFollowUpDate("");
        setRemarks("");
      } else {
        // parse error body if possible
        const data = await res.json().catch(() => ({}));
        const msg = data.detail || data.error || data.message || `HTTP ${res.status}`;
        setError(msg);
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

          {createdId && (
            <div className="mb-6">
              <Card>
                <CardHeader className="p-4">
                  <h3 className="font-semibold">Record Created</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Health record created with ID:</p>
                  <p className="mt-2 font-mono">{createdId}</p>
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
              value={cattle}
              onChange={(e) => setCattle(e.target.value)}
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

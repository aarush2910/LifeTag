import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export default function Health() {
  const [cattle, setCattle] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medicines, setMedicines] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const requestData = {
      cattle,
      diagnosis,
      treatment,
      medicines,
      follow_up_date: followUpDate,
      remarks,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/health-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        alert("Health record saved successfully!");
        setCattle("");
        setDiagnosis("");
        setTreatment("");
        setMedicines("");
        setFollowUpDate("");
        setRemarks("");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
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

          {/* Cattle Selection (as Input) */}
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

          {/* Treatment / Prescription */}
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
              placeholder="List medicines"
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

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </form>
    </section>
  );
}

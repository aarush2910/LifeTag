import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import Spinner from "@/components/ui/spinner";

export default function Events() {
  const [cattleId, setCattleId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cattleList, setCattleList] = useState<any[]>([]);

  // Fetch cattle list on component mount — from vet's handled appointments
  useEffect(() => {
    const fetchCattle = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const vetId = user.vet_id || user.user_id || "";
        const res = await fetch(`${API_BASE}/api/vet/vaccination-events/vet-cattle`, {
          headers: {
            Authorization: `Bearer ${user.token || user.access_token || ""}`,
            "x-user-id": vetId,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setCattleList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch cattle:", err);
      }
    };
    fetchCattle();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const requestData = {
      cattle_id: cattleId,
      event_type: eventType,
      event_name: eventName,
      event_date: eventDate,
      next_due_date: nextDueDate,
      remarks,
    };

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`${API_BASE}/api/vet/vaccination-events/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      console.log("Vaccination event response:", res.status, "body:", data);

      if (!res.ok) {
        setError(data.error || "Failed to record event");
      } else {
        setSuccess(true);
        // Reset form
        setCattleId("");
        setEventType("");
        setEventName("");
        setEventDate("");
        setNextDueDate("");
        setRemarks("");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-16 md:py-24 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-card m-auto h-fit w-full max-w-2xl rounded-2xl border overflow-hidden"
      >
        {/* Header Section */}
        <div className="bg-primary/80 p-6 md:p-8 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-black/10 backdrop-blur-sm rounded-full p-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">
              Vaccination & Event Page
            </h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Vet records vaccinations or other important events for any cattle
          </p>
        </div>

        <div className="p-6 md:p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Vaccination/Event recorded successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Select Cattle */}
            <div className="space-y-2">
              <Label
                htmlFor="cattle"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Select Cattle *
              </Label>
              <SelectNative
                id="cattle"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 h-11 text-base w-full"
                value={cattleId}
                onChange={(e) => setCattleId(e.target.value)}
                required
              >
                <option value="">Choose cattle...</option>
                {cattleList.map((cattle: any) => (
                  <option key={cattle.cid} value={cattle.cid}>
                    {cattle.cattle_name} — {cattle.inaph_tag_id || cattle.local_cattle_id || "No Tag"}
                    {cattle.owner_name ? ` (${cattle.owner_name})` : ""}
                  </option>
                ))}
              </SelectNative>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Cattle from your approved appointments
              </p>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label
                htmlFor="eventType"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Event Type *
              </Label>
              <SelectNative
                id="eventType"
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 h-11 text-base w-full"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
              >
                <option value="">Select event type...</option>
                <option value="Vaccination">Vaccination</option>
                <option value="Pregnancy Check">Pregnancy Check</option>
                <option value="Calving">Calving</option>
                <option value="Deworming">Deworming</option>
                <option value="Health Checkup">Health Checkup</option>
                <option value="Other">Other</option>
              </SelectNative>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                e.g., "Vaccination", "Pregnancy Check", "Calving"
              </p>
            </div>

            {/* Vaccine / Event Name */}
            <div className="space-y-2">
              <Label
                htmlFor="eventName"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Vaccine / Event Name *
              </Label>
              <Input
                type="text"
                required
                id="eventName"
                autoComplete="off"
                className="h-11"
                placeholder="e.g., FMD, Brucellosis"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                e.g., FMD, Brucellosis
              </p>
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label
                htmlFor="eventDate"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Event Date *
              </Label>
              <Input
                type="date"
                required
                id="eventDate"
                className="h-11"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                When event done
              </p>
            </div>

            {/* Next Due Date */}
            <div className="space-y-2">
              <Label
                htmlFor="nextDueDate"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Next Due Date
              </Label>
              <Input
                type="date"
                id="nextDueDate"
                className="h-11"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                min={eventDate || new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Auto reminder
              </p>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label
                htmlFor="remarks"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Remarks
              </Label>
              <textarea
                id="remarks"
                rows={3}
                className="w-full px-3 py-2 text-base rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Optional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Optional
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} />
                  <span>Recording Event...</span>
                </span>
              ) : (
                "Record Event"
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-t dark:border-zinc-800 px-6 md:px-8 py-4">
          <p className="text-center text-xs text-zinc-600 dark:text-zinc-400">
            All required fields are marked with *
          </p>
        </div>
      </form>
    </section>
  );
}

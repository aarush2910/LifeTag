import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../../components/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { items } from "../../menudata/SidebarMenuItem";

import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import Spinner from "../../components/ui/spinner";

type AppointmentCreatePayload = {
  owner_id?: string;
  inaph_id?: string;
  cattle_tag_id?: string;
  cattle_id?: string; // optional, not coming from farmer-info
  vet_id?: string;
  symptoms: string;
  appointment_date: string; // yyyy-mm-dd
  time_slot: string;
  status?: "Pending" | "Approved" | "Completed" | "Cancelled";
  remarks?: string;
  farmer_name?: string;
  cattle_breed?: string;
};

type AppointmentResponse = {
  farmer_name?: string;
  inaph_id?: string;
  cattle_tag_id?: string;
  cattle_breed?: string | null;
  symptoms: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  remarks?: string | null;
  appointment_code?: string | null;
  created_at?: string | null;
};

// Match Pydantic FarmerCattleSummary
type CattleSummary = {
  cattle_name?: string | null;
  breed?: string | null;
  cattle_tag_id?: string | null; // we normalize into this
  inaph_tag_id?: string | null; // backend raw key
};

// Match Pydantic FarmerResponse
type FarmerInfo = {
  fid: string;
  fname: string;
  fphone?: string | null;
  femail?: string | null;
  faadhar?: string | null;
  faddress?: string | null;
  farmtype?: string | null;
  inaph_id?: string | null;
  cattles?: CattleSummary[] | null;
};

type AvailableSlotsResponse = {
  vet_id: string;
  appointment_date: string;
  work_start: string;
  work_end: string;
  slot_minutes: number;
  slots: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function AddAppointmentWithSidebar() {
  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar items={items} />
        <SidebarInset>
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10"
          >
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold ml-4">
              🩺 Schedule Appointment
            </h1>
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          <motion.div className="flex flex-1 flex-col gap-6 p-6 pt-6 bg-background min-h-screen">
            <div className="max-w-5xl w-full mx-auto space-y-6">
              {/* Schedule form */}
              <Card className="overflow-hidden shadow-lg border">
                <CardHeader className="bg-primary/80 text-primary-foreground p-6">
                  <CardTitle className="text-2xl font-bold">
                    Schedule Vet Appointment
                  </CardTitle>
                  <p className="text-primary-foreground/80 text-sm mt-1">
                    Fill the cards step-by-step to schedule an appointment.
                    Fields with * are required.
                  </p>
                </CardHeader>
                <CardContent>
                  <AddAppointmentFormInline />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}



function AddAppointmentFormInline() {
  const [form, setForm] = useState<Partial<AppointmentCreatePayload>>({
    farmer_name: "",
    inaph_id: "",
    cattle_tag_id: "",
    cattle_breed: "",
    symptoms: "",
    appointment_date: "",
    time_slot: "",
    status: "Pending",
    remarks: "",
    owner_id: undefined,
    vet_id: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<AppointmentResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null);
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [farmerFetchError, setFarmerFetchError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotHint, setSlotHint] = useState<string>("");

  const steps = ["Farmer & Cattle", "Symptoms & Schedule"];

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    return dateStr < todayStr;
  };

  const getStoredUserInfo = () => {
    let user: any = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) user = JSON.parse(raw);
    } catch {
      user = null;
    }

    const owner_id =
      (user && user.user_id) ||
      localStorage.getItem("farmerId") ||
      localStorage.getItem("user_id") ||
      null;

    const farmer_name =
      (user && (user.user_name || user.name)) ||
      localStorage.getItem("user_name") ||
      "";

    const inaph_id =
      (user && user.inaph_id) ||
      localStorage.getItem("inaph_id") ||
      "";

    const vet_id = localStorage.getItem("vet_id") || undefined;

    return { owner_id, farmer_name, inaph_id, vet_id };
  };

  const fetchFarmerInfo = async (identifier: string) => {
    if (!identifier) return;
    try {
      setFarmerLoading(true);
      setFarmerFetchError(null);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        "";

      const res = await fetch(
        `${API_BASE}/api/auth/farmer-info?identifier=${encodeURIComponent(
          identifier
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const raw: any = await res.json().catch(() => null as any);

      console.log("farmer-info raw response:", raw);

      if (!res.ok) {
        const message =
          raw?.detail || raw?.message || "Failed to fetch farmer info";
        throw new Error(message);
      }

      if (!raw) {
        throw new Error("Empty response from farmer-info");
      }

      // normalize cattle list: guarantee cattle_tag_id
      const normalizedCattles: CattleSummary[] = (raw.cattles || []).map(
        (c: any) => {
          // backend alias: inaph_tag_id -> cattle_tag_id (we want the alphanumeric tag)
          const tag = c.cattle_tag_id ?? c.inaph_tag_id ?? null;
          return {
            cattle_name: c.cattle_name ?? c.name ?? null,
            breed: c.breed ?? null,
            cattle_tag_id: tag,
            inaph_tag_id: c.inaph_tag_id ?? null,
          };
        }
      );

      const data: FarmerInfo = {
        fid: raw.fid,
        fname: raw.fname,
        fphone: raw.fphone,
        femail: raw.femail,
        faadhar: raw.faadhar,
        faddress: raw.faddress,
        farmtype: raw.farmtype,
        inaph_id: raw.inaph_id,
        cattles: normalizedCattles,
      };

      console.log("normalized farmer-info:", data);

      setFarmerInfo(data);

      setForm((prev) => ({
        ...prev,
        farmer_name: prev.farmer_name || data.fname || prev.farmer_name,
        inaph_id: data.inaph_id || prev.inaph_id,
      }));
    } catch (err: any) {
      console.error("Error fetching farmer info:", err);
      setFarmerInfo(null);
      setFarmerFetchError(err?.message || "Could not fetch farmer info");
    } finally {
      setFarmerLoading(false);
    }
  };

  useEffect(() => {
    const { owner_id, farmer_name, inaph_id, vet_id } = getStoredUserInfo();

    setForm((prev) => ({
      ...prev,
      owner_id: owner_id ?? undefined,
      vet_id: vet_id ?? prev.vet_id,
      farmer_name: farmer_name || prev.farmer_name,
      inaph_id: inaph_id || prev.inaph_id,
    }));

    if (inaph_id) {
      fetchFarmerInfo(inaph_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: keyof AppointmentCreatePayload, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const fetchAvailableSlots = async (vetId?: string, appointmentDate?: string) => {
    if (!vetId || !appointmentDate) {
      setAvailableSlots([]);
      setSlotHint("");
      return;
    }
    try {
      setSlotsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/vet/appointments/availability/${encodeURIComponent(
          vetId
        )}?appointment_date=${encodeURIComponent(appointmentDate)}`
      );
      const data = (await res.json()) as AvailableSlotsResponse;
      if (!res.ok) throw new Error((data as any)?.detail || "Failed to load slots");
      setAvailableSlots(data.slots || []);
      if (!data.work_start || !data.work_end || data.slot_minutes <= 0) {
        setSlotHint("Vet has not configured availability for this date.");
      } else if ((data.slots || []).length === 0) {
        setSlotHint(`All slots are booked for this date (${data.work_start}-${data.work_end}).`);
      } else {
        setSlotHint(`Showing ${data.slots.length} slots (${data.work_start}-${data.work_end}, ${data.slot_minutes} min).`);
      }
    } catch (err) {
      console.error("Failed to fetch slots", err);
      setAvailableSlots([]);
      setSlotHint("Unable to fetch slots right now. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots(form.vet_id, form.appointment_date);
    // reset selected slot if date changes
    setForm((prev) => ({ ...prev, time_slot: "" }));
  }, [form.vet_id, form.appointment_date]);

  const validate = (): string | null => {
    if (!form.symptoms || form.symptoms.trim() === "")
      return "Please describe the symptoms.";
    if (!form.appointment_date)
      return "Please choose an appointment date.";
    if (form.appointment_date && isPastDate(form.appointment_date))
      return "Appointment date cannot be in the past.";
    if (!form.time_slot || form.time_slot.trim() === "")
      return "Please enter a time slot.";
    if (!form.owner_id && !form.inaph_id)
      return "Provide either Owner ID (logged-in) or Farmer INAPH ID.";
    if (!form.cattle_tag_id && !form.cattle_id)
      return "Please select a cattle (tag id or cattle id).";
    return null;
  };

  const validateStep = (step: number): string | null => {
    if (step === 0) {
      if (!form.cattle_tag_id || form.cattle_tag_id.trim() === "") {
        return "Please select the cattle.";
      }
    }
    if (step === 1) {
      if (!form.symptoms || form.symptoms.trim() === "")
        return "Please describe the symptoms.";
      if (!form.appointment_date)
        return "Please choose an appointment date.";
      if (form.appointment_date && isPastDate(form.appointment_date))
        return "Appointment date cannot be in the past.";
      if (!form.time_slot || form.time_slot.trim() === "")
        return "Please enter a time slot.";
    }
    return null;
  };

  const resetForm = (keep?: Partial<AppointmentCreatePayload>) => {
    const { owner_id, farmer_name, inaph_id, vet_id } = getStoredUserInfo();

    setForm({
      farmer_name: keep?.farmer_name ?? farmer_name ?? "",
      inaph_id: keep?.inaph_id ?? inaph_id ?? "",
      cattle_tag_id: "",
      cattle_breed: "",
      symptoms: "",
      appointment_date: "",
      time_slot: "",
      status: "Pending",
      remarks: "",
      owner_id: keep?.owner_id ?? owner_id ?? undefined,
      vet_id: keep?.vet_id ?? vet_id ?? undefined,
      cattle_id: undefined,
    });
    setCurrentStep(0);
    setDirection(1);
    // keep farmerInfo so dropdown stays available for subsequent appointments
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      alert(err);
      return;
    }
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreated(null);
    try {
      // ── Read IDs directly from localStorage at submit time ──────────────
      // React's setForm is async; reading form.owner_id / form.vet_id after
      // calling setForm gives STALE values. Read storage directly here.
      let rawUser: any = null;
      try { rawUser = JSON.parse(localStorage.getItem("user") || "null"); } catch {}

      const freshOwnerId: string | null =
        rawUser?.user_id ||
        localStorage.getItem("farmerId") ||
        localStorage.getItem("user_id") ||
        form.owner_id ||
        null;

      const freshVetId: string | null =
        localStorage.getItem("vet_id") ||
        form.vet_id ||
        null;

      const freshInaphId: string | null =
        rawUser?.inaph_id ||
        localStorage.getItem("inaph_id") ||
        form.inaph_id ||
        null;

      // Validate required fields
      if (!form.symptoms?.trim()) {
        alert("Please describe the symptoms."); setLoading(false); return;
      }
      if (!form.appointment_date) {
        alert("Please choose an appointment date."); setLoading(false); return;
      }
      if (isPastDate(form.appointment_date)) {
        alert("Appointment date cannot be in the past."); setLoading(false); return;
      }
      if (!form.time_slot?.trim()) {
        alert("Please select a time slot."); setLoading(false); return;
      }
      if (!freshOwnerId && !freshInaphId) {
        alert("Could not identify you as a farmer. Please log out and log back in."); setLoading(false); return;
      }
      if (!form.cattle_tag_id && !form.cattle_id) {
        alert("Please select a cattle."); setLoading(false); return;
      }
      if (!freshVetId) {
        alert("No vet selected. Please go back and choose a vet."); setLoading(false); return;
      }

      const payload: any = {
        vet_id: freshVetId,
        owner_id: freshOwnerId ?? undefined,
        symptoms: form.symptoms,
        appointment_date: form.appointment_date,
        time_slot: form.time_slot,
      };

      if (freshInaphId)    payload.inaph_id    = freshInaphId;
      if (form.cattle_tag_id) payload.cattle_tag_id = form.cattle_tag_id;
      if (form.cattle_id)    payload.cattle_id   = form.cattle_id;
      if (form.remarks)      payload.remarks     = form.remarks;
      if (form.farmer_name)  payload.farmer_name = form.farmer_name;
      if (form.cattle_breed) payload.cattle_breed = form.cattle_breed;

      // Remove undefined/null keys
      Object.keys(payload).forEach(
        (k) => (payload[k] === undefined || payload[k] === null) && delete payload[k]
      );

      console.log("📤 Appointment payload:", payload);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        "";

      let res: Response;
      try {
        res = await fetch(
          `${API_BASE}/api/vet/appointments/create-appointment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
          }
        );
      } catch (netErr: any) {
        // Network-level failure (server down, CORS, etc.)
        console.error("Network error on appointment create:", netErr);
        alert(`Network error: Could not reach the server.\nMake sure the backend is running at ${API_BASE}`);
        setLoading(false);
        return;
      }

      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const message =
          (Array.isArray(data?.detail)
            ? data.detail.map((d: any) => d.msg).join(", ")
            : data?.detail) ||
          data?.message ||
          `Server error (${res.status})`;
        throw new Error(message);
      }

      setCreated(data as AppointmentResponse);
      alert(
        `✅ Appointment created${
          data?.appointment_code ? ` — Code: ${data.appointment_code}` : ""
        }`
      );
      resetForm();
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      alert(`Error: ${err?.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };


  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  } as any;

  const cardVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      rotateY: dir > 0 ? 90 : -90,
      x: dir > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      rotateY: 0,
      x: 0,
      transition: { duration: 0.5 },
    },
    exit: (dir: number) => ({
      opacity: 0,
      rotateY: dir > 0 ? -90 : 90,
      x: dir > 0 ? -40 : 40,
      transition: { duration: 0.2 },
    }),
  } as any;

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <div className="flex gap-2">
          {steps.map((label, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${
                idx === currentStep
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-muted"
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px]">
                {idx + 1}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.03 }}
        className="space-y-6"
      >
        {/* Card wrapper */}
        <div className="relative" style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait" custom={direction}>
            {/* STEP 1: Farmer & Cattle */}
            {currentStep === 0 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid md:grid-cols-2 gap-6"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="space-y-2">
                  <Label>Farmer Name</Label>
                  <Input
                    value={form.farmer_name ?? ""}
                    onChange={(e: any) =>
                      handleChange("farmer_name", e.target.value)
                    }
                    placeholder="Farmer full name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Farmer INAPH ID</Label>
                  <Input
                    type="text"
                    value={form.inaph_id ?? ""}
                    onChange={(e: any) =>
                      handleChange("inaph_id", e.target.value)
                    }
                    onBlur={() => {
                      if (form.inaph_id) {
                        fetchFarmerInfo(form.inaph_id);
                      }
                    }}
                    placeholder="INAPH ID (e.g. INAPH-F0015)"
                    className="h-11 flex-1"
                  />
                  {farmerLoading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Loading farmer & cattle info...
                    </p>
                  )}
                  {farmerFetchError && (
                    <p className="text-xs text-red-500 mt-1">
                      {farmerFetchError}
                    </p>
                  )}
                </div>

                {/* Cattle selection from dropdown */}
                <div className="space-y-2">
                  <Label>Cattle Tag ID *</Label>
                  {farmerInfo?.cattles && farmerInfo.cattles.length > 0 ? (
                    <select
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.cattle_tag_id ?? ""}
                      onChange={(e) => {
                        const tag = e.target.value;
                        const selected = farmerInfo.cattles?.find(
                          (c) => c.cattle_tag_id === tag
                        );
                        setForm((prev) => ({
                          ...prev,
                          cattle_tag_id: tag,
                          cattle_breed: selected?.breed ?? prev.cattle_breed,
                        }));
                      }}
                      required
                    >
                      <option value="">Select cattle tag</option>
                      {farmerInfo.cattles.map((c, index) => {
                        const tag = c.cattle_tag_id || "";
                        if (!tag) return null;
                        return (
                          <option key={`${tag}-${index}`} value={tag}>
                            {tag}
                            {c.cattle_name ? ` — ${c.cattle_name}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <Input
                      type="text"
                      value={form.cattle_tag_id ?? ""}
                      onChange={(e: any) =>
                        handleChange("cattle_tag_id", e.target.value)
                      }
                      placeholder="INAPH tag id of the cattle"
                      required
                      className="h-11"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {farmerInfo?.cattles && farmerInfo.cattles.length > 0
                      ? "Select the alphanumeric cattle ID of the sick animal."
                      : "No cattle list found yet. Enter tag ID manually or fill INAPH ID to load cattle list."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cattle Breed (optional)</Label>
                  <Input
                    value={form.cattle_breed ?? ""}
                    onChange={(e: any) =>
                      handleChange("cattle_breed", e.target.value)
                    }
                    placeholder="e.g. Gir, Sahiwal"
                    className="h-11"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Symptoms & Schedule */}
            {currentStep === 1 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="grid md:grid-cols-2 gap-6"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="space-y-2 md:col-span-2">
                  <Label>Symptoms *</Label>
                  <Input
                    value={form.symptoms ?? ""}
                    onChange={(e: any) =>
                      handleChange("symptoms", e.target.value)
                    }
                    placeholder="Describe symptoms"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Appointment Date *</Label>
                  <Input
                    type="date"
                    value={form.appointment_date ?? ""}
                    onChange={(e: any) =>
                      handleChange("appointment_date", e.target.value)
                    }
                    required
                    className="h-11"
                    min={todayStr}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time Slot *</Label>
                  <select
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.time_slot ?? ""}
                    onChange={(e) => handleChange("time_slot", e.target.value)}
                    required
                  >
                    <option value="">
                      {slotsLoading
                        ? "Loading slots..."
                        : !form.appointment_date
                        ? "Select appointment date first"
                        : "Select available time slot"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {form.appointment_date && !slotsLoading && availableSlots.length === 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-amber-600">
                        No available slots for this date. Please select another date.
                      </p>
                      <p className="text-xs text-primary">
                        Ask the selected vet to set availability in their dashboard.
                      </p>
                      {form.vet_id && (
                        <p className="text-[11px] text-muted-foreground">
                          Selected Vet ID: {form.vet_id}
                        </p>
                      )}
                    </div>
                  )}
                  {slotHint && (
                    <p className="text-xs text-muted-foreground">{slotHint}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="min-w-[180px]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} />
                  <span>Scheduling...</span>
                </span>
              ) : (
                "Schedule Appointment"
              )}
            </Button>
          )}
        </div>
      </motion.form>

      {/* Result card */}
      {created && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6 max-w-3xl"
        >
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Appointment Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <strong>Code:</strong>{" "}
                  {created.appointment_code ?? "—"}
                </div>
                <div>
                  <strong>Farmer:</strong>{" "}
                  {created.farmer_name ?? created.inaph_id ?? "—"}
                </div>
                <div>
                  <strong>Cattle:</strong>{" "}
                  {created.cattle_tag_id ?? "—"}{" "}
                  {created.cattle_breed ? `(${created.cattle_breed})` : ""}
                </div>
                <div>
                  <strong>Date:</strong> {created.appointment_date}
                </div>
                <div>
                  <strong>Time:</strong> {created.time_slot}
                </div>
                <div>
                  <strong>Status:</strong> {created.status}
                </div>
                <div>
                  <strong>Remarks:</strong>{" "}
                  {created.remarks ?? "—"}
                </div>
                <div>
                  <strong>Created at:</strong>{" "}
                  {created.created_at ?? "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

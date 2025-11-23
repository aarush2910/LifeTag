import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "..//../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../..//components/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { items } from "../../menudata/SidebarMenuItem";

import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import Spinner from "../../components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "..//../components/ui/select";

type AppointmentCreatePayload = {
  owner_id?: string;
  inaph_id?: string;
  cattle_tag_id?: string;
  cattle_id?: string;
  vet_id: string;
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

/** Full page with sidebar + header + card */
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
            <h1 className="text-lg font-semibold ml-4">🩺 Schedule Appointment</h1>
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          <motion.div className="flex flex-1 flex-col gap-4 p-6 pt-6 min-h-screen bg-gray-50">
            <div className="max-w-5xl w-full mx-auto">
              <Card className="overflow-hidden shadow-lg border">
                <CardHeader className="bg-primary/80 text-primary-foreground p-6">
                  <CardTitle className="text-2xl font-bold">Schedule Vet Appointment</CardTitle>
                  <p className="text-primary-foreground/80 text-sm mt-1">
                    Use this form to schedule an appointment between farmer/cattle and a vet.
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

/** Form component */
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

  // helpers to read stored ids (same approach as your cattle form)
  const getStoredOwnerId = (): string | null => {
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const parsed = JSON.parse(userJson);
        if (parsed?.user_id) return parsed.user_id;
        if (parsed?.userId) return parsed.userId;
      }
    } catch (err) {
      // ignore
    }
    return (
      localStorage.getItem("ownerId") ||
      localStorage.getItem("farmerId") ||
      localStorage.getItem("fid") ||
      localStorage.getItem("user_id") ||
      null
    );
  };

  const getStoredVetId = (): string | null => {
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const parsed = JSON.parse(userJson);
        if (parsed?.vet_id) return parsed.vet_id;
        if (parsed?.vetId) return parsed.vetId;
      }
    } catch (err) {
      // ignore
    }
    return localStorage.getItem("vet_id") || localStorage.getItem("vetId") || null;
  };

  useEffect(() => {
    const owner = getStoredOwnerId();
    const vet = getStoredVetId();
    setForm((p) => ({ ...p, owner_id: owner ?? undefined, vet_id: vet ?? undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: keyof AppointmentCreatePayload, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.symptoms || form.symptoms.trim() === "") return "Please describe the symptoms.";
    if (!form.appointment_date) return "Please choose an appointment date.";
    if (!form.time_slot || form.time_slot.trim() === "") return "Please enter a time slot.";
    if (!form.vet_id) return "Vet ID is required (please login or provide a vet id).";
    if (!form.owner_id && !form.inaph_id) return "Provide either Owner ID (logged-in) or Farmer INAPH ID.";
    if (!form.cattle_tag_id && !form.cattle_id) return "Provide cattle tag id (or cattle id).";
    return null;
  };

  const resetForm = (keep?: Partial<AppointmentCreatePayload>) => {
    setForm({
      farmer_name: "",
      inaph_id: "",
      cattle_tag_id: "",
      cattle_breed: "",
      symptoms: "",
      appointment_date: "",
      time_slot: "",
      status: "Pending",
      remarks: "",
      owner_id: keep?.owner_id ?? form.owner_id,
      vet_id: keep?.vet_id ?? form.vet_id,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreated(null);
    try {
      const err = validate();
      if (err) {
        alert(err);
        setLoading(false);
        return;
      }

      const payload: any = {
        vet_id: form.vet_id,
        symptoms: form.symptoms,
        appointment_date: form.appointment_date,
        time_slot: form.time_slot,
        status: form.status ?? "Pending",
      };

      if (form.owner_id) payload.owner_id = form.owner_id;
      if (form.inaph_id) payload.inaph_id = form.inaph_id;
      if (form.cattle_tag_id) payload.cattle_tag_id = form.cattle_tag_id;
      if (form.cattle_id) payload.cattle_id = form.cattle_id;
      if (form.remarks) payload.remarks = form.remarks;
      if (form.farmer_name) payload.farmer_name = form.farmer_name;
      if (form.cattle_breed) payload.cattle_breed = form.cattle_breed;

      // remove undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const res = await fetch(
        "http://127.0.0.1:8000/api/vet/appointments/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add Authorization header here if needed, e.g. `Authorization: Bearer ${token}`
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        const message = data?.detail || data?.message || "Failed to create appointment";
        throw new Error(message);
      }

      // show returned appointment
      setCreated(data as AppointmentResponse);
      alert(`✅ Appointment created${data?.appointment_code ? ` — Code: ${data.appointment_code}` : ""}`);

      // Reset form but retain owner and vet from localStorage for convenience
      resetForm({ owner_id: form.owner_id, vet_id: form.vet_id });
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

  return (
    <div>
      <motion.form
        onSubmit={handleSubmit}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.03 }}
        className="space-y-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Farmer Name</Label>
            <Input
              value={form.farmer_name ?? ""}
              onChange={(e: any) => handleChange("farmer_name", e.target.value)}
              placeholder="Farmer full name (optional)"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Farmer INAPH ID</Label>
            <Input
              value={form.inaph_id ?? ""}
              onChange={(e: any) => handleChange("inaph_id", e.target.value)}
              placeholder="INAPH-FXXXX (optional if owner_id present)"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Cattle Tag ID *</Label>
            <Input
              value={form.cattle_tag_id ?? ""}
              onChange={(e: any) => handleChange("cattle_tag_id", e.target.value)}
              placeholder="Tag id of the cattle"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Cattle Breed (optional)</Label>
            <Input
              value={form.cattle_breed ?? ""}
              onChange={(e: any) => handleChange("cattle_breed", e.target.value)}
              placeholder="e.g. Gir, Sahiwal"
              className="h-11"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Symptoms *</Label>
            <Input
              value={form.symptoms ?? ""}
              onChange={(e: any) => handleChange("symptoms", e.target.value)}
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
              onChange={(e: any) => handleChange("appointment_date", e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Time Slot *</Label>
            <Input
              value={form.time_slot ?? ""}
              onChange={(e: any) => handleChange("time_slot", e.target.value)}
              placeholder="e.g. 10:00-11:00"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status ?? "Pending"}
              onValueChange={(val: any) => handleChange("status", val)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label>Remarks (optional)</Label>
            <Input
              value={form.remarks ?? ""}
              onChange={(e: any) => handleChange("remarks", e.target.value)}
              placeholder="Any notes for the vet or farmer"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Vet ID *</Label>
            <Input
              value={form.vet_id ?? ""}
              onChange={(e: any) => handleChange("vet_id", e.target.value)}
              placeholder="Vet UUID or will be filled from login"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Vet ID is required by the backend create resolver. The form attempts to read it from localStorage key <code>vet_id</code>.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Owner ID (optional)</Label>
            <Input
              value={form.owner_id ?? ""}
              onChange={(e: any) => handleChange("owner_id", e.target.value)}
              placeholder="Owner UUID (used instead of inaph_id when present)"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex items-center">
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={20} />
                <span>Scheduling...</span>
              </span>
            ) : (
              "Schedule Appointment"
            )}
          </Button>
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
                <div><strong>Code:</strong> {created.appointment_code ?? "—"}</div>
                <div><strong>Farmer:</strong> {created.farmer_name ?? created.inaph_id ?? "—"}</div>
                <div><strong>Cattle:</strong> {created.cattle_tag_id ?? "—"} {created.cattle_breed ? `(${created.cattle_breed})` : ""}</div>
                <div><strong>Date:</strong> {created.appointment_date}</div>
                <div><strong>Time:</strong> {created.time_slot}</div>
                <div><strong>Status:</strong> {created.status}</div>
                <div><strong>Remarks:</strong> {created.remarks ?? "—"}</div>
                <div><strong>Created at:</strong> {created.created_at ?? "—"}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

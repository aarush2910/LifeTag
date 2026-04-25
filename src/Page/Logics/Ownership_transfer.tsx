import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/AppSidebar";
import UserMenu from "../../components/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { items } from "../../menudata/SidebarMenuItem";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

// ✅ API base like your other screens
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ---------- Types for farmer + cattle (similar to appointment screen) ----------
type CattleSummary = {
  cattle_name?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  age?: number | string | null;
  tag_id?: string | null;
  cattle_tag_id?: string | null; // normalized
  health_status?: string | null;
  inaph_tag_id?: string | null;
};

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

// ---- helper to read from localStorage ----
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

export default function OwnershipTransferForm() {
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0 = current owner, 1 = new owner, 2 = cattle + transfer

  const [farmerLoading, setFarmerLoading] = useState(false);
  const [farmerFetchError, setFarmerFetchError] = useState<string | null>(null);
  const [farmerInfo, setFarmerInfo] = useState<FarmerInfo | null>(null); // 👉 store farmer + cattles

  const [form, setForm] = useState({
    // current owner
    current_name: "",
    current_phone: "",
    current_address: "",
    current_id: "",
    current_inaph_id: "",
    // new owner
    new_name: "",
    new_phone: "",
    new_address: "",
    new_id: "",
    new_inaph_id: "",
    // cattle info
    animal_type: "",
    breed: "",
    animal_age: "",
    gender: "",
    tag_id: "",
    health_status: "",
    last_vaccination: "",
    // transfer details
    reason: "",
    other_reason: "",
    transfer_date: "",
    handover_location: "",
    price: "",
    // declaration
    declaration: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeclarationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setForm((prev) => ({ ...prev, declaration: checked }));
  };

  // ---- fetch farmer info from backend and autofill current owner + cattles ----
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

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          (json as any)?.detail ||
            (json as any)?.message ||
            `Failed to fetch farmer info (${res.status})`
        );
      }

      const raw: any = await res.json();

      // ✅ normalize cattle list like appointment screen
      const normalizedCattles: CattleSummary[] = (raw.cattles || []).map(
        (c: any) => {
          const tag =
            c.cattle_tag_id ?? c.inaph_tag_id ?? c.tag_id ?? null;
          return {
            cattle_name: c.cattle_name ?? c.name ?? null,
            species: c.species ?? c.animal_type ?? null,
            breed: c.breed ?? null,
            sex: c.sex ?? c.gender ?? null,
            age: c.age ?? c.age_years ?? null,
            tag_id: tag,
            cattle_tag_id: tag,
            health_status:
              c.health_status ?? c.current_health_status ?? null,
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

      setFarmerInfo(data);

      // autofill current owner fields if empty
      setForm((prev) => ({
        ...prev,
        current_name:
          prev.current_name || data.fname || prev.current_name,
        current_inaph_id:
          prev.current_inaph_id || data.inaph_id || identifier,
      }));
    } catch (err: any) {
      console.error("Error fetching farmer info:", err);
      setFarmerInfo(null);
      setFarmerFetchError(err?.message || "Failed to fetch farmer info");
    } finally {
      setFarmerLoading(false);
    }
  };

  // ---- on mount: read local storage & autofill current owner ----
  useEffect(() => {
    const { owner_id: _owner_id, farmer_name, inaph_id } = getStoredUserInfo();

    setForm((prev) => ({
      ...prev,
      current_name: prev.current_name || farmer_name || "",
      current_inaph_id: prev.current_inaph_id || inaph_id || "",
    }));

    if (inaph_id) {
      fetchFarmerInfo(inaph_id);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.declaration) return; // extra safety
    setSubmitting(true);
    try {
      // TODO: connect to your backend later
      console.log("Ownership transfer payload:", form);
      alert("Ownership transfer request submitted (mock).");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(2, s + 1));
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const cardVariants = {
    initial: { opacity: 0, rotateY: 15, x: 40 },
    animate: {
      opacity: 1,
      rotateY: 0,
      x: 0,
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      rotateY: -15,
      x: -40,
      transition: { duration: 0.3 },
    },
  } as any;

  const stepLabel =
    step === 0
      ? "Current Owner Details"
      : step === 1
      ? "New Owner Details"
      : "Cattle & Transfer Details";

  // 👉 when user picks a cattle from dropdown in Step 2
  const handleCattleSelect = (tag: string) => {
    if (!farmerInfo?.cattles) return;
    const selected = farmerInfo.cattles.find(
      (c) => c.cattle_tag_id === tag || c.tag_id === tag
    );
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      tag_id: selected.cattle_tag_id || selected.tag_id || prev.tag_id,
      animal_type: selected.species ?? prev.animal_type,
      breed: selected.breed ?? prev.breed,
      gender: selected.sex ?? prev.gender,
      animal_age:
        selected.age != null ? String(selected.age) : prev.animal_age,
      health_status: selected.health_status ?? prev.health_status,
    }));
  };

  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar items={items} />
        <SidebarInset>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10"
          >
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold ml-4">
              🐄 Ownership Transfer
            </h1>
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          {/* Main */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-1 flex-col gap-4 p-6 pt-6 bg-background min-h-screen"
          >
            <form
              onSubmit={handleSubmit}
              className="max-w-5xl w-full mx-auto space-y-6"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Cattle Ownership Transfer Request
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fill current owner, new owner and cattle details step by
                    step.
                  </p>
                  {farmerInfo?.cattles && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {farmerInfo.cattles.length} cattle(s) found for this
                      farmer.
                    </p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Step {step + 1} of 3 · {stepLabel}
                </div>
              </div>

              {/* STEP CARDS */}
              <AnimatePresence mode="wait">
                {/* STEP 0: CURRENT OWNER */}
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Card className="overflow-hidden shadow-lg border">
                      <CardHeader className="bg-primary/80 text-primary-foreground p-4">
                        <CardTitle className="text-lg">
                          Current Owner Details
                        </CardTitle>
                        <p className="text-[11px] text-primary-foreground/80">
                          Enter information about the farmer who currently owns
                          the cattle.
                        </p>
                        {farmerLoading && (
                          <p className="text-[11px] text-primary-foreground/80 mt-1">
                            Auto-filling from your farmer profile…
                          </p>
                        )}
                        {farmerFetchError && (
                          <p className="text-[11px] text-red-100 mt-1">
                            {farmerFetchError}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 bg-background">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="current_name">Full Name</Label>
                            <Input
                              id="current_name"
                              name="current_name"
                              value={form.current_name}
                              onChange={handleChange}
                              placeholder="Enter current owner's name"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="current_phone">
                              Contact Number
                            </Label>
                            <Input
                              id="current_phone"
                              name="current_phone"
                              value={form.current_phone}
                              onChange={handleChange}
                              placeholder="e.g. 9876543210"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="current_address">Address</Label>
                            <Input
                              id="current_address"
                              name="current_address"
                              value={form.current_address}
                              onChange={handleChange}
                              placeholder="Village, District, State"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="current_id">
                              Aadhar / ID (optional)
                            </Label>
                            <Input
                              id="current_id"
                              name="current_id"
                              value={form.current_id}
                              onChange={handleChange}
                              placeholder="XXXX-XXXX-XXXX"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="current_inaph_id">
                              INAPH ID (optional)
                            </Label>
                            <Input
                              id="current_inaph_id"
                              name="current_inaph_id"
                              value={form.current_inaph_id}
                              onChange={handleChange}
                              onBlur={() => {
                                if (form.current_inaph_id) {
                                  fetchFarmerInfo(form.current_inaph_id);
                                }
                              }}
                              placeholder="INAPH ID (e.g. INAPH-F0015)"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* STEP 1: NEW OWNER */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Card className="overflow-hidden shadow-lg border">
                      <CardHeader className="bg-primary/80 text-primary-foreground p-4">
                        <CardTitle className="text-lg">
                          New Owner Details
                        </CardTitle>
                        <p className="text-[11px] text-primary-foreground/80">
                          Enter information about the farmer who will receive
                          the cattle.
                        </p>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 bg-background">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="new_name">Full Name</Label>
                            <Input
                              id="new_name"
                              name="new_name"
                              value={form.new_name}
                              onChange={handleChange}
                              placeholder="Enter new owner's name"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new_phone">Contact Number</Label>
                            <Input
                              id="new_phone"
                              name="new_phone"
                              value={form.new_phone}
                              onChange={handleChange}
                              placeholder="e.g. 9876543210"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new_address">Address</Label>
                            <Input
                              id="new_address"
                              name="new_address"
                              value={form.new_address}
                              onChange={handleChange}
                              placeholder="Village, District, State"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="new_id">
                              Aadhar / ID (optional)
                            </Label>
                            <Input
                              id="new_id"
                              name="new_id"
                              value={form.new_id}
                              onChange={handleChange}
                              placeholder="XXXX-XXXX-XXXX"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new_inaph_id">
                              INAPH ID (optional)
                            </Label>
                            <Input
                              id="new_inaph_id"
                              name="new_inaph_id"
                              value={form.new_inaph_id}
                              onChange={handleChange}
                              placeholder="INAPH ID of new owner"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* STEP 2: CATTLE & TRANSFER */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Card className="overflow-hidden shadow-lg border">
                      <CardHeader className="bg-primary/80 text-primary-foreground p-4">
                        <CardTitle className="text-lg">
                          Cattle & Transfer Details
                        </CardTitle>
                        <p className="text-[11px] text-primary-foreground/80">
                          Add cattle information, transfer reason and agree to
                          the declaration.
                        </p>
                      </CardHeader>
                      <CardContent className="grid gap-6 md:grid-cols-2 bg-white">
                        {/* LEFT: Cattle Info */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Cattle Information
                          </h3>

                          {/* 👉 Cattle select dropdown from farmerInfo */}
                          {farmerInfo?.cattles && farmerInfo.cattles.length > 0 && (
                            <div className="space-y-1">
                              <Label>Select Cattle (Tag)</Label>
                              <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={form.tag_id}
                                onChange={(e) => handleCattleSelect(e.target.value)}
                              >
                                <option value="">Choose a cattle</option>
                                {farmerInfo.cattles.map((c, idx) => {
                                  const tag =
                                    c.cattle_tag_id || c.tag_id || "";
                                  if (!tag) return null;
                                  return (
                                    <option key={`${tag}-${idx}`} value={tag}>
                                      {tag}
                                      {c.cattle_name ? ` — ${c.cattle_name}` : ""}
                                    </option>
                                  );
                                })}
                              </select>
                              <p className="text-[11px] text-muted-foreground">
                                Selecting a cattle will auto-fill its details below.
                              </p>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label htmlFor="animal_type">Animal Type</Label>
                            <Input
                              id="animal_type"
                              name="animal_type"
                              value={form.animal_type}
                              onChange={handleChange}
                              placeholder="Cow / Buffalo / Goat / Sheep"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="breed">Breed</Label>
                            <Input
                              id="breed"
                              name="breed"
                              value={form.breed}
                              onChange={handleChange}
                              placeholder="e.g. Sahiwal, Murrah"
                            />
                          </div>
                          <div className="space-y-1 grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="animal_age">Age (years)</Label>
                              <Input
                                id="animal_age"
                                name="animal_age"
                                value={form.animal_age}
                                onChange={handleChange}
                                placeholder="e.g. 4"
                              />
                            </div>
                            <div>
                              <Label htmlFor="gender">Gender</Label>
                              <Input
                                id="gender"
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                placeholder="Male / Female"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="tag_id">
                              Tag ID / Ear Tag Number
                            </Label>
                            <Input
                              id="tag_id"
                              name="tag_id"
                              value={form.tag_id}
                              onChange={handleChange}
                              placeholder="Unique tag number"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="health_status">
                              Current Health Status
                            </Label>
                            <Input
                              id="health_status"
                              name="health_status"
                              value={form.health_status}
                              onChange={handleChange}
                              placeholder="Healthy / Minor illness / Under treatment"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="last_vaccination">
                              Last Vaccination Date (optional)
                            </Label>
                            <Input
                              id="last_vaccination"
                              name="last_vaccination"
                              type="date"
                              value={form.last_vaccination}
                              onChange={handleChange}
                            />
                          </div>
                        </div>

                        {/* RIGHT: Transfer + Declaration */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Transfer Details
                          </h3>

                          <div className="space-y-1">
                            <Label htmlFor="reason">Reason for transfer</Label>
                            <Input
                              id="reason"
                              name="reason"
                              value={form.reason}
                              onChange={handleChange}
                              placeholder="Financial / Health issues / Family transfer / Sale / etc."
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="other_reason">
                              Other details (optional)
                            </Label>
                            <Input
                              id="other_reason"
                              name="other_reason"
                              value={form.other_reason}
                              onChange={handleChange}
                              placeholder="Any extra explanation"
                            />
                          </div>

                          <div className="space-y-1 grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="transfer_date">
                                Proposed Transfer Date
                              </Label>
                              <Input
                                id="transfer_date"
                                name="transfer_date"
                                type="date"
                                value={form.transfer_date}
                                onChange={handleChange}
                              />
                            </div>
                            <div>
                              <Label htmlFor="price">
                                Price (optional)
                              </Label>
                              <Input
                                id="price"
                                name="price"
                                value={form.price}
                                onChange={handleChange}
                                placeholder="e.g. 25000"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="handover_location">
                              Handover Location
                            </Label>
                            <Input
                              id="handover_location"
                              name="handover_location"
                              value={form.handover_location}
                              onChange={handleChange}
                              placeholder="Farm / market / shelter etc."
                            />
                          </div>

                          {/* DECLARATION SECTION */}
                          <div className="pt-3 border-t mt-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Declaration
                            </h4>

                            <ul className="text-xs text-gray-600 space-y-2">
                              <li>
                                • I confirm that the cattle legally belongs to
                                the current owner.
                              </li>
                              <li>
                                • I declare that all information provided is
                                true and correct.
                              </li>
                              <li>
                                • I confirm the transfer is happening with
                                mutual consent.
                              </li>
                              <li>
                                • I understand that after transfer, the new
                                owner assumes full responsibility for the
                                cattle.
                              </li>
                              <li>
                                • I agree that any false information may lead to
                                cancellation of this transfer request.
                              </li>
                            </ul>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="declaration"
                                checked={form.declaration}
                                onChange={handleDeclarationChange}
                                className="w-4 h-4"
                                required
                              />
                              <label
                                htmlFor="declaration"
                                className="text-sm text-gray-700"
                              >
                                I agree to the above declarations.
                              </label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation + Submit */}
              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 0}
                >
                  Previous
                </Button>

                {step < 2 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting || !form.declaration}
                  >
                    {submitting ? "Submitting..." : "Submit Transfer Request"}
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

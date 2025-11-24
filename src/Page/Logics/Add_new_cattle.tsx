import React from "react";
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

// Re-embed AddCattleForm here so this file is self-contained — you can instead import if you keep it separate
import { useState } from "react";
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

function AddCattleFormInline() {
  const [formData, setFormData] = useState({
    cid: "",
    species: "",
    breed: "",
    sex: "",
    dob: "",
    weight: "",
    colour: "",
    healthCondition: "",
    purchaseDate: "",
    source: "",
    photo: null as File | null,
  });

  const [loading, setLoading] = useState(false);

  // 🔒 Lock calendar to today's date only
  const today = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const handleChange = (field: string, value: any) => {
    if (field === "weight") {
      const num = value === "" ? "" : Number(value);
      if (num !== "" && (Number.isNaN(num) || num < 0)) {
        alert("Weight must be a non-negative number.");
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStoredFarmerId = () => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        if (parsed?.user_id) return parsed.user_id;
        if (parsed?.userId) return parsed.userId;
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
    return (
      localStorage.getItem("farmerId") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("fid") ||
      null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const farmerId = getStoredFarmerId();
      if (!farmerId) {
        alert("Please login first — no farmer ID found.");
        setLoading(false);
        return;
      }

      // 🔒 Extra validation: allow only today's date for both date fields
      if (formData.dob !== today) {
        alert("Date of Birth must be today's date only.");
        setLoading(false);
        return;
      }

      if (formData.purchaseDate && formData.purchaseDate !== today) {
        alert("Purchase Date (if provided) must be today's date only.");
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      if (formData.cid) formDataToSend.append("cid", formData.cid);
      formDataToSend.append("species", formData.species);
      formDataToSend.append("breed", formData.breed);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("dob", formData.dob);

      if (formData.weight) formDataToSend.append("weight", formData.weight);
      if (formData.colour) formDataToSend.append("colour", formData.colour);
      if (formData.healthCondition)
        formDataToSend.append("healthCondition", formData.healthCondition);
      if (formData.purchaseDate)
        formDataToSend.append("purchaseDate", formData.purchaseDate);
      if (formData.source) formDataToSend.append("source", formData.source);
      if (formData.photo) formDataToSend.append("photo", formData.photo);

      const response = await fetch(
        "http://127.0.0.1:8000/api/cattles/add-new-cattle",
        {
          method: "POST",
          headers: {
            "X-Owner-Id": farmerId,
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to add cattle");

      alert(`✅ ${data.message}\nCattle ID: ${data.local_cattle_id}`);
      console.log("Cattle added:", data);

      setFormData({
        cid: "",
        species: "",
        breed: "",
        sex: "",
        dob: "",
        weight: "",
        colour: "",
        healthCondition: "",
        purchaseDate: "",
        source: "",
        photo: null,
      });
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  } as any;

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.05 }}
      className="space-y-8"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Cattle ID (optional)</Label>
          <Input
            value={formData.cid}
            onChange={(e: any) => handleChange("cid", e.target.value)}
            placeholder="Optional: your own cattle id"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Species *</Label>
          <Select
            value={formData.species}
            onValueChange={(val: string) => handleChange("species", val)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cow">Cow</SelectItem>
              <SelectItem value="Buffalo">Buffalo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Breed *</Label>
          <Input
            value={formData.breed}
            onChange={(e: any) => handleChange("breed", e.target.value)}
            placeholder="e.g. Gir, Sahiwal"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Sex *</Label>
          <Select
            value={formData.sex}
            onValueChange={(val: string) => handleChange("sex", val)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date of Birth *</Label>
          <Input
            type="date"
            value={formData.dob}
            onChange={(e: any) => handleChange("dob", e.target.value)}
            required
            className="h-11"
            // 🔒 only allow today in the calendar UI
            min={today}
            max={today}
          />
        </div>

        <div className="space-y-2">
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            value={formData.weight}
            onChange={(e: any) => handleChange("weight", e.target.value)}
            className="h-11"
            placeholder="Enter weight"
            min="0"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Colour</Label>
          <Input
            value={formData.colour}
            onChange={(e: any) => handleChange("colour", e.target.value)}
            placeholder="e.g. Brown"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Health Condition</Label>
          <Input
            value={formData.healthCondition}
            onChange={(e: any) => handleChange("healthCondition", e.target.value)}
            placeholder="e.g. Healthy, Under Treatment"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Purchase Date (optional)</Label>
          <Input
            type="date"
            value={formData.purchaseDate}
            onChange={(e: any) => handleChange("purchaseDate", e.target.value)}
            className="h-11"
            // 🔒 only allow today if they select a date
            min={today}
            max={today}
          />
        </div>

        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={formData.source}
            onValueChange={(val: string) => handleChange("source", val)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Purchased">Purchased</SelectItem>
              <SelectItem value="Gifted">Gifted</SelectItem>
              <SelectItem value="Born in farm">Born in farm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Photo (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e: any) => handleChange("photo", e.target.files[0])}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex items-center">
        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size={20} />
              <span>Saving...</span>
            </span>
          ) : (
            "Add Cattle"
          )}
        </Button>
      </div>
    </motion.form>
  );
}

export default function CattleAddWithSidebar() {
  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar items={items} />
        <SidebarInset>
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10"
          >
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-lg font-semibold ml-4">🐄 Add New Cattle</h1>
            <div className="ml-auto pr-2 md:pr-4">
              <UserMenu />
            </div>
          </motion.header>

          <motion.div className="flex flex-1 flex-col gap-4 p-6 pt-6 min-h-screen bg-gray-50">
            <div className="max-w-5xl w-full mx-auto">
              <Card className="overflow-hidden shadow-lg border">
                <CardHeader className="bg-primary/80 text-primary-foreground p-6">
                  <CardTitle className="text-2xl font-bold">Add New Cattle</CardTitle>
                  <p className="text-primary-foreground/80 text-sm mt-1">
                    Register your cattle details carefully. Fields marked with * are required.
                  </p>
                </CardHeader>
                <CardContent>
                  <AddCattleFormInline />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

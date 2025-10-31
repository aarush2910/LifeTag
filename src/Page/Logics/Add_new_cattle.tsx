import { useState } from "react";
import { motion } from "framer-motion";
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
} from "../../components/ui/select";

export default function AddCattleForm() {
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
    photo: null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const farmerId = getStoredFarmerId();
      if (!farmerId) {
        alert("Please login first — no farmer ID found.");
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
    } catch (error) {
      console.error("❌ Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Animation presets
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <motion.section
        className="w-full max-w-3xl flex flex-col items-center justify-center space-y-10"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        {/* Header with animation */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-primary/80 p-6 rounded-2xl shadow-xl text-primary-foreground text-center w-full"
        >
          <h1 className="text-3xl font-bold mb-2">Add New Cattle</h1>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto">
            Register your cattle details carefully. Fields marked with * are required.
          </p>
        </motion.div>

        {/* Form container with smooth fade-in */}
        <motion.form
          onSubmit={handleSubmit}
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card w-full rounded-2xl border shadow-2xl overflow-hidden p-8 space-y-10"
        >
          {/* Cattle Details */}
          <motion.div variants={fadeUp} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 pb-3 border-b">
              <h4 className="text-lg font-semibold">Cattle Details</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>Cattle ID (optional)</Label>
                <Input
                  value={formData.cid}
                  onChange={(e) => handleChange("cid", e.target.value)}
                  placeholder="Optional: your own cattle id"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Species *</Label>
                <Select
                  value={formData.species}
                  onValueChange={(val) => handleChange("species", val)}
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
                  onChange={(e) => handleChange("breed", e.target.value)}
                  placeholder="e.g. Gir, Sahiwal"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Sex *</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(val) => handleChange("sex", val)}
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
                  onChange={(e) => handleChange("dob", e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  className="h-11"
                  placeholder="Enter weight"
                  min="0"
                />
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div variants={fadeUp} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 pb-3 border-b">
              <h4 className="text-lg font-semibold">Additional Information</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>Colour</Label>
                <Input
                  value={formData.colour}
                  onChange={(e) => handleChange("colour", e.target.value)}
                  placeholder="e.g. Brown"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Health Condition</Label>
                <Input
                  value={formData.healthCondition}
                  onChange={(e) => handleChange("healthCondition", e.target.value)}
                  placeholder="e.g. Healthy, Under Treatment"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange("purchaseDate", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(val) => handleChange("source", val)}
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
                  onChange={(e) => handleChange("photo", e.target.files[0])}
                  className="h-11"
                />
              </div>
            </div>
          </motion.div>

          {/* Animated button */}
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} />
                  <span>Saving...</span>
                </span>
              ) : (
                "Add Cattle"
              )}
            </Button>
          </motion.div>
        </motion.form>
      </motion.section>
    </div>
  );
}

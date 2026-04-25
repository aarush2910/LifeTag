import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import {
  User, Phone, Mail, MapPin, Stethoscope, FileText,
  Pencil, X, Check, Award, Calendar,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function Avatar({ name }: { name: string }) {
  const initials = name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DR";
  return (
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-background">
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-4 py-3 px-0 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || <span className="italic text-muted-foreground">Not set</span>}</p>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ profile, onClose, onSaved }: { profile: any; onClose: () => void; onSaved: (d: any) => void }) {
  const user = getUser();
  const [form, setForm] = useState({
    vname: profile.vname || "",
    vphone: profile.vphone || "",
    vemail: profile.vemail || "",
    vclinic: profile.vclinic || "",
    vaddress: profile.vaddress || "",
    specialization: profile.specialization || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/vet/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token || user.token || ""}`,
          "x-user-id": user.user_id || "",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save");
      onSaved({ ...profile, ...form });
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {[
            { name: "vname", label: "Full Name", type: "text", placeholder: "Dr. Your Name" },
            { name: "vphone", label: "Phone", type: "tel", placeholder: "+91 XXXXX XXXXX" },
            { name: "vemail", label: "Email", type: "email", placeholder: "you@example.com" },
            { name: "vclinic", label: "Clinic Name", type: "text", placeholder: "e.g. Animal Care Clinic" },
            { name: "vaddress", label: "Clinic Address", type: "text", placeholder: "Full clinic address" },
            { name: "specialization", label: "Specialization", type: "text", placeholder: "e.g. Bovine Medicine" },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name} className="text-sm">{label}</Label>
              <Input id={name} name={name} type={type} placeholder={placeholder}
                value={(form as any)[name]} onChange={handleChange} className="h-10" />
            </div>
          ))}
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
              {saving ? <><Spinner size={14} /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VetAccountInfo() {
  const user = getUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = user.access_token || user.token || "";
        if (!token) { setError("Not logged in"); setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/vet/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load profile");
        setProfile(data);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={36} /></div>;
  if (error) return <div className="p-8 text-red-500 flex items-center gap-2"><X className="w-5 h-5" />{error}</div>;
  if (!profile) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Profile Hero Card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.1) 10px,rgba(255,255,255,.1) 20px)" }} />
        </div>
        {/* Info row */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar name={profile.vname || "?"} />
            <Button variant="outline" size="sm" className="gap-2 mb-1" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{profile.vname || "—"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {profile.specialization ? `${profile.specialization} Specialist` : "Veterinarian"}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.license_no && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Award className="w-3 h-3" /> License: {profile.license_no}
              </span>
            )}
            {profile.qualification && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <FileText className="w-3 h-3" /> {profile.qualification}
              </span>
            )}
            {profile.experience && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {profile.experience} yrs experience
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Personal Info</h2>
          <InfoRow icon={User} label="Full Name" value={profile.vname} />
          <InfoRow icon={Phone} label="Phone" value={profile.vphone} />
          <InfoRow icon={Mail} label="Email" value={profile.vemail} />
          <InfoRow icon={MapPin} label="Clinic Name" value={profile.vclinic} />
          <InfoRow icon={MapPin} label="Clinic Address" value={profile.vaddress} />
        </div>
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Professional Info</h2>
          <InfoRow icon={Stethoscope} label="Specialization" value={profile.specialization} />
          <InfoRow icon={Award} label="License No." value={profile.license_no || profile.vlicense} />
          <InfoRow icon={FileText} label="Qualification" value={profile.qualification} />
        </div>
      </div>

      {editOpen && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => { setProfile(updated); setEditOpen(false); }}
        />
      )}
    </div>
  );
}

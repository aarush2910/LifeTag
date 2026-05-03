import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { User, Phone, Mail, MapPin, Tractor, Tag, CreditCard, Pencil, X, Check, Beef } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

function Avatar({ name }: { name: string }) {
  const initials = name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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

// ─── Edit Modal ────────────────────────────────────────────────────────────
function EditModal({ profile, onClose, onSaved }: { profile: any; onClose: () => void; onSaved: (d: any) => void }) {
  const user = getUser();
  const [form, setForm] = useState({
    fname: profile.fname || "",
    fphone: profile.fphone || "",
    femail: profile.femail || "",
    faddress: profile.faddress || "",
    farmtype: profile.farmtype || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/farmer-info`, {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {[
            { name: "fname", label: "Full Name", type: "text", placeholder: "Your full name" },
            { name: "fphone", label: "Phone", type: "tel", placeholder: "+91 XXXXX XXXXX" },
            { name: "femail", label: "Email", type: "email", placeholder: "you@example.com" },
            { name: "faddress", label: "Address", type: "text", placeholder: "Village, District, State" },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name} className="text-sm">{label}</Label>
              <Input id={name} name={name} type={type} placeholder={placeholder}
                value={(form as any)[name]} onChange={handleChange} className="h-10" />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="farmtype">Farm Type</Label>
            <select id="farmtype" name="farmtype" value={form.farmtype} onChange={handleChange}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select type...</option>
              <option value="Dairy">🐄 Dairy</option>
              <option value="Beef">🥩 Beef</option>
              <option value="Mixed">🌾 Mixed</option>
              <option value="Organic">🌿 Organic</option>
              <option value="Other">Other</option>
            </select>
          </div>
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

// ─── Main Component ────────────────────────────────────────────────────────
export default function FarmerAccountInfo() {
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
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load profile");
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={36} /></div>;
  if (error) return <div className="p-8 text-red-500 flex items-center gap-2"><X className="w-5 h-5" />{error}</div>;
  if (!profile) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500" />
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar name={profile.fname || "?"} />
            <Button variant="outline" size="sm" className="gap-2 mb-1" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{profile.fname || "—"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{profile.farmtype ? `${profile.farmtype} Farmer` : "Farmer"}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.inaph_id && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                INAPH: {profile.inaph_id}
              </span>
            )}
            {profile.faadhar && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
                Aadhaar: ••••{String(profile.faadhar).slice(-4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Personal Info</h2>
          <InfoRow icon={User} label="Full Name" value={profile.fname} />
          <InfoRow icon={Phone} label="Phone" value={profile.fphone} />
          <InfoRow icon={Mail} label="Email" value={profile.femail} />
          <InfoRow icon={MapPin} label="Address" value={profile.faddress} />
        </div>
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Farm Info</h2>
          <InfoRow icon={Tractor} label="Farm Name" value={profile.farmname} />
          <InfoRow icon={Beef} label="Farm Type" value={profile.farmtype} />
          <InfoRow icon={Tag} label="INAPH ID" value={profile.inaph_id} />
          <InfoRow icon={CreditCard} label="Aadhaar" value={profile.faadhar ? `••••••••${String(profile.faadhar).slice(-4)}` : ""} />
        </div>
      </div>

      {/* Cattle Table */}
      {profile.cattles && profile.cattles.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Beef className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">My Cattle <span className="text-muted-foreground font-normal text-sm">({profile.cattles.length})</span></h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Name", "Tag ID", "Breed", "Age", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {profile.cattles.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium">{c.cattle_name || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.cattle_tag_id || c.inaph_tag_id || "—"}</td>
                    <td className="px-5 py-3">{c.breed || "—"}</td>
                    <td className="px-5 py-3">{c.age ? `${c.age} yrs` : "—"}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

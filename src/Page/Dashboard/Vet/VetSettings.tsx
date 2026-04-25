import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import {
  User, Phone, Mail, MapPin, Lock, Bell, ShieldAlert,
  Eye, EyeOff, Check, Save,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, accent = "blue" }: {
  title: string; icon: any; children: React.ReactNode; accent?: string;
}) {
  const accents: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-muted/30">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ type, successMsg = "Changes saved successfully!" }: { type: "success" | "error" | "idle"; successMsg?: string }) {
  if (type === "idle") return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
      type === "success"
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      {type === "success" ? successMsg : "Something went wrong. Please try again."}
    </div>
  );
}

function PasswordField({ name, label, form, show, handleChange, setShow }: any) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input id={name} name={name} type={show[name] ? "text" : "password"}
          value={form[name]} onChange={handleChange} placeholder="••••••••" className="h-10 pr-10" />
        <button type="button"
          onClick={() => setShow((s: any) => ({ ...s, [name]: !s[name] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Section: Personal Info ───────────────────────────────────────────────────
function PersonalInfoSection({ initialData, user }: { initialData: any; user: any }) {
  const [form, setForm] = useState({
    vname: initialData.vname || "",
    vphone: initialData.vphone || "",
    vemail: initialData.vemail || "",
    vclinic: initialData.vclinic || "",
    vaddress: initialData.vaddress || "",
    specialization: initialData.specialization || "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "idle">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setStatus("idle");
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
      if (!res.ok) throw new Error();
      setStatus("success"); setTimeout(() => setStatus("idle"), 4000);
    } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 4000); }
    finally { setSaving(false); }
  };

  return (
    <SectionCard title="Personal Information" icon={User} accent="blue">
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: "vname", label: "Full Name", type: "text", placeholder: "Dr. Your Name" },
            { name: "vphone", label: "Phone Number", type: "tel", placeholder: "+91 XXXXX XXXXX" },
            { name: "vemail", label: "Email Address", type: "email", placeholder: "you@email.com" },
            { name: "specialization", label: "Specialization", type: "text", placeholder: "e.g. Bovine Medicine" },
            { name: "vclinic", label: "Clinic Name", type: "text", placeholder: "e.g. Animal Care Clinic" },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={name}>{label}</Label>
              <Input id={name} name={name} type={type} placeholder={placeholder}
                value={(form as any)[name]} onChange={handleChange} className="h-10" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vaddress" className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Clinic Address
          </Label>
          <Input id="vaddress" name="vaddress" type="text" placeholder="Full clinic address"
            value={form.vaddress} onChange={handleChange} className="h-10" />
        </div>
        <StatusBadge type={status} successMsg="Profile updated successfully!" />
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <><Spinner size={14} /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Section: Change Password ─────────────────────────────────────────────────
function ChangePasswordSection({ user }: { user: any }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "idle">("idle");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPass !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.newPass.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token || user.token || ""}`,
          "x-user-id": user.user_id || "",
        },
        body: JSON.stringify({ current_password: form.current, new_password: form.newPass }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed"); }
      setStatus("success");
      setForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      setError(err.message); setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    } finally { setSaving(false); }
  };

  return (
    <SectionCard title="Change Password" icon={Lock} accent="orange">
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <PasswordField name="current" label="Current Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        <PasswordField name="newPass" label="New Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        <PasswordField name="confirm" label="Confirm New Password" form={form} show={show} handleChange={handleChange} setShow={setShow} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <StatusBadge type={status} successMsg="Password updated successfully!" />
        <Button type="submit" variant="outline" disabled={saving} className="gap-2">
          {saving ? <><Spinner size={14} /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    appointment_requests: true,
    appointment_updates: true,
    health_record_alerts: true,
    vaccination_reminders: true,
    system_updates: false,
  });
  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !(p as any)[key] }));
  const items = [
    { key: "appointment_requests", label: "Appointment Requests", desc: "Get alerted when farmers book an appointment with you" },
    { key: "appointment_updates", label: "Appointment Changes", desc: "Notifications when appointments are cancelled or rescheduled" },
    { key: "health_record_alerts", label: "Health Record Updates", desc: "When you add prescriptions or diagnoses" },
    { key: "vaccination_reminders", label: "Vaccination Reminders", desc: "Reminders for upcoming vaccination events" },
    { key: "system_updates", label: "System Announcements", desc: "Platform updates and news" },
  ];
  return (
    <SectionCard title="Notification Preferences" icon={Bell} accent="purple">
      <div className="space-y-4">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <button onClick={() => toggle(key)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                (prefs as any)[key] ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                (prefs as any)[key] ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Section: Danger Zone ─────────────────────────────────────────────────────
function DangerZoneSection() {
  const [confirm, setConfirm] = useState(false);
  return (
    <SectionCard title="Danger Zone" icon={ShieldAlert} accent="red">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently remove your vet account and all associated records. This cannot be undone.</p>
          </div>
          {!confirm ? (
            <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 shrink-0" onClick={() => setConfirm(true)}>Delete</Button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Confirm Delete</Button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10">
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Export My Data</p>
            <p className="text-xs text-muted-foreground mt-0.5">Download a copy of your profile, appointments, and health records.</p>
          </div>
          <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50 shrink-0">Export</Button>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VetSettings() {
  const user = getUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = user.access_token || user.token || "";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/vet/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProfile(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size={36} /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences and personal information</p>
      </div>
      {profile && <PersonalInfoSection initialData={profile} user={user} />}
      <ChangePasswordSection user={user} />
      <NotificationsSection />
      <DangerZoneSection />
    </div>
  );
}

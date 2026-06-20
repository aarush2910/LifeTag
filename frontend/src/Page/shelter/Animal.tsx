import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import Spinner from "../../components/ui/spinner";
import { AlertCircle, Search, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

interface ShelterCattle {
  cid: string;
  cattle_name: string;
  breed: string;
  colour_markings?: string;
  inaph_tag_id?: string;
  local_cattle_id?: string;
  health_condition?: string;
  species: string;
  sex: string;
  weight?: number;
  dob?: string;
  previous_owner?: string;
  previous_owner_id?: string;
  status?: string;
  photo_url?: string;
}

export default function AnimalRegistry() {
  const [animals, setAnimals] = useState<ShelterCattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ShelterCattle | null>(null);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const user = getUser();
  const userId = user.user_id || user.sid || "";
  const token = user.access_token || user.token || "";

  const loadAnimals = () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/shelter/cattle`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-user-id": userId,
      },
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) setAnimals(Array.isArray(d) ? d : []);
        else setError(d.detail || "Failed to load animals");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAnimals(); }, [refreshKey]);

  const filtered = animals.filter(a =>
    a.cattle_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.inaph_tag_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.breed || "").toLowerCase().includes(search.toLowerCase())
  );

  const healthBadge = (health?: string) => {
    if (!health) return "text-muted-foreground";
    const lower = health.toLowerCase();
    if (lower.includes("good") || lower.includes("healthy") || lower.includes("ok")) return "text-green-600";
    if (lower.includes("poor") || lower.includes("sick") || lower.includes("critical")) return "text-red-600";
    return "text-yellow-600";
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner size={28} />
    </div>
  );

  if (error) return (
    <div className="p-6 flex items-center gap-3 text-red-500">
      <AlertCircle className="w-5 h-5" /> {error}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 max-w-md flex-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag, or breed..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {animals.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {animals.length} animal{animals.length !== 1 ? "s" : ""} in shelter
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          {animals.length === 0
            ? "No animals in shelter yet. Accept an intake request to add animals."
            : "No animals match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(animal => (
            <Card
              key={animal.cid}
              onClick={() => setSelected(selected?.cid === animal.cid ? null : animal)}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/40"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {animal.photo_url ? (
                  <img
                    src={animal.photo_url}
                    alt={animal.cattle_name}
                    className="w-14 h-14 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-2xl">🐄</div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{animal.cattle_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{animal.breed}</p>
                  {animal.inaph_tag_id && (
                    <p className="text-xs font-mono text-primary mt-0.5">{animal.inaph_tag_id}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${healthBadge(animal.health_condition)}`}>
                    {animal.health_condition || "Health: Unknown"}
                  </span>
                  <span className="text-muted-foreground">{animal.species} · {animal.sex}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Animal Detail Panel */}
      {selected && (
        <Card className="mt-4 border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Animal Profile — {selected.cattle_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2 flex items-center gap-4 mb-2">
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt={selected.cattle_name} className="w-24 h-24 rounded-xl object-cover border" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center text-4xl">🐄</div>
                )}
              </div>

              <Field label="Cattle Name" value={selected.cattle_name} />
              <Field label="Previous Owner" value={selected.previous_owner} />
              <Field label="Breed" value={selected.breed} />
              <Field label="Species" value={selected.species} />
              <Field label="Sex" value={selected.sex} />
              <Field label="Colour / Markings" value={selected.colour_markings} />
              <Field label="Tag ID (INAPH)" value={selected.inaph_tag_id} />
              <Field label="Local Tag ID" value={selected.local_cattle_id} />
              <Field label="Date of Birth" value={selected.dob} />
              <Field label="Weight" value={selected.weight ? `${selected.weight} kg` : undefined} />
              <Field label="Health Condition / Disease" value={selected.health_condition} />
              <Field label="Status" value={selected.status} />
            </div>

            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  );
}
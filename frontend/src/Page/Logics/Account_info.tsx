// src/Page/shelter/FarmerAccountInfo.tsx
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Mail, Phone, MapPin, Tractor, Wheat } from "lucide-react";

type FarmerApiResponse = {
  fid?: string;
  fname?: string;
  fphone?: string | null;
  femail?: string | null;
  faadhar?: string | null;
  faddress?: string | null;
  farmtype?: string | null;
  inaph_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // backend may include extra fields — we safely ignore them
};

export default function FarmerAccountInfo({
  identifier: propIdentifier,
}: {
  /**
   * Optional identifier: INAPH ID, Aadhaar, email or phone.
   * If not provided, component will try localStorage keys:
   * 'identifier', 'faadhar', 'inaph_id', 'user_id', 'userIdentifier', 'user'
   */
  identifier?: string;
}) {
  const [data, setData] = useState<FarmerApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API base — set VITE_API_BASE_URL in env if backend runs elsewhere.
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  // Determine identifier: prop -> localStorage fallbacks -> empty string
  const getIdentifierFromStorage = (): string => {
    const keys = ["identifier", "faadhar", "inaph_id", "user_id", "userIdentifier", "user"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (!v) continue;
      // if the 'user' object is stored, try to extract user_id or faadhar/inaph_id
      if (k === "user") {
        try {
          const parsed = JSON.parse(v);
          if (parsed?.identifier) return String(parsed.identifier);
          if (parsed?.faadhar) return String(parsed.faadhar);
          if (parsed?.inaph_id) return String(parsed.inaph_id);
          if (parsed?.user_id) return String(parsed.user_id);
        } catch {
          // not JSON; treat as plain string
        }
      }
      if (v && v.trim()) return v.trim();
    }
    return "";
  };

  const identifier = propIdentifier || getIdentifierFromStorage();

  useEffect(() => {
    if (!identifier) {
      setError(
        "No identifier provided. Pass `identifier` prop or store 'identifier'/'faadhar'/'inaph_id' in localStorage."
      );
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    async function fetchFarmer() {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token") || "";

      const url = `${API_BASE}/api/auth/farmer-info?identifier=${encodeURIComponent(identifier)}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          // Try to present a helpful message from backend
          let msg = `Failed to fetch: ${res.status}`;
          try {
            const body = await res.json();
            if (body?.detail) msg = body.detail;
            else if (body?.message) msg = body.message;
          } catch {
            // ignore parse error
          }

          // If unauthorized, give a clearer message
          if (res.status === 401) msg = "Unauthorized. Your session may have expired. Please login again.";

          throw new Error(msg);
        }

        const json: FarmerApiResponse = await res.json();
        if (mounted) setData(json);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (mounted) setError(err.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFarmer();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [identifier, API_BASE]);

  // small util
  const formatMemberSince = (iso?: string | null) => {
    if (!iso) return "Feb 2024"; // keep your previous default if server missing it
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: "short", year: "numeric" }); // e.g. "Feb 2024"
    } catch {
      return iso;
    }
  };

  // preserve original static defaults used in your layout (so UI doesn't break)
  const display = {
    name: data?.fname || "Ramesh Patel",
    role: "Organic Farmer",
    verifiedText: "Verified Farmer",
    farmerId: data?.fid || localStorage.getItem("user_id") || "FMR12345",
    email: data?.femail || localStorage.getItem("user_email") || "rameshpatel@gmail.com",
    phone: data?.fphone || localStorage.getItem("user_phone") || "+91 9876543210",
    address: data?.faddress || "Nashik, Maharashtra",
    memberSince: formatMemberSince(data?.created_at),
    lastActive: data?.updated_at ? "Recently active" : "2 hours ago",
    // backend doesn't expose farmname in response model — build a friendly fallback
    farmName: data?.fname ? `${data.fname}'s Farm` : "Green Valley Farms",
    farmType: data?.farmtype || "Livestock",
    animals: "Cows, Goats, Buffalo",
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-orange-50 to-orange-100 text-gray-900">
      {/* Centered content wrapper */}
      <div className="w-full max-w-6xl p-8 mx-auto lg:ml-[250px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-orange-700">Farmer Profile</h1>
          <div className="space-x-3" />
        </div>

        {/* Main Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Card */}
          <Card className="rounded-2xl shadow-lg border border-orange-200">
            <CardContent className="flex flex-col items-center py-8">
              <img
                src="https://cdn-icons-png.flaticon.com/512/1864/1864593.png"
                alt="Farmer Avatar"
                className="w-28 h-28 rounded-full mb-4 border-4 border-orange-300"
              />
              <h2 className="text-2xl font-semibold text-gray-800">{display.name}</h2>
              <p className="text-gray-600 mb-2">{display.role}</p>
              <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-700 rounded-full">
                {display.verifiedText}
              </span>

              <Separator className="my-4" />

              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Member since:</strong> {display.memberSince}
                </p>
                <p>
                  <strong>Last Active:</strong> {display.lastActive}
                </p>
                <p>
                  <strong>Role:</strong> Farmer
                </p>
              </div>

              <Button className="mt-5 w-full bg-orange-600 hover:bg-orange-700 text-white">Message</Button>
            </CardContent>
          </Card>

          {/* Right Info Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Farmer Info */}
            <Card className="rounded-2xl shadow-md border border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Account Information</h3>

                {/* loading / error UI */}
                {loading && <p className="text-sm text-gray-500 mb-3">Loading profile...</p>}
                {error && (
                  <div className="mb-3">
                    <p className="text-sm text-red-600 mb-2">Error: {error}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // simple refresh by reloading page — keeps code simple
                          window.location.reload();
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 text-gray-800">
                  <p>
                    <strong>Farmer ID:</strong> {display.farmerId}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {display.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {display.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {display.address}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Farm Info */}
            <Card className="rounded-2xl shadow-md border border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Farm Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-gray-800">
                  <p className="flex items-center gap-2">
                    <Tractor className="w-4 h-4" /> <strong>Farm Name:</strong> {display.farmName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Wheat className="w-4 h-4" /> <strong>Farm Type:</strong> {display.farmType}
                  </p>
                  <p>
                    <strong>Farm Size:</strong> 25 Acres
                  </p>
                  <p>
                    <strong>Animals:</strong> {display.animals}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-2xl shadow-md border border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Recent Activity</h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    🧾 Registered new livestock — <strong>2 hours ago</strong>
                  </p>
                  <p>
                    💉 Vaccination record updated — <strong>5 hours ago</strong>
                  </p>
                  <p>
                    📋 Appointment booked with vet — <strong>Yesterday</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

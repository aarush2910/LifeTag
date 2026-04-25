import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";
import { History } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":   return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "approved":  return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:          return "bg-muted text-muted-foreground";
  }
}

function statusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":   return "⏳";
    case "approved":  return "✅";
    case "completed": return "🏁";
    case "cancelled": return "❌";
    default:          return "•";
  }
}

export default function AppointmentHistory() {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const raw = localStorage.getItem("user");
        const u = raw ? JSON.parse(raw) : {};
        const token = u.access_token || u.token || "";
        const userId = u.user_id || "";

        if (!userId) { setLoading(false); return; }

        const res = await fetch(
          `${API_BASE}/api/vet/appointments/view-appointments?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-user-id": userId,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to fetch history");
        setAppointments(data.results || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Appointment History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all your past and upcoming veterinary appointments.
        </p>
      </div>

      <Card className="overflow-hidden shadow-md border">
        <CardContent className="p-0">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-10 justify-center">
              <Spinner size={18} /> Loading your appointment history...
            </div>
          )}
          {error && <p className="text-sm text-red-500 p-6">Error loading history: {error}</p>}
          {!loading && appointments.length === 0 && !error && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <div className="text-4xl mb-3 opacity-50">📋</div>
              <p className="text-lg font-medium text-foreground">No appointments yet</p>
              <p className="mt-1">Head over to Appointment Request to schedule your first vet visit!</p>
            </div>
          )}
          {appointments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-6 py-4">Code</th>
                    <th className="text-left px-6 py-4">Date & Time</th>
                    <th className="text-left px-6 py-4">Cattle Tag</th>
                    <th className="text-left px-6 py-4">Symptoms</th>
                    <th className="text-left px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {appointments.map((a, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        <span className="bg-primary/5 text-primary px-2 py-1 rounded-md border border-primary/10">
                          {a.appointment_code || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{a.appointment_date || "—"}</span>
                        {a.time_slot && <span className="text-muted-foreground ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">· {a.time_slot}</span>}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{a.cattle_tag_id || "—"}</td>
                      <td className="px-6 py-4 max-w-[250px] truncate text-muted-foreground" title={a.symptoms}>{a.symptoms || "—"}</td>
                      <td className="px-6 py-4 md:w-32">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(a.status)}`}>
                          {statusIcon(a.status)} {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

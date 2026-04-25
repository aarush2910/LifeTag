import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tag, Heart, Activity as ActivityIcon, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Spinner from "../../components/ui/spinner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const user = getUser();
    const userId = user.user_id || user.sid || "";
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError("");

    fetch(`${API_BASE}/api/shelter/stats`, {
      headers: {
        Authorization: `Bearer ${user.access_token || user.token || ""}`,
        "x-user-id": userId,
      },
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) { setStats(d); setLastUpdated(new Date()); }
        else setError(d.detail || "Failed to load stats");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center gap-3 text-red-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const chartData = stats?.chart_data?.length > 0
    ? stats.chart_data
    : [{ month: "No Data", intakes: 0, adoptions: 0 }];

  return (
    <div className="p-4 space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Shelter Dashboard</h2>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pending Intake Requests */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Intake Requests</CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.pending_intake_count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Farmer requests awaiting review</p>
          </CardContent>
        </Card>

        {/* Total Animals */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats?.total_animals ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently under shelter care</p>
          </CardContent>
        </Card>

        {/* Tagged vs Untagged */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tagged vs Untagged</CardTitle>
            <Tag className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-orange-500">{stats?.tagged_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Tagged</p>
              </div>
              <div className="border-l pl-4">
                <p className="text-2xl font-bold text-gray-500">{stats?.untagged_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Untagged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Adoptions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Adoptions</CardTitle>
            <Heart className="w-5 h-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
              {stats?.pending_adoptions ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Adoption requests pending</p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
            <ActivityIcon className="w-5 h-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            {stats?.recent_activity?.length > 0 ? (
              <ul className="space-y-2">
                {stats.recent_activity.map((activity: string, index: number) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {activity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No recent activity yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Intake vs Adoption Trends */}
        <Card className="md:col-span-3 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Intake vs Adoption Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="intakes" fill="#3b82f6" name="Intakes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adoptions" fill="#10b981" name="Adoptions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
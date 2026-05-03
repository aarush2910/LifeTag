import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "../../components/ui/table";
import Spinner from "../../components/ui/spinner";
import { CheckCircle, XCircle, Eye, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

interface IntakeRequest {
  id: string;
  farmer_id: string;
  cattle_id: string;
  reason: string;
  notes?: string;
  status: string;
  shelter_id?: string;
  created_at?: string;
  farmer_name?: string;
  cattle_name?: string;
  cattle_breed?: string;
}

export default function IntakeRequests() {
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<IntakeRequest | null>(null);
  const [filter, setFilter] = useState("Pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const user = getUser();
  const userId = user.user_id || user.sid || "";
  const token = user.access_token || user.token || "";

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "x-user-id": userId,
    "Content-Type": "application/json",
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/shelter/intake-requests`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setError(data.detail || "Failed to load intake requests");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchRequests();
    else { setLoading(false); setError("Not authenticated"); }
  }, []);

  const handleAction = async (reqId: string, status: "Approved" | "Rejected") => {
    setActionLoading(reqId + status);
    setActionMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/shelter/intake-requests/${reqId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`✅ Request ${status.toLowerCase()} successfully. Farmer notified.`);
        // Update local state immediately
        setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
        setSelectedRequest(null);
        setTimeout(() => setActionMsg(""), 4000);
      } else {
        setActionMsg(`❌ ${data.detail || "Action failed"}`);
      }
    } catch {
      setActionMsg("❌ Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter(r => r.status === filter);

  const statusBadge = (s: string) => {
    const base = "text-xs font-semibold px-2 py-0.5 rounded-full";
    if (s === "Approved") return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
    if (s === "Rejected") return `${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
    return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
  };

  return (
    <div className="p-4 space-y-4">
      {actionMsg && (
        <div className={`rounded-lg p-3 text-sm font-medium ${actionMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400"}`}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground p-8">
          <Spinner size={20} /> Loading intake requests...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 p-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      ) : (
        <Tabs defaultValue="Pending" onValueChange={v => { setFilter(v); setSelectedRequest(null); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="Pending">
              Pending ({requests.filter(r => r.status === "Pending").length})
            </TabsTrigger>
            <TabsTrigger value="Approved">
              Approved ({requests.filter(r => r.status === "Approved").length})
            </TabsTrigger>
            <TabsTrigger value="Rejected">
              Rejected ({requests.filter(r => r.status === "Rejected").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intake Requests — {filter}</CardTitle>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    No {filter.toLowerCase()} requests found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell className="font-semibold">Farmer</TableCell>
                        <TableCell className="font-semibold">Cattle</TableCell>
                        <TableCell className="font-semibold">Breed</TableCell>
                        <TableCell className="font-semibold">Reason</TableCell>
                        <TableCell className="font-semibold">Date</TableCell>
                        <TableCell className="font-semibold">Status</TableCell>
                        <TableCell className="font-semibold">Action</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{req.farmer_name || "—"}</TableCell>
                          <TableCell>{req.cattle_name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{req.cattle_breed || "—"}</TableCell>
                          <TableCell>{req.reason}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <span className={statusBadge(req.status)}>{req.status}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => setSelectedRequest(req)}
                            >
                              <Eye className="w-3 h-3" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Request Detail Panel */}
      {selectedRequest && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">
              Request Details — {selectedRequest.cattle_name || selectedRequest.cattle_id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Farmer</p>
                <p>{selectedRequest.farmer_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Cattle</p>
                <p>{selectedRequest.cattle_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Breed</p>
                <p>{selectedRequest.cattle_breed || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Reason</p>
                <p>{selectedRequest.reason}</p>
              </div>
              {selectedRequest.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Notes</p>
                  <p className="text-muted-foreground">{selectedRequest.notes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Submitted</p>
                <p>{selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</p>
                <span className={statusBadge(selectedRequest.status)}>{selectedRequest.status}</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {selectedRequest.status === "Pending" && (
                <>
                  <Button
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={!!actionLoading}
                    onClick={() => handleAction(selectedRequest.id, "Approved")}
                  >
                    {actionLoading === selectedRequest.id + "Approved"
                      ? <Spinner size={14} />
                      : <CheckCircle className="w-4 h-4" />}
                    Accept & Transfer Animal
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    disabled={!!actionLoading}
                    onClick={() => handleAction(selectedRequest.id, "Rejected")}
                  >
                    {actionLoading === selectedRequest.id + "Rejected"
                      ? <Spinner size={14} />
                      : <XCircle className="w-4 h-4" />}
                    Reject
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
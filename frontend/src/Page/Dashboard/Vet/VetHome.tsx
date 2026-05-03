import { useEffect, useState, useCallback } from "react";
import VetTable, { type Appointment } from "@/components/VetTable";
import { Skeleton } from "@/components/ui/skeleton";

type UserType = {
  name: string;
  role: string;
  vet_id: string;
  license_no: string;
};

const VetHome = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const userString = localStorage.getItem('user');
  const user: UserType | null = userString ? JSON.parse(userString) : null;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const fetchAppointments = useCallback(async () => {
    if (!user?.vet_id) { setLoading(false); return; }
    try {
      const res = await fetch(
        `${API_BASE}/api/vet/appointments/view-appointments?vet_id=${user.vet_id}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const mapped: Appointment[] = json.results.map((item: any) => ({
        aid: item.aid,
        appointment_id: item.appointment_code,
        farmer_name: item.farmer_name,
        cattle_name: item.cattle_name ?? "",
        cattle_tag_id: item.cattle_tag_id,
        inaph_id: item.inaph_id,
        cattle_breed: item.cattle_breed,
        symptoms: item.symptoms,
        appointment_date: item.appointment_date,
        time_slot: item.time_slot,
        status: item.status,
        remarks: item.remarks,
      }));
      setAppointments(mapped);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.vet_id]);

  // Auto-cleanup old resolved appointments (>7 days) on every mount
  const runAutoCleanup = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/vet/appointments/bulk-clear-old?days=7`, {
        method: "DELETE",
      });
    } catch {
      // Silent — cleanup failure should never block the UI
    }
  }, []);

  useEffect(() => {
    runAutoCleanup().then(() => fetchAppointments());
  }, []);

  // Called by VetTable when the vet clears or cancels a row
  const handleDelete = (aid: string) => {
    setAppointments(prev => prev.filter(a => a.aid !== aid));
  };

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground">Please log in to view appointments.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="w-full overflow-hidden rounded-md border">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-muted/30">
                {Array.from({ length: 5 }).map((_, i) => (
                  <th key={i} className="p-3 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <td key={colIndex} className="p-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {appointments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-lg font-medium">No appointments found</p>
          <p className="text-sm mt-2">No appointments available for this veterinarian.</p>
          <p className="text-xs mt-4 text-red-500">
            If the backend server is not running, please start it at {API_BASE}
          </p>
        </div>
      ) : (
        <VetTable data={appointments} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default VetHome;
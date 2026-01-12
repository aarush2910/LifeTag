import React, { useEffect, useState } from "react";
import VetTable, { type Appointment } from "../../../components/VetTable";
import { Skeleton } from "../../../components/ui/skeleton";

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
  // console.log(user?.vet_id)
  useEffect(() => {
    async function getData() {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
        const res = await fetch(
          `http://127.0.0.1:8000/api/vet/appointments/view-appointments?vet_id=${user?.vet_id}`
        );
        const json = await res.json();
        // json = { limit, results: [...], skip, total }
        console.log(json)
        const mapped: Appointment[] = json.results.map((item: any) => ({
          appointment_id: item.appointment_code,          // <-- from API
          farmer_name: item.farmer_name,
          cattle_name: item.cattle_name?? "",       // or use local_cattle_id
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
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, []);

  if (loading) {
    return <div className="p-4"> <div className="w-full overflow-hidden rounded-md border">
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
    </div></div>;
  }

  return (
    <div className="p-4">
      <VetTable data={appointments} />
    </div>
  );
};

export default VetHome;

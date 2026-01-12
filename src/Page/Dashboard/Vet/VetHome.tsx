import React, { useEffect, useState } from "react";
import VetTable, { type Appointment } from "../../../components/VetTable";

type UserType = {
  name: string;
  role: string;
  vet_id: string;
  license_no: string;
};

const VetHome = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
        const res = await fetch(
          `${API_BASE}/api/vet/appointments/view-appointments`
        );
        const json = await res.json();
        // json = { limit, results: [...], skip, total }

        const mapped: Appointment[] = json.results.map((item: any) => ({
          appointment_id: item.appointment_code,          // <-- from API
          farmer_name: item.farmer_name,
          cattle_name: item.cattle_cid_short ?? "",       // or use local_cattle_id
          cattle_tag_id: item.cattle_tag_id,
          inaph_id: item.inaph_id,
          cattle_breed: item.cattle_breed,
          symptoms: item.symptoms,
          appointment_date: item.appointment_date,
          time_slot: item.time_slot,
          // Make sure backend sends values like "Pending" / "Accepted" / "Completed"
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
    return <div className="p-4">Loading appointments...</div>;
  }

  return (
    <div className="p-4">
      <VetTable data={appointments} />
    </div>
  );
};

export default VetHome;

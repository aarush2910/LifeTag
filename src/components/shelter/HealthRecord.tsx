import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import { useState } from "react";
  
  const healthTimeline = [
    {
      date: "2025-11-20",
      type: "Vaccination",
      vet: "Dr. Meera",
      description: "Foot & Mouth Disease vaccine administered",
      medicine: "FMD Vac-20",
    },
    {
      date: "2025-10-15",
      type: "Sick",
      vet: "Dr. Ramesh",
      description: "Mild fever, oral rehydration given",
      medicine: "ORS",
    },
  ];
  
  export default function HealthRecords() {
    const [newEntry, setNewEntry] = useState({
      date: "",
      type: "",
      vet: "",
      description: "",
      medicine: "",
    });
    const [timeline, setTimeline] = useState(healthTimeline);
  
    const addEntry = () => {
      setTimeline([newEntry, ...timeline]);
      setNewEntry({ date: "", type: "", vet: "", description: "", medicine: "" });
    };
  
    return (
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Health Record</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Input
                  placeholder="e.g. Vaccination"
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                />
              </div>
              <div>
                <Label>Vet Name</Label>
                <Input
                  value={newEntry.vet}
                  onChange={(e) => setNewEntry({ ...newEntry, vet: e.target.value })}
                />
              </div>
              <div>
                <Label>Medicine Used</Label>
                <Input
                  value={newEntry.medicine}
                  onChange={(e) => setNewEntry({ ...newEntry, medicine: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              />
            </div>
            <Button onClick={addEntry}>Add Record</Button>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <CardTitle>Health Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {timeline.map((entry, i) => (
                <li key={i} className="border-l-4 pl-4 border-blue-500">
                  <p className="font-bold text-lg">{entry.type} on {entry.date}</p>
                  <p className="text-sm text-gray-600">By: {entry.vet} | Medicine: {entry.medicine}</p>
                  <p>{entry.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }
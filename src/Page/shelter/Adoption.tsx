import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "../../components/ui/card";
  import { Button } from "../../components/ui/button";
  import { Input } from "../../components/ui/input";
  import { Label } from "../../components/ui/label";
  import { useState } from "react";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

interface AdoptionApp {
  appId: string;
  applicant: string;
  date: string;
  animalId: string;
  references: string;
  careIntent: string;
  status: string;
  fee: string;
  signature: string;
}
  
  const availableAnimals = [
    {
      id: "RFID-001",
      name: "Ganga",
      status: "Waiting for Sponsor",
    },
    {
      id: "RFID-002",
      name: "Lakshmi",
      status: "Available for Adoption",
    },
  ];
  
  const adoptionApplications: AdoptionApp[] = [
    {
      appId: "APP-101",
      applicant: "Rajesh Sharma",
      date: "2025-11-18",
      animalId: "RFID-002",
      references: "Farmer ID, local vet certificate",
      careIntent: "Will house in family-owned farm, ensure vaccinations.",
      status: "Pending",
      fee: "",
      signature: "",
    },
  ];
  
  export default function AdoptionProcessing() {
    const [selectedApp, setSelectedApp] = useState<AdoptionApp | null>(null);
    const [applications, setApplications] = useState(adoptionApplications);
  
    const finalizeAdoption = () => {
      if (!selectedApp) return;
      const updated = applications.map((app) =>
        app.appId === selectedApp.appId
          ? { ...app, status: "Adopted" }
          : app
      );
      setApplications(updated);
      alert("Adoption finalized and recorded.");
      setSelectedApp(null);
    };
  
    const handleInputChange = (field: keyof AdoptionApp, value: string) => {
      setSelectedApp((prev) => prev ? { ...prev, [field]: value } : null);
    };
  
    return (
      <div className="p-4 space-y-6">
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Available Animals</TabsTrigger>
            <TabsTrigger value="applications">Adoption Applications</TabsTrigger>
          </TabsList>
  
          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Animals Cleared for Adoption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableAnimals.map((animal) => (
                  <div
                    key={animal.id}
                    className="border p-3 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{animal.name}</p>
                      <p className="text-sm text-gray-500">{animal.status}</p>
                    </div>
                    <Button size="sm">View Profile</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
  
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Adoption Requests Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {applications.map((app) => (
                    <li
                      key={app.appId}
                      className="p-4 border rounded hover:bg-muted cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <div className="flex justify-between">
                        <span><strong>{app.applicant}</strong> applied for {app.animalId}</span>
                        <span className="text-sm text-muted">{app.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
  
        {selectedApp && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Application Review – {selectedApp.applicant}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Animal ID:</strong> {selectedApp.animalId}</p>
              <p><strong>References:</strong> {selectedApp.references}</p>
              <p><strong>Care Intent:</strong> {selectedApp.careIntent}</p>
              <p><strong>Status:</strong> {selectedApp.status}</p>
              <div className="flex gap-2">
                <Button variant="default">Approve & Generate Contract</Button>
                <Button variant="secondary">Put on Hold</Button>
                <Button variant="destructive">Reject</Button>
                <Button variant="ghost" onClick={() => setSelectedApp(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
  
        {selectedApp && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Adoption Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adopter Name</Label>
                <Input value={selectedApp.applicant} readOnly />
              </div>
              <div>
                <Label>Animal ID</Label>
                <Input value={selectedApp.animalId} readOnly />
              </div>
              <div>
                <Label>Signature</Label>
                <Input
                  placeholder="Sign here with stylus or full name"
                  value={selectedApp.signature || ""}
                  onChange={(e) => handleInputChange("signature", e.target.value)}
                />
              </div>
              <div>
                <Label>Adoption Fee / Donation (optional)</Label>
                <Input
                  placeholder="₹ Amount"
                  value={selectedApp.fee || ""}
                  onChange={(e) => handleInputChange("fee", e.target.value)}
                />
              </div>
              <Button variant="default" onClick={finalizeAdoption}>Finalize Adoption</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
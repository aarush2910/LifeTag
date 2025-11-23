import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "../../components/ui/card";
  import { Button } from "../../components/ui/button";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
  import { Input } from "../../components/ui/input";
  import { useState } from "react";
  const animals = [
    {
      tag: "RFID-001",
      name: "Ganga",
      breed: "Sahiwal",
      age: 4,
      pen: "Pen A",
      health: "OK",
      adoptionStatus: "Available",
      photo: "/cowji.jpg",
      inaphId: "INAPH12345678",
      birthDate: "2021-03-15",
      marks: "White spot on forehead",
      weight: 320,
    },
    {
      tag: "RFID-002",
      name: "Lakshmi",
      breed: "Gir",
      age: 3,
      pen: "Pen B",
      health: "Needs Attention",
      adoptionStatus: "Not Available",
      photo: "/cowji.jpg",
      inaphId: "INAPH87654321",
      birthDate: "2022-01-10",
      marks: "Brown patch on left side",
      weight: 280,
    },
  ];
  
  export default function AnimalRegistry() {
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const filtered = animals.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  
    return (
      <div className="p-4">
        <Input
          placeholder="Search by name"
          className="mb-4 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((animal) => (
            <Card key={animal.tag} onClick={() => setSelected(animal)} className="cursor-pointer">
              <CardHeader className="flex items-center gap-4">
                <img src={animal.photo} alt="animal" className="w-16 h-16 rounded object-cover" />
                <div>
                  <CardTitle className="text-base">{animal.name} ({animal.tag})</CardTitle>
                  <p className="text-sm text-green-500">{animal.breed} - Age {animal.age}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
  
        {selected && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Animal Profile - {selected.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <img src={selected.photo} alt="animal" className="w-32 h-32 rounded object-cover" />
                <div>
                  <p><strong>Tag ID:</strong> {selected.tag}</p>
                  <p><strong>Breed:</strong> {selected.breed}</p>
                  <p><strong>Age:</strong> {selected.age}</p>
                  <p><strong>Pen:</strong> {selected.pen}</p>
                  <p><strong>Health:</strong> {selected.health}</p>
                  <p><strong>Weight:</strong> {selected.weight} kg</p>
                  <p><strong>Markings:</strong> {selected.marks}</p>
                  <p><strong>INAPH ID:</strong> {selected.inaphId}</p>
                  <p><strong>Birth Date:</strong> {selected.birthDate}</p>
                  <p><strong>Adoption Status:</strong> {selected.adoptionStatus}</p>
                </div>
              </div>
  
              <div className="mt-4 flex gap-3">
                <Button variant="outline">Edit Info</Button>
                <Button variant="secondary">Move to Another Pen</Button>
                {selected.adoptionStatus === "Available" && (
                  <Button variant="default">View Adoption Profile</Button>
                )}
                <Button onClick={() => setSelected(null)} variant="ghost">Close</Button>
              </div>
  
              <Tabs defaultValue="health" className="mt-6">
                <TabsList>
                  <TabsTrigger value="health">Health Records</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
                  <TabsTrigger value="donation">Donation/Adoption</TabsTrigger>
                </TabsList>
  
                <TabsContent value="health">
                  <p>No health records available. (Placeholder)</p>
                </TabsContent>
                <TabsContent value="activity">
                  <p>Moved to Pen B on 2025-10-10. (Placeholder)</p>
                </TabsContent>
                <TabsContent value="donation">
                  <p>Sponsored by Goshala Trust, May 2025. (Placeholder)</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
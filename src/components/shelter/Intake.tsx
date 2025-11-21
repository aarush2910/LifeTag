import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "../../components/ui/card";
  import { Button } from "../../components/ui/button";
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from "../../components/ui/tabs";
  import cowji from "../../../public/cowji.jpg";
  import { Table, TableHeader, TableRow, TableCell, TableBody } from "../../components/ui/table";
  import { useState } from "react";
  
  const intakeRequests = [
    {
      id: "REQ-001",
      source: "Farmer",
      date: "2025-11-20",
      status: "Pending",
      animal: {
        breed: "Sahiwal",
        age: 3,
        photo: cowji,
      },
      applicant: {
        name: "Ravi Kumar",
        contact: "+91-9876543210",
        reason: "Animal stopped producing milk",
      },
    },
    {
      id: "REQ-002",
      source: "Public",
      date: "2025-11-18",
      status: "Approved",
      animal: {
        breed: "Murrah",
        age: 2,
        photo: "https://placekitten.com/100/101",
      },
      applicant: {
        name: "Suman Devi",
        contact: "+91-8765432109",
        reason: "Injured animal roaming in street",
      },
    },
  ];
  
  export default function IntakeRequests() {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filter, setFilter] = useState("Pending");
  
    const filtered = intakeRequests.filter((r) => r.status === filter);
  
    return (
      <div className="p-4">
        <Tabs defaultValue="Pending" onValueChange={setFilter}>
          <TabsList className="mb-4">
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Approved">Approved</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected</TabsTrigger>
          </TabsList>
  
          <TabsContent value={filter}>
            <Card>
              <CardHeader>
                <CardTitle>Intake Requests - {filter}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>Request ID</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.id}</TableCell>
                        <TableCell>{req.source}</TableCell>
                        <TableCell>{req.date}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(req)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
  
        {selectedRequest && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Details ({selectedRequest.id})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <img
                    src={selectedRequest.animal.photo}
                    alt="Animal"
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div>
                    <p><strong>Breed:</strong> {selectedRequest.animal.breed}</p>
                    <p><strong>Age:</strong> {selectedRequest.animal.age} years</p>
                    <p><strong>Applicant:</strong> {selectedRequest.applicant.name}</p>
                    <p><strong>Contact:</strong> {selectedRequest.applicant.contact}</p>
                    <p><strong>Reason:</strong> {selectedRequest.applicant.reason}</p>
                  </div>
                </div>
                <div className="mt-4 space-x-2">
                  <Button variant="default">Approve</Button>
                  <Button variant="destructive">Reject</Button>
                  <Button variant="secondary" onClick={() => setSelectedRequest(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }
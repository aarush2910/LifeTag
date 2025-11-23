import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
  } from "../../components/ui/card";
  import {
    
    Tag,
 
    Heart,
    Activity as ActivityIcon,
  } from "lucide-react";
  import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
  
  const dashboardStats = {
    intakeRequests: 5,
    totalAnimals: 123,
    tagged: 85,
    untagged: 38,
    pendingAdoptions: 8,
    recentActivity: [
      "Cow #12 tagged",
      "Cow #54 adopted",
      "Cow #33: health alert",
      "Cow #89 added",
    ],
    healthAlerts: ["Cow #33: overdue vaccination", "Cow #72: low weight"],
  };
  
  const chartData = [
    { month: "Jan", intakes: 10, adoptions: 3 },
    { month: "Feb", intakes: 14, adoptions: 6 },
    { month: "Mar", intakes: 12, adoptions: 7 },
    { month: "Apr", intakes: 18, adoptions: 10 },
  ];
  
  export default function Home() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending Intake Requests</CardTitle>
            {/* <Cow className="w-5 h-5 text-blue-500" /> */}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.intakeRequests}</div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            {/* <Cow className="w-5 h-5 text-green-500" /> */}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.totalAnimals}</div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Tagged vs Untagged</CardTitle>
            <Tag className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg">Tagged: {dashboardStats.tagged}</p>
            <p className="text-lg">Untagged: {dashboardStats.untagged}</p>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending Adoptions</CardTitle>
            <Heart className="w-5 h-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardStats.pendingAdoptions}</div>
          </CardContent>
        </Card>
  
        <Card className="md:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <ActivityIcon className="w-5 h-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-4 space-y-1">
              {dashboardStats.recentActivity.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
  
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Intake vs Adoption Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="intakes" fill="#3b82f6" name="Intakes" />
                <Bar dataKey="adoptions" fill="#10b981" name="Adoptions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }
  
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Mail, Phone, MapPin, Tractor, Wheat } from "lucide-react"

export default function FarmerAccountInfo() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-br from-orange-50 to-orange-100 text-gray-900">
      {/* Centered content wrapper */}
      <div className="w-full max-w-6xl p-8 mx-auto lg:ml-[250px]">
        {/* 👆 Adjust ml-[250px] based on your sidebar width */}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-orange-700">Farmer Profile</h1>
          <div className="space-x-3">
            {/* <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-100">
              Edit Profile
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">Settings</Button> */}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Card */}
          <Card className="rounded-2xl shadow-lg border border-orange-200">
            <CardContent className="flex flex-col items-center py-8">
              <img
                src="https://cdn-icons-png.flaticon.com/512/1864/1864593.png"
                alt="Farmer Avatar"
                className="w-28 h-28 rounded-full mb-4 border-4 border-orange-300"
              />
              <h2 className="text-2xl font-semibold text-gray-800">Ramesh Patel</h2>
              <p className="text-gray-600 mb-2">Organic Farmer</p>
              <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-700 rounded-full">
                Verified Farmer
              </span>

              <Separator className="my-4" />

              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Member since:</strong> Feb 2024</p>
                <p><strong>Last Active:</strong> 2 hours ago</p>
                <p><strong>Role:</strong> Farmer</p>
              </div>

              <Button className="mt-5 w-full bg-orange-600 hover:bg-orange-700 text-white">
                Message
              </Button>
            </CardContent>
          </Card>

          {/* Right Info Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Farmer Info */}
            <Card className="rounded-2xl shadow-md border border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Account Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-gray-800">
                  <p><strong>Farmer ID:</strong> FMR12345</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> rameshpatel@gmail.com</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 9876543210</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Nashik, Maharashtra</p>
                </div>
              </CardContent>
            </Card>

            {/* Farm Info */}
            <Card className="rounded-2xl shadow-md border border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Farm Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-gray-800">
                  <p className="flex items-center gap-2"><Tractor className="w-4 h-4" /> <strong>Farm Name:</strong> Green Valley Farms</p>
                  <p className="flex items-center gap-2"><Wheat className="w-4 h-4" /> <strong>Farm Type:</strong> Livestock</p>
                  <p><strong>Farm Size:</strong> 25 Acres</p>
                  <p><strong>Animals:</strong> Cows, Goats, Buffalo</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-2xl shadow-md border border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-orange-700 mb-4">Recent Activity</h3>
                <div className="space-y-3 text-gray-700">
                  <p>🧾 Registered new livestock — <strong>2 hours ago</strong></p>
                  <p>💉 Vaccination record updated — <strong>5 hours ago</strong></p>
                  <p>📋 Appointment booked with vet — <strong>Yesterday</strong></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

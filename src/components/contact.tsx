import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useState } from 'react'
import Spinner from '../components/ui/spinner'

export default function CattleComplaintForm() {
    const [formData, setFormData] = useState({
        reporter_name: '',
        reporter_phone: '',
        reporter_email: '',
        reporter_location: '',
        cattle_count: 1,
        cattle_type: '',
        cattle_condition: '',
        description: '',
        spotted_date: '',
        exact_location: '',
        gps_latitude: '',
        gps_longitude: '',
        nearest_landmark: ''
    })
    const [photo, setPhoto] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [locationLoading, setLocationLoading] = useState(false)

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setLocationLoading(true)
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude

                setFormData(prev => ({
                    ...prev,
                    gps_latitude: lat.toString(),
                    gps_longitude: lon.toString()
                }))

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
                    )
                    const data = await response.json()
                    
                    if (data && data.display_name) {
                        const address = data.address
                        let formattedAddress = data.display_name
                        
                        if (address) {
                            const parts = []
                            if (address.house_number) parts.push(address.house_number)
                            if (address.road) parts.push(address.road)
                            if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb)
                            if (address.village || address.town || address.city) parts.push(address.village || address.town || address.city)
                            if (address.state_district) parts.push(address.state_district)
                            if (address.state) parts.push(address.state)
                            if (address.postcode) parts.push(address.postcode)
                            
                            if (parts.length > 0) {
                                formattedAddress = parts.join(', ')
                            }
                        }

                        setFormData(prev => ({
                            ...prev,
                            exact_location: formattedAddress
                        }))
                    }
                } catch (error) {
                    console.error("Reverse geocoding failed:", error)
                    alert("GPS coordinates captured, but address lookup failed. Please enter address manually.")
                }
                
                setLocationLoading(false)
            }, (error) => {
                console.error("Geolocation error:", error)
                alert("Failed to get location. Please check permissions and try again.")
                setLocationLoading(false)
            })
        } else {
            alert("Geolocation is not supported by this browser.")
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formDataToSend = new FormData()
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                let value = formData[key as keyof typeof formData]
                
                // Convert datetime-local to ISO format for backend
                if (key === 'spotted_date' && value) {
                    // datetime-local format: "2025-10-19T16:14"
                    // Convert to ISO: "2025-10-19T16:14:00"
                    value = value + ':00'
                }
                
                formDataToSend.append(key, String(value))
            })
            
            // Add photo if selected
            if (photo) {
                formDataToSend.append('photo', photo)
            }

            console.log('Sending data to backend...')
            const response = await fetch('http://127.0.0.1:8000/api/complaints/cattle', {
                method: 'POST',
                body: formDataToSend
            })

            console.log('Response received:', response.status)
            
            if (response.ok) {
                const result = await response.json()
                alert(` Complaint registered successfully!\nComplaint ID: ${result.complaint_id}`)
                
                // Reset form
                setFormData({
                    reporter_name: '',
                    reporter_phone: '',
                    reporter_email: '',
                    reporter_location: '',
                    cattle_count: 1,
                    cattle_type: '',
                    cattle_condition: '',
                    description: '',
                    spotted_date: '',
                    exact_location: '',
                    gps_latitude: '',
                    gps_longitude: '',
                    nearest_landmark: ''
                })
                setPhoto(null)
                
                // Reset file input
                const fileInput = document.getElementById('photo') as HTMLInputElement
                if (fileInput) fileInput.value = ''
                
            } else {
                const error = await response.json()
                alert(` Error: ${error.detail || error.error || 'Failed to submit complaint'}`)
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert(` Error: ${error instanceof Error ? error.message : 'Something went wrong'}`)
        }

        setLoading(false)
    }

    return (
        <section className="flex min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-16 md:py-24 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                
                {/* Emergency Contact Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-card rounded-xl border p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Emergency Helpline</h2>
                                <p className="text-sm text-muted-foreground">24/7 Emergency Response</p>
                            </div>
                        </div>
                        <a
                            href="tel:+911234567890"
                            className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                            +91 12345 67890
                        </a>
                    </div>

                    <div className="bg-card rounded-xl border p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Support Email</h3>
                                <p className="text-sm text-muted-foreground">General Inquiries & Support</p>
                            </div>
                        </div>
                        <a
                            href="mailto:support@lifetag.in"
                            className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors">
                            support@lifetag.in
                        </a>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit} autoComplete="off" className="bg-card mx-auto w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-primary/80 p-8 text-primary-foreground">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-black/10 backdrop-blur-sm rounded-full p-2">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold">Report Abandoned Cattle</h1>
                        </div>
                        <p className="text-primary-foreground/80">Help us locate and assist abandoned or stray cattle by providing detailed information</p>
                    </div>

                    {/* Form Body */}
                    <div className="p-8 space-y-8">
                        {/* Reporter Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-3 border-b">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <h4 className="text-lg font-semibold">Reporter Information</h4>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="reporter_name" className="text-sm font-medium">Full Name *</Label>
                                    <Input
                                        type="text"
                                        id="reporter_name"
                                        className="h-11"
                                        value={formData.reporter_name}
                                        onChange={(e) => handleInputChange('reporter_name', e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="reporter_phone" className="text-sm font-medium">Mobile Number *</Label>
                                    <Input
                                        type="tel"
                                        id="reporter_phone"
                                        className="h-11"
                                        value={formData.reporter_phone}
                                        onChange={(e) => handleInputChange('reporter_phone', e.target.value)}
                                        placeholder="+91 XXXXX XXXXX"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="reporter_email" className="text-sm font-medium">Email (Optional)</Label>
                                    <Input
                                        type="email"
                                        id="reporter_email"
                                        className="h-11"
                                        value={formData.reporter_email}
                                        onChange={(e) => handleInputChange('reporter_email', e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="reporter_location" className="text-sm font-medium">Your Location *</Label>
                                    <Input
                                        type="text"
                                        id="reporter_location"
                                        className="h-11"
                                        value={formData.reporter_location}
                                        onChange={(e) => handleInputChange('reporter_location', e.target.value)}
                                        placeholder="Village, District, State"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cattle Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-3 border-b">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                <h4 className="text-lg font-semibold">Cattle Information</h4>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="cattle_count" className="text-sm font-medium">Number of Cattle *</Label>
                                    <Input
                                        type="number"
                                        id="cattle_count"
                                        className="h-11"
                                        min="1"
                                        value={formData.cattle_count}
                                        onChange={(e) => handleInputChange('cattle_count', parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="cattle_type" className="text-sm font-medium">Type of Cattle *</Label>
                                    <Select value={formData.cattle_type} onValueChange={(value) => handleInputChange('cattle_type', value)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select cattle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cow">Cow</SelectItem>
                                            <SelectItem value="Buffalo">Buffalo</SelectItem>
                                            <SelectItem value="Calf">Calf</SelectItem>
                                            <SelectItem value="Bull">Bull</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cattle_condition" className="text-sm font-medium">Condition *</Label>
                                <Select value={formData.cattle_condition} onValueChange={(value) => handleInputChange('cattle_condition', value)}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Healthy but stray">Healthy but stray</SelectItem>
                                        <SelectItem value="Injured">Injured</SelectItem>
                                        <SelectItem value="Sick">Sick</SelectItem>
                                        <SelectItem value="Dead">Dead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Additional Description</Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Any additional details about the cattle..."
                                    className="resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="photo" className="text-sm font-medium">Photo (Optional)</Label>
                                <Input
                                    type="file"
                                    id="photo"
                                    accept="image/*"
                                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                                    className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Incident Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-3 border-b">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h4 className="text-lg font-semibold">Incident Location & Time</h4>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="spotted_date" className="text-sm font-medium">Date & Time Spotted *</Label>
                                    <Input
                                        type="datetime-local"
                                        id="spotted_date"
                                        className="h-11"
                                        value={formData.spotted_date}
                                        onChange={(e) => handleInputChange('spotted_date', e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="nearest_landmark" className="text-sm font-medium">Nearest Landmark</Label>
                                    <Input
                                        type="text"
                                        id="nearest_landmark"
                                        className="h-11"
                                        value={formData.nearest_landmark}
                                        onChange={(e) => handleInputChange('nearest_landmark', e.target.value)}
                                        placeholder="School, Temple, Market, etc."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="exact_location" className="text-sm font-medium">Exact Location *</Label>
                                <Textarea
                                    id="exact_location"
                                    rows={2}
                                    value={formData.exact_location}
                                    onChange={(e) => handleInputChange('exact_location', e.target.value)}
                                    placeholder="Auto-filled when GPS is used, or enter manually"
                                    className="resize-none"
                                    required
                                />
                            </div>

                            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <p className="text-sm font-medium">GPS Coordinates</p>
                                </div>
                                
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gps_latitude" className="text-xs">Latitude</Label>
                                        <Input
                                            type="text"
                                            id="gps_latitude"
                                            className="h-10 bg-background"
                                            value={formData.gps_latitude}
                                            readOnly
                                            placeholder="Auto-filled"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="gps_longitude" className="text-xs">Longitude</Label>
                                        <Input
                                            type="text"
                                            id="gps_longitude"
                                            className="h-10 bg-background"
                                            value={formData.gps_longitude}
                                            readOnly
                                            placeholder="Auto-filled"
                                        />
                                    </div>
                                    
                                    <div className="flex items-end">
                                        <Button 
                                            type="button" 
                                            variant="default"
                                            onClick={getCurrentLocation}
                                            disabled={locationLoading}
                                            className="w-full h-10"
                                        >
                                            {locationLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <Spinner size={16} />
                                                    <span>Getting...</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <span>📍</span>
                                                    <span>Get Location</span>
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Spinner size={20} />
                                    <span>Submitting...</span>
                                </span>
                            ) : (
                                "Submit Complaint"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    )
}

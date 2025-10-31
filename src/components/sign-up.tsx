import { Button } from '../components/ui/button'
import Spinner from '../components/ui/spinner'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Link, useNavigate } from 'react-router-dom'
import { SelectNative } from './ui/select-native'
import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignPage() {
    const id = useId()
    const navigate = useNavigate()

    const [role, setRole] = useState("farmer")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | string[]>("")


    // Farmer fields
    const [fname, setFname] = useState("");
    const [faadhar, setFaadhar] = useState("");
    const [fphone, setFphone] = useState("");
    const [faddress, setFaddress] = useState("");
    const [farmname, setFarmname] = useState("");
    const [farmtype, setFarmtype] = useState("Small");
    const [femail, setFemail] = useState("");

    // Vet fields
    const [vname, setVname] = useState("");
    const [vemail, setVemail] = useState("");
    const [vphone, setVphone] = useState("");
    const [vlicense, setVlicense] = useState("");
    const [vclinic, setVclinic] = useState("");
    const [vaddress, setVaddress] = useState("");

    // Shelter fields
    const [sname, setSname] = useState("");
    const [semail, setSemail] = useState("");
    const [sphone, setSphone] = useState("");
    const [sregistration, setSregistration] = useState("");
    const [saddress, setSaddress] = useState("");
    const [scapacity, setScapacity] = useState("");

    const [password, setPassword] = useState("");

    const handleAadhaarChange = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 12);
        const p1 = digits.slice(0, 4);
        const p2 = digits.slice(4, 8);
        const p3 = digits.slice(8, 12);
        const formatted = [p1, p2, p3].filter(Boolean).join(" ");
        setFaadhar(formatted);
    };

    const handlePhoneChange = (value: string, setter: (v: string) => void) => {
        const digits = value.replace(/\D/g, "").slice(0, 10);
        setter(digits);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        let requestData: any = { role, password }

        if (role === "farmer") {
            requestData = { ...requestData, fname, faadhar, fphone, faddress, farmname, farmtype, femail }
        } else if (role === "vet") {
            requestData = { ...requestData, vname, vemail, vphone, vlicense, vclinic, vaddress }
        } else if (role === "shelter") {
            requestData = { ...requestData, sname, semail, sphone, sregistration, saddress, scapacity: Number(scapacity) }
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/auth/signup/${role}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            })

            let data = null;
            try {
                data = await res.json();
            } catch (err) {
                setError("Invalid response from server");
                return;
            }
            if (!res.ok) {
                if (Array.isArray(data.detail)) {
                    setError(data.detail.map((err: { msg: string }) => err.msg));
                } else {
                    setError(data.detail || data.error || JSON.stringify(data) || "Something went wrong");
                }
            } else {
                alert("Signup successful!");
                navigate("/login");
            }
        } catch (err) {
            console.error(err)
            setError("Network error")
        } finally {
            setLoading(false)
        }
    }

    const renderFields = () => {
        if (role === "farmer") {
            return (
                <>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fname" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Full Name *
                            </Label>
                            <Input type="text" required id="fname" name="fname123" autoComplete="off" className="h-11" placeholder="Enter your full name" value={fname} onChange={(e) => setFname(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aadhar" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Aadhaar Number *
                            </Label>
                            <Input
                                type="text"
                                required
                                id="aadhar"
                                name="aadhar987"
                                autoComplete="off"
                                placeholder="XXXX XXXX XXXX"
                                inputMode="numeric"
                                className="h-11"
                                value={faadhar}
                                maxLength={14}
                                onChange={(e) => handleAadhaarChange(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Phone Number *
                            </Label>
                            <Input type="tel" required id="phone" name="phone456" autoComplete="off" inputMode="numeric" maxLength={10} className="h-11" placeholder="10-digit mobile" value={fphone} onChange={(e) => handlePhoneChange(e.target.value, setFphone)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Email Address *
                            </Label>
                            <Input type="email" required id="email" name="email321" autoComplete="off" className="h-11" placeholder="you@example.com" value={femail} onChange={(e) => setFemail(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Address *
                        </Label>
                        <Input type="text" required id="address" name="address654" autoComplete="off" className="h-11" placeholder="Village, District, State" value={faddress} onChange={(e) => setFaddress(e.target.value)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="farmname" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Farm Name *
                            </Label>
                            <Input type="text" required id="farmname" name="farmname111" autoComplete="off" className="h-11" placeholder="Your farm name" value={farmname} onChange={(e) => setFarmname(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="farmtype" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Farm Type *
                            </Label>
                            <SelectNative id={id} className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 h-11" value={farmtype} onChange={(e) => setFarmtype(e.target.value)}>
                                <option value="Small">Small Scale</option>
                                <option value="Medium">Medium Scale</option>
                                <option value="Large">Large Scale</option>
                            </SelectNative>
                        </div>
                    </div>
                </>
            )
        } else if (role === "vet") {
            return (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="vname" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Full Name *
                        </Label>
                        <Input type="text" required id="vname" name="vname222" autoComplete="off" className="h-11" placeholder="Dr. Your Name" value={vname} onChange={(e) => setVname(e.target.value)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vemail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Email Address *
                            </Label>
                            <Input type="email" required id="vemail" name="vemail333" autoComplete="off" className="h-11" placeholder="you@clinic.com" value={vemail} onChange={(e) => setVemail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vphone" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Phone Number *
                            </Label>
                            <Input type="tel" required id="vphone" name="vphone444" autoComplete="off" inputMode="numeric" maxLength={10} className="h-11" placeholder="10-digit mobile" value={vphone} onChange={(e) => handlePhoneChange(e.target.value, setVphone)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vlicense" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Veterinary License *
                        </Label>
                        <Input type="text" required id="vlicense" name="vlicense555" autoComplete="off" className="h-11" placeholder="License number" value={vlicense} onChange={(e) => setVlicense(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vclinic" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Clinic/Hospital Name *
                        </Label>
                        <Input type="text" required id="vclinic" name="vclinic666" autoComplete="off" className="h-11" placeholder="Name of your clinic" value={vclinic} onChange={(e) => setVclinic(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vaddress" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Clinic Address *
                        </Label>
                        <Input type="text" required id="vaddress" name="vaddress777" autoComplete="off" className="h-11" placeholder="Complete address" value={vaddress} onChange={(e) => setVaddress(e.target.value)} />
                    </div>
                </>
            )
        } else if (role === "shelter") {
            return (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="sname" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Shelter Name *
                        </Label>
                        <Input type="text" required id="sname" name="sname888" autoComplete="off" className="h-11" placeholder="Official shelter name" value={sname} onChange={(e) => setSname(e.target.value)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="semail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Email Address *
                            </Label>
                            <Input type="email" required id="semail" name="semail999" autoComplete="off" className="h-11" placeholder="shelter@example.com" value={semail} onChange={(e) => setSemail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sphone" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Phone Number *
                            </Label>
                            <Input type="tel" required id="sphone" name="sphone000" autoComplete="off" inputMode="numeric" maxLength={10} className="h-11" placeholder="10-digit mobile" value={sphone} onChange={(e) => handlePhoneChange(e.target.value, setSphone)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sregistration" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Registration Number *
                        </Label>
                        <Input type="text" required id="sregistration" name="sregistrationabc" autoComplete="off" className="h-11" placeholder="Official registration number" value={sregistration} onChange={(e) => setSregistration(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="saddress" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Shelter Address *
                        </Label>
                        <Input type="text" required id="saddress" name="saddressdef" autoComplete="off" className="h-11" placeholder="Complete address" value={saddress} onChange={(e) => setSaddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="scapacity" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Animal Capacity *
                        </Label>
                        <Input type="number" required id="scapacity" name="scapacityghi" autoComplete="off" className="h-11" placeholder="Maximum capacity" value={scapacity} onChange={(e) => setScapacity(e.target.value)} />
                    </div>
                </>
            )
        }
    }

    return (
        <section className="flex min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-16 md:py-24 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <form onSubmit={handleSubmit} autoComplete="off" className="bg-card m-auto h-fit w-full max-w-2xl rounded-2xl border shadow-2xl dark:[--color-muted:var(--color-zinc-900)] overflow-hidden">
                {/* Header Section */}
                <div className="bg-primary/80 p-8 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-black/10 backdrop-blur-sm rounded-full p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold">Create Your Account</h1>
                    </div>
                    <p className="text-primary-foreground/80 text-sm">Join LifeTag and manage your livestock with ease</p>
                </div>

                <div className="p-8">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg"
                            >
                                <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    className="flex items-start gap-3"
                                >
                                    <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-red-800 dark:text-red-200">
                                        {Array.isArray(error)
                                            ? error.map((msg, idx) => <div key={idx} className="mb-1 last:mb-0">• {msg}</div>)
                                            : error}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-6">
                       
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Select Your Role *
                            </Label>
                            <SelectNative id="role" className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 h-11 text-base" value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="farmer">🧑‍🌾 Farmer</option>
                                <option value="vet">🩺 Veterinarian</option>
                                <option value="shelter">🏠 Shelter</option>
                            </SelectNative>
                        </div>

                        <hr className="border-zinc-200 dark:border-zinc-800" />

                       
                        {renderFields()}

                        
                        <div className="space-y-2">
                            <Label htmlFor="pwd" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                Password *
                            </Label>
                            <Input 
                                type="password" 
                                required 
                                id="pwd" 
                                name="new-password" 
                                autoComplete="new-password" 
                                className="h-11"
                                placeholder="Create a strong password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Must be at least 8 characters</p>
                        </div>

                        
                
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Spinner size={20} />
                                    <span>Creating Account...</span>
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </div>
                </div>

               
                <div className="bg-zinc-50 dark:bg-zinc-900 border-t dark:border-zinc-800 px-8 py-4">
                    <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Already have an account?
                        <Button asChild variant="link" className="px-2 text-primary hover:text-primary/80 font-semibold">
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}

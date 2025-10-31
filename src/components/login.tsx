import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import Spinner from '../components/ui/spinner'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { SelectNative } from '../components/ui/select-native'
import { useState } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()

  const [role, setRole] = useState("farmer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Login fields
  const [faadhar, setFaadhar] = useState("")
  const [vemail, setVemail] = useState("")
  const [semail, setSemail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Aadhaar validation
    if (role === "farmer") {
      const cleanAadhar = faadhar.replace(/\s/g, '')
      if (!/^\d{12}$/.test(cleanAadhar)) {
        setError("Please enter a valid 12-digit Aadhaar number")
        setLoading(false)
        return
      }
    }

    // Build request payload expected by backend
    let identifier = ""
    if (role === "farmer") {
      identifier = faadhar.replace(/\s/g, '')
    } else if (role === "vet") {
      identifier = vemail
    } else if (role === "shelter") {
      identifier = semail
    }

    const requestData = {
      role,
      password,
      identifier
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      const data = await res.json()
      console.log('Login response status:', res.status, 'body:', data);

      if (!res.ok) {
        setError(data.error || "Invalid Credentials")
      } else {
        // save full response for other pages
        localStorage.setItem('user', JSON.stringify(data))

        // ALSO save the farmer/user id separately so other pages can read it easily
        if (data.user_id) {
          localStorage.setItem('farmerId', data.user_id)
          localStorage.setItem('user_id', data.user_id)
        }

        console.log('Login success, navigating to dashboard', data)
        navigate("/dashboard", { replace: true })
        setTimeout(() => window.location.reload(), 100)
      }

    } catch (err) {
      console.error(err)
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const renderLoginField = () => {
    if (role === "farmer") {
      return (
        <div className="space-y-2">
          <Label htmlFor="faadhar" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Aadhaar Number *
          </Label>
          <Input
            type="text"
            required
            id="faadhar"
            autoComplete="off"
            className="h-11"
            placeholder="XXXX XXXX XXXX"
            value={faadhar}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, '').slice(0, 12)
              v = v.replace(/(\d{4})(?=\d)/g, '$1 ')
              setFaadhar(v)
            }}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter your 12-digit Aadhaar number</p>
        </div>
      )
    } else if (role === "vet") {
      return (
        <div className="space-y-2">
          <Label htmlFor="vemail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Email Address *
          </Label>
          <Input
            type="email"
            required
            id="vemail"
            autoComplete="off"
            className="h-11"
            placeholder="you@clinic.com"
            value={vemail}
            onChange={(e) => setVemail(e.target.value)}
          />
        </div>
      )
    } else if (role === "shelter") {
      return (
        <div className="space-y-2">
          <Label htmlFor="semail" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Email Address *
          </Label>
          <Input
            type="email"
            required
            id="semail"
            autoComplete="off"
            className="h-11"
            placeholder="shelter@example.com"
            value={semail}
            onChange={(e) => setSemail(e.target.value)}
          />
        </div>
      )
    }
  }

  return (
    <section className="flex min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 px-4 py-16 md:py-24 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <form onSubmit={handleSubmit} autoComplete="off" className="bg-card m-auto h-fit w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary/80 p-8 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-black/10 backdrop-blur-sm rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">Sign in to access your LifeTag account</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Role Selection */}
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

            {/* Dynamic Login Field */}
            {renderLoginField()}

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Password *
                </Label>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-primary hover:text-primary/80">
                  <Link to="/forget">Forgot Password?</Link>
                </Button>
              </div>
              <Input
                type="password"
                required
                id="pwd"
                autoComplete="new-password"
                className="h-11"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={20} />
                  <span>Signing in...</span>
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-t dark:border-zinc-800 px-8 py-4">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Don't have an account?
            <Button asChild variant="link" className="px-2 text-primary hover:text-primary/80 font-semibold">
              <Link to="/signup">Create Account</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  )
}

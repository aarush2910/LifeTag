import {  Thermometer, Shield, Repeat, Send, Smartphone, House } from 'lucide-react'

export default function Features() {
  return (
    <section className="pt-8 pb-12 md:pt-12 md:pb-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-balance text-4xl font-bold lg:text-5xl">
            LifeTag Features
          </h2>

          <p>
            Smarter, safer, and simpler livestock tracking for all.
          </p>
        </div>
        <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <House className="size-5" />
              <h3 className="text-sm font-medium">Animal ID</h3>
            </div>
            <p className="text-sm">Unique tags for full-life animal traceability.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="size-5" />
              <h3 className="text-sm font-medium">Health Monitoring</h3>
            </div>
            <p className="text-sm">Real-time health and vaccination updates.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="size-5" />
              <h3 className="text-sm font-medium">Secure Records</h3>
            </div>
            <p className="text-sm">Tamper-proof digital animal and owner data.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Repeat className="size-5" />
              <h3 className="text-sm font-medium">Ownership Transfers</h3>
            </div>
            <p className="text-sm">Track animal sales and new ownership.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Send className="size-5" />
              <h3 className="text-sm font-medium">APIs</h3>
            </div>
            <p className="text-sm">Integrates with government and farm management apps.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="size-5" />
              <h3 className="text-sm font-medium">Mobile Ready</h3>
            </div>
            <p className="text-sm">Offline-friendly app with local language support.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

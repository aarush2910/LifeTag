export default function StatsSection() {
    return (
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
          <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
            <h2 className="text-4xl font-semibold lg:text-5xl">LifeTag in Numbers</h2>
            <p>
              Transforming livestock management through data-driven insights and technology.
            </p>
          </div>
  
          <div className="grid gap-0.5 *:text-center md:grid-cols-3 dark:[--color-muted:var(--color-zinc-900)]">
            <div className="bg-muted rounded-2xl space-y-4 py-12">
              <div className="text-5xl font-bold">10K+</div>
              <p>Animals Tagged</p>
            </div>
            <div className="bg-muted rounded-2xl space-y-4 py-12">
              <div className="text-5xl font-bold">98%</div>
              <p>Data Accuracy</p>
            </div>
            <div className="bg-muted rounded-2xl space-y-4 py-12">
              <div className="text-5xl font-bold">150</div>
              <p>Active Farms</p>
            </div>
          </div>
        </div>
      </section>
    )
  }
  
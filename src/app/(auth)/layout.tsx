import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#060f26_0%,#0a1a42_30%,#0d2455_60%,#1a4898_85%,#1e56bf_100%)]">
      {/* ── Desktop split layout ───────────────────────── */}
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[55%_45%]">

        {/* Left brand panel — desktop only */}
        <div className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
          {/* Decorative radial glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(88,166,255,0.12)_0%,transparent_65%)]" />

          <div className="relative">
            <Image
              src="/hazin-motors-logo.png"
              alt="Hazin Motors"
              width={300}
              height={100}
              className="h-24 w-auto object-contain drop-shadow-lg"
              priority
            />
            <h2 className="font-display mt-8 max-w-sm text-4xl font-bold leading-tight tracking-tight text-white">
              Run the garage from your pocket.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/60">
              Track jobs, stock, customers, and return dates — built for Mercedes Benz workshop floors.
            </p>

            <div className="mt-8 space-y-3">
              {["Real-time job card tracking", "Parts & inventory management", "Customer & vehicle records", "Return date calendar"].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#58a6ff]" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Specialist in Mercedes Benz Services &amp; Repairs</p>
            <p className="mt-1 text-xs text-white/45">Powered by Hazin Motors Workshop System</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10 lg:bg-white/5 lg:backdrop-blur-md lg:dark:bg-black/20">
          {/* Mobile logo — hidden on desktop (left panel has it) */}
          <div className="mb-8 lg:hidden">
            <Image
              src="/hazin-motors-logo.png"
              alt="Hazin Motors"
              width={320}
              height={108}
              className="h-28 w-auto object-contain drop-shadow-xl"
              priority
            />
          </div>

          <div className="w-full max-w-sm">
            {children}
          </div>

          <p className="mt-8 text-center text-xs text-white/30">
            Fast check-ins · Cleaner job flows · Live workshop visibility
          </p>
        </div>
      </div>
    </div>
  )
}

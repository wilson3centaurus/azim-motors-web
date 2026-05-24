import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-[var(--line-soft)] bg-[var(--surface-panel)] shadow-[0_40px_120px_-48px_rgba(21,38,36,0.65)] backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-[#143633] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              Workshop Flow
            </span>
            <h1 className="font-display mt-6 max-w-md text-5xl font-bold leading-tight">
              Run the garage from the palm of your hand.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
              Track jobs, stock, customers, and return dates in one compact system designed for busy workshop floors.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
            <Image
              src="/garage-hero.svg"
              alt="Illustration of a garage and vehicle"
              width={960}
              height={720}
              className="h-auto w-full rounded-[22px]"
              priority
            />
          </div>
        </div>

        <div className="flex min-h-full flex-col justify-between p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div>
              <p className="font-display text-xl font-bold text-[var(--text-strong)]">Hazim Motors</p>
              <p className="text-sm text-[var(--text-muted)]">Mobile-first garage operations</p>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 items-center">{children}</div>

          <div className="mt-8 text-xs text-[var(--text-muted)]">
            Fast check-ins, cleaner job flows, and live workshop visibility.
          </div>
        </div>
      </div>
    </div>
  )
}

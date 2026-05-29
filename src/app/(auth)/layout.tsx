import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-0 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto grid min-h-screen max-w-6xl overflow-hidden rounded-none border-0 bg-[var(--surface-panel)] shadow-none backdrop-blur-sm sm:min-h-[calc(100vh-3rem)] sm:rounded-xl sm:border sm:border-[var(--line-soft)] sm:shadow-[0_40px_120px_-48px_rgba(21,38,36,0.65)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-[#0d2455] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 inline-block rounded-lg bg-white/10 p-3 backdrop-blur-sm">
              <Image
                src="/hazin-motors-logo.png"
                alt="Hazin Motors"
                width={220}
                height={72}
                className="h-16 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="font-display mt-4 max-w-md text-4xl font-bold leading-tight">
              Run the garage from the palm of your hand.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
              Track jobs, stock, customers, and return dates in one compact system designed for busy Mercedes Benz workshop floors.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
            <Image
              src="/garage-hero.svg"
              alt="Illustration of a garage and vehicle"
              width={960}
              height={720}
              className="h-auto w-full rounded-md"
              priority
            />
          </div>
        </div>

        <div className="flex min-h-full flex-col justify-center p-4 sm:p-8 lg:p-10">
          <div className="mx-auto flex w-full max-w-md flex-1 items-center">{children}</div>

          <div className="mt-8 text-xs text-[var(--text-muted)]">
            Fast check-ins, cleaner job flows, and live workshop visibility.
          </div>
        </div>
      </div>
    </div>
  )
}

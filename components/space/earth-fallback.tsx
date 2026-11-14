export function EarthFallback() {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[8%]">
      <div className="relative size-[min(70vw,560px)]">
        <div className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgb(106_220_245/0.22)_45%,transparent_70%)] blur-2xl" />
        <div
          className="absolute inset-0 rounded-full bg-cover bg-center shadow-[inset_-60px_-30px_120px_rgb(3_7_18/0.95),0_0_80px_rgb(106_220_245/0.25)]"
          style={{ backgroundImage: 'url(/textures/earth-night.png)' }}
        />
      </div>
    </div>
  )
}

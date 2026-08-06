import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-9 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <span className="absolute -left-2 top-1 size-6 rotate-45 rounded-sm bg-white/35" />
      <span className="relative text-sm font-black tracking-[-0.12em]">S</span>
    </div>
  )
}

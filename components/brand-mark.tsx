import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-9 place-items-center",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 72 72"
        className="size-9 drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(-5.04 -5.04) scale(1.14)">
          <circle
            cx="36.138"
            cy="35.763"
            r="25.013"
            className="fill-primary stroke-primary-foreground"
            strokeWidth="2.5"
          />
          <path
            d="m37.315 26.332 2.368-2.189c1.156-1.068 3.023-.169 2.908 1.401l-.234 3.216a1.735 1.735 0 0 0 1.468 1.841l3.188.487c1.556.238 2.017 2.258.718 3.147l-2.66 1.822a1.735 1.735 0 0 0-.524 2.296l1.606 2.796c.785 1.364-.507 2.984-2.012 2.523l-3.083-.944a1.735 1.735 0 0 0-2.122 1.022l-1.184 2.999c-.578 1.464-2.65 1.464-3.228 0L33.33 43.75a1.735 1.735 0 0 0-2.122-1.022l-3.083.944c-1.505.461-2.797-1.159-2.012-2.523l1.606-2.796a1.735 1.735 0 0 0-.524-2.296l-2.66-1.822c-1.3-.889-.838-2.909.718-3.147l3.187-.487a1.735 1.735 0 0 0 1.469-1.841l-.235-3.216c-.114-1.57 1.753-2.469 2.909-1.4l2.368 2.188a1.735 1.735 0 0 0 2.364 0Z"
            fill="#E2FF92"
            className="stroke-primary-foreground"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <g className="fill-primary-foreground">
            <ellipse cx="24.191" cy="25.13" rx=".914" ry="1.827" transform="rotate(-48.4 24.191 25.13)" />
            <ellipse cx="36.039" cy="19.052" rx=".914" ry="1.827" />
            <ellipse cx="48.069" cy="25.24" rx="1.827" ry=".914" transform="rotate(-45 48.069 25.24)" />
            <ellipse cx="50.808" cy="38.101" rx=".914" ry="1.827" transform="rotate(-83.6 50.808 38.101)" />
            <ellipse cx="21.473" cy="37.99" rx="1.827" ry=".914" />
            <ellipse cx="29.379" cy="48.704" rx="1.827" ry=".914" transform="rotate(-60 29.379 48.704)" />
            <ellipse cx="43.053" cy="48.737" rx=".914" ry="1.827" transform="rotate(-28.1 43.053 48.737)" />
          </g>
        </g>
      </svg>
    </div>
  )
}

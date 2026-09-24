import { Card } from "@/components/ui";

/**
 * Content-shaped placeholder for the circle detail page, mirroring its header,
 * stat grid and member list so loading matches the circles list page (#157).
 */
export function CircleDetailSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading circle">
      <div className="flex flex-wrap items-start justify-between gap-4 animate-pulse" aria-hidden="true">
        <div>
          <div className="h-3 w-20 rounded-full bg-border" />
          <div className="mt-3 h-7 w-56 rounded-full bg-border" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 rounded-full bg-border" />
          <div className="h-6 w-16 rounded-full bg-border" />
        </div>
      </div>

      <Card className="animate-pulse p-6" aria-hidden="true">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-16 rounded-full bg-border" />
              <div className="mt-2 h-4 w-20 rounded-full bg-border" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-36 rounded-full bg-border" />
      </Card>

      <Card className="animate-pulse overflow-hidden" aria-hidden="true">
        <div className="border-b border-border px-6 py-4">
          <div className="h-3 w-40 rounded-full bg-border" />
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-6 py-4">
              <div className="h-7 w-7 shrink-0 rounded-full bg-border" />
              <div className="h-4 w-40 rounded-full bg-border" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

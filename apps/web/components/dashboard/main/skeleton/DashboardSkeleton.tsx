import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-7 w-10 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <Skeleton className="h-5 w-28 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* YouTube */}
          <Card>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800" />
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>

          {/* Credits */}
          <Card>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800" />
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-2 w-full rounded-full" />
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardHeader className="pb-0">
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[160px] w-full rounded-full mx-auto" style={{ maxWidth: 160 }} />
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800" />
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-24 mb-3" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

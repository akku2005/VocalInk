import { Card, CardHeader, CardContent } from "../ui/Card";
import Skeleton from "./Skeleton";

const BlogCardSkeleton = ({ viewMode = "grid" }) => {
  if (viewMode === "list") {
    return (
      <Card className="animate-pulse overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-80 flex-shrink-0">
            <Skeleton className="w-full h-full aspect-video lg:aspect-square rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none" />
          </div>

          <div className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8 rounded-md" />
                    <Skeleton className="h-4 w-10 rounded-md" />
                    <Skeleton className="h-4 w-8 rounded-md" />
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="group relative flex flex-col h-full bg-surface border border-border/50 rounded-2xl overflow-hidden animate-pulse">
      <Skeleton className="w-full aspect-[16/10] rounded-none" />

      <div className="flex flex-col flex-1 p-5 space-y-4">
        <div className="space-y-3 flex-1">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-8 rounded-md" />
            <Skeleton className="h-4 w-8 rounded-md" />
            <Skeleton className="h-4 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCardSkeleton;

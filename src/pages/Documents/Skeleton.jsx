import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent } from "../../components/ui/card";

export const DocumentSkeletonCard = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4">
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-5/6 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-4" />
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-(--border-primary)">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

export const DocumentDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      <Skeleton className="h-10 w-3/4 mb-4" />
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
      <Skeleton className="h-6 w-1/2 mb-3" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-150 w-full mb-6" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-2" />
    </div>
  );
};

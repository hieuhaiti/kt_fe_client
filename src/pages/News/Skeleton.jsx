import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent } from "../../components/ui/card";

export const SkeletonCard = () => {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Skeleton className="h-52 w-full rounded-none" />
      <CardContent className="flex min-h-72 flex-col p-5">
        <div className="mb-3 flex gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mb-3 h-6 w-5/6" />
        <Skeleton className="mb-5 h-6 w-2/3" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="mt-auto border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-4 h-5 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

export const DetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-(image:--gradient-surface-page)">
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border border-border bg-card p-5 sm:p-7">
          <Skeleton className="mb-4 h-6 w-36" />
          <Skeleton className="mb-3 h-10 w-full max-w-3xl" />
          <Skeleton className="mb-5 h-10 w-2/3" />
          <Skeleton className="mb-2 h-5 w-full max-w-3xl" />
          <Skeleton className="h-5 w-4/5" />
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <Skeleton className="mt-6 h-[18rem] w-full sm:h-[26rem] lg:h-[30rem]" />
        <div className="mx-auto mt-8 max-w-3xl">
          <Skeleton className="mb-3 h-5 w-full" />
          <Skeleton className="mb-3 h-5 w-full" />
          <Skeleton className="mb-3 h-5 w-11/12" />
          <Skeleton className="mb-3 h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    </div>
  );
};

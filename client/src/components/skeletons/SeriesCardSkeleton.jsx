import { Card, CardHeader, CardContent } from '../ui/Card';

const SeriesCardSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <div className="aspect-video bg-secondary-100 rounded-t-lg" />
      <CardHeader className="space-y-3">
        <div className="h-5 bg-secondary-100 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-secondary-100 rounded w-full" />
          <div className="h-4 bg-secondary-100 rounded w-2/3" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 bg-secondary-100 rounded w-16" />
            <div className="h-4 bg-secondary-100 rounded w-12" />
            <div className="h-4 bg-secondary-100 rounded w-20" />
          </div>
          <div className="h-4 bg-secondary-100 rounded w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SeriesCardSkeleton; 
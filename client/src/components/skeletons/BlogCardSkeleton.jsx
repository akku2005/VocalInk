import { Card, CardHeader, CardContent } from '../ui/Card';

const BlogCardSkeleton = () => {
  return (
    <Card className="animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-video bg-secondary-100 rounded-t-lg" />
      
      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Title skeleton */}
          <div className="h-6 bg-secondary-100 rounded w-3/4" />
          {/* Excerpt skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-secondary-100 rounded w-full" />
            <div className="h-4 bg-secondary-100 rounded w-2/3" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Tags skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-secondary-100 rounded-full w-16" />
          <div className="h-6 bg-secondary-100 rounded-full w-20" />
          <div className="h-6 bg-secondary-100 rounded-full w-14" />
        </div>

        {/* Meta information skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-secondary-100 rounded w-20" />
            <div className="h-4 bg-secondary-100 rounded w-16" />
            <div className="h-4 bg-secondary-100 rounded w-24" />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="h-4 bg-secondary-100 rounded w-8" />
            <div className="h-4 bg-secondary-100 rounded w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCardSkeleton;

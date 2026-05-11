export default function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
      <div className="w-full aspect-[16/10] bg-muted rounded-xl animate-pulse" />
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-muted rounded-full animate-pulse" />
          <div className="h-4 w-12 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-6 w-full bg-muted rounded-lg animate-pulse" />
        <div className="h-6 w-3/4 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-2 mt-2">
          <div className="h-3 w-full bg-muted rounded-md animate-pulse" />
          <div className="h-3 w-5/6 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
          <div className="h-3 w-24 bg-muted rounded-md animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
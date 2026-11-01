export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#C6A46A]/20">
        <div className="space-y-2">
          <div className="h-4 bg-gold/20 rounded w-48" />
          <div className="h-8 bg-gray-200 rounded w-72" />
          <div className="h-4 bg-gray-100 rounded w-96" />
        </div>
        <div className="h-9 bg-gray-100 rounded-xl w-60" />
      </div>

      {/* Wedding Selection Horizontal Pills Skeleton */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-40" />
        <div className="flex space-x-3 overflow-hidden pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 border border-gray-200 rounded-2xl w-56 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Wedding Detail Banner Skeleton */}
      <div className="royal-card p-6 bg-navy/80 min-h-[100px] rounded-2xl" />

      {/* Checklist Rows Skeleton */}
      <div className="royal-card p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-3 px-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/5" />
              </div>
            </div>
            <div className="h-7 bg-gray-100 rounded-lg w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

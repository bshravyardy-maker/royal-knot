export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2 pb-4 border-b border-[#C6A46A]/20">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-100 rounded w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="royal-card p-4 space-y-3 min-h-[350px]">
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

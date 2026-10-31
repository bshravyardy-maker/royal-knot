export default function EnquiriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-[#C6A46A]/20">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-100 rounded w-96" />
        </div>
        <div className="h-10 bg-gold/20 rounded-full w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="royal-card p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
      <div className="royal-card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function VendorsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2 pb-4 border-b border-[#C6A46A]/20">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-100 rounded w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="royal-card p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

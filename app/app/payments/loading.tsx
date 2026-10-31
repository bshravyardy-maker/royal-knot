export default function PaymentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2 pb-4 border-b border-[#C6A46A]/20">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-100 rounded w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="royal-card p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-7 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="royal-card p-6 h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

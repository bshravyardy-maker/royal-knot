export default function WeddingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-[#C6A46A]/20">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-100 rounded w-80" />
        </div>
      </div>
      <div className="royal-card p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

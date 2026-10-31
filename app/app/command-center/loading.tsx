export default function CommandCenterLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2 pb-4 border-b border-[#C6A46A]/20">
        <div className="h-8 bg-gray-200 rounded w-72" />
        <div className="h-4 bg-gray-100 rounded w-96" />
      </div>
      <div className="royal-card p-4 h-24 bg-gold/10 rounded-2xl" />
      <div className="royal-card p-6 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

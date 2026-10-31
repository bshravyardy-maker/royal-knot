"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-8">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-2xl font-serif font-bold text-navy">Something went wrong</h2>
      <p className="text-sm text-navy/60 max-w-sm">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="btn-gold text-sm py-2 px-6"
      >
        Try Again
      </button>
    </div>
  );
}

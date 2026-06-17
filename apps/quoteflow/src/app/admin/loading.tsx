export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-[1rem] bg-white/45" />
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1rem] bg-white/45" />
        ))}
      </div>
    </div>
  );
}

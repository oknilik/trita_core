export default function CoachLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

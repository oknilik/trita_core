export function ProfileDoodle() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-indigo-50/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/doodles/chilling.svg"
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

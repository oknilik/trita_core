interface AssessmentDoodleProps {
  src?: string;
}

export function AssessmentDoodle({ src = "/doodles/sitting-reading.svg" }: AssessmentDoodleProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-indigo-50/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="min-h-dvh bg-[#f7f4ef]">
      <div className="mx-auto max-w-[640px] px-5 py-10">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 pb-7">
            <div className="h-14 w-14 rounded-full bg-[#e8e0d3]" />
            <div>
              <div className="h-5 w-32 rounded bg-[#e8e0d3]" />
              <div className="mt-2 h-3 w-44 rounded bg-[#e8e0d3]" />
            </div>
          </div>
          <div className="border-t border-[#e8e0d3] py-6">
            <div className="h-4 w-16 rounded bg-[#e8e0d3]" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-11 rounded-lg border border-[#e8e0d3] bg-white" />
              <div className="h-11 rounded-lg border border-[#e8e0d3] bg-white" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-20 rounded-full bg-[#e8e0d3]" />
              <div className="h-10 w-16 rounded-full bg-[#e8e0d3]" />
              <div className="h-10 w-20 rounded-full bg-[#e8e0d3]" />
            </div>
          </div>
          <div className="border-t border-[#e8e0d3] py-6">
            <div className="h-4 w-32 rounded bg-[#e8e0d3]" />
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-24 rounded-full bg-[#e8e0d3]" />
              <div className="h-10 w-24 rounded-full bg-[#e8e0d3]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

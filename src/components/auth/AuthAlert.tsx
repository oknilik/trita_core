interface AuthAlertProps {
  message: string;
}

export default function AuthAlert({ message }: AuthAlertProps) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-[16px] border border-state-error-border bg-state-error-bg px-4 py-3.5 text-sm leading-relaxed text-state-error-fg"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-current text-xs font-bold"
      >
        !
      </span>
      <span>{message}</span>
    </div>
  );
}

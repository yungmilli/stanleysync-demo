"use client";

export function ConfirmSubmitButton({
  label,
  message,
  className,
}: {
  label: string;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      className={[
        "rounded-full border border-[#12212c]/10 bg-white/70 px-3 py-1.5 text-sm font-medium text-[#12212c] hover:bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  );
}

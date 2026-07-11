"use client";

export function ConfirmSubmit({
  action,
  children,
  confirmText,
  className = "btn btn-ghost btn-sm",
}: {
  action: () => void;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <button className={className}>{children}</button>
    </form>
  );
}

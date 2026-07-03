/** Crosshair corner brackets for cards and panels. */
export default function Corners({ className = "border-accent/60" }: { className?: string }) {
  const base = `absolute h-3 w-3 transition-colors duration-300 ${className}`;
  return (
    <span aria-hidden>
      <span className={`${base} left-0 top-0 -translate-x-px -translate-y-px border-l border-t`} />
      <span className={`${base} right-0 top-0 -translate-y-px translate-x-px border-r border-t`} />
      <span className={`${base} bottom-0 left-0 -translate-x-px translate-y-px border-b border-l`} />
      <span className={`${base} bottom-0 right-0 translate-x-px translate-y-px border-b border-r`} />
    </span>
  );
}

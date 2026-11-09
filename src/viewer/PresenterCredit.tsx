/* Viewer chrome: the presenter credit. Quiet, persistent, never interactive. */
export function PresenterCredit({ className = '' }: { className?: string }) {
  return (
    <div className={`glass pointer-events-none z-[5] flex select-none items-center gap-3 rounded-[16px] py-2.5 pl-2.5 pr-4 ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[15px] font-black text-on-accent">K</span>
      <span className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-2">Presented by</span>
        <span className="whitespace-nowrap text-[13px] leading-tight">
          <span className="font-bold text-text">Kushaal Khanna</span>
          <span className="text-text-2"> · Business Development Manager</span>
        </span>
      </span>
    </div>
  )
}

import { ChevronLeft, ChevronRight, Lock, Plus, RotateCw, Share, Shield, SidebarIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/* MacBook Pro browser window. 1440 × 900 overall, 1440 × 820 of page.
   Traffic lights, a tab strip, the URL bar with a plausible domain,
   glass chrome. Chrome is pointer-events-none. */

export const BROWSER_FRAME = { w: 1440, h: 900, chrome: 80 }

export function MacBookBrowser({ children, path, domain = 'admin.useedera.com', tab = 'e-dera' }: { children: ReactNode; path: string; domain?: string; tab?: string }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden bg-[#F4F5F1]"
      style={{
        width: BROWSER_FRAME.w,
        height: BROWSER_FRAME.h,
        borderRadius: 14,
        boxShadow: '0 0 0 1px rgb(17 19 26 / 0.18), 0 2px 4px rgb(17 19 26 / 0.06), 0 40px 80px -30px rgb(17 19 26 / 0.45), 0 80px 160px -60px rgb(17 19 26 / 0.35)',
      }}
    >
      <div aria-hidden className="pointer-events-none relative z-[70] shrink-0 select-none border-b border-[rgb(17_19_26/0.1)] bg-[linear-gradient(#ECEDE9,#E3E5E0)]" style={{ height: BROWSER_FRAME.chrome }}>
        {/* tab strip */}
        <div className="flex h-[38px] items-end gap-2 pl-4 pr-4">
          <div className="mb-[12px] mr-3 flex gap-2">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57] ring-1 ring-[rgb(0_0_0/0.12)]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E] ring-1 ring-[rgb(0_0_0/0.12)]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840] ring-1 ring-[rgb(0_0_0/0.12)]" />
          </div>
          <SidebarIcon size={16} className="mb-[10px] mr-2 text-[#5c606b]" />
          <div className="flex h-[30px] w-[248px] items-center gap-2 rounded-t-[9px] bg-[#F7F8F4] px-3 text-[12px] font-medium text-[#2a2e3a] shadow-[0_-1px_0_rgb(17_19_26/0.06)]">
            <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-[#123C35] text-[9px] font-black text-[#C9973F]">e</span>
            {tab}
          </div>
          <div className="flex h-[30px] w-[200px] items-center gap-2 rounded-t-[9px] px-3 text-[12px] text-[#5c606b]">
            <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-[#1C6B5A] text-[9px] font-black text-white">C</span>
            Companies House · search
          </div>
          <Plus size={15} className="mb-[8px] text-[#5c606b]" />
        </div>
        {/* toolbar */}
        <div className="flex h-[42px] items-center gap-3 bg-[#F7F8F4] px-4">
          <ChevronLeft size={18} className="text-[#5c606b]" />
          <ChevronRight size={18} className="text-[#a3a7b0]" />
          <RotateCw size={15} className="text-[#5c606b]" />
          <div className="mx-auto flex h-[28px] w-[620px] items-center justify-center gap-2 rounded-[8px] bg-[#E9EBE5] text-[13px] text-[#2a2e3a]">
            <Lock size={12} className="text-[#5c606b]" />
            <span className="font-medium">{domain}</span>
            <span className="text-[#4b4f5c]">{path}</span>
          </div>
          <Shield size={15} className="text-[#5c606b]" />
          <Share size={15} className="text-[#5c606b]" />
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

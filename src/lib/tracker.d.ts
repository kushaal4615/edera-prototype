export declare const ENDPOINT: string
export declare const SECRET: string
export declare function slug(text: string): string
export declare function startTracking(): void
export declare function setScreen(name: string, role?: string): void
export declare function overlayOpened(name: string): void
export declare function overlayClosed(name: string): void
export declare function track(action: string, value?: string | number | boolean | null, extra?: Record<string, unknown>): void

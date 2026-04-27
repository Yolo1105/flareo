/**
 * Root loading state. Shown during the brief moment when Next is
 * streaming a new route. Keeps the visual chrome consistent so the
 * canvas does not flash white.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-accent">
          <span className="block h-1.5 w-1.5 rounded-full bg-accent meta-pulse" />
          LOADING
        </div>
        <div className="font-display text-[20px] font-black tracking-[-0.025em] text-ink-mute">
          FLAREO
        </div>
      </div>
    </div>
  );
}

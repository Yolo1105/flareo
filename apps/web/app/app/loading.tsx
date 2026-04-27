/**
 * App group loading skeleton. Mounted inside the Sidebar, TopBar and
 * StatusBar shell, so those elements stay visible while the page body
 * streams.
 */
export default function AppLoading() {
  return (
    <div className="px-7 py-7">
      <div className="animate-pulse">
        <div className="mb-3 h-[14px] w-[140px] bg-hairline" />
        <div className="mb-2 h-[28px] w-[360px] bg-hairline" />
        <div className="mb-8 h-[14px] w-[260px] bg-hairline-soft" />
        <div className="mb-3 h-[42px] w-full bg-hairline-soft" />
        <div className="mb-3 h-[42px] w-full bg-hairline-soft" />
        <div className="mb-3 h-[42px] w-full bg-hairline-soft" />
      </div>
    </div>
  );
}

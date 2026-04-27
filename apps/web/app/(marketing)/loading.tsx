/**
 * Marketing group loading skeleton. Rendered while any public page streams
 * in. Keeps the nav shell static and just animates the body.
 */
export default function MarketingLoading() {
  return (
    <div className="px-8 py-20">
      <div className="animate-pulse">
        <div className="mb-6 h-[22px] w-[220px] bg-hairline" />
        <div className="mb-4 h-[62px] w-[70%] bg-hairline" />
        <div className="mb-3 h-[62px] w-[60%] bg-hairline" />
        <div className="mt-10 h-[14px] w-[520px] bg-hairline-soft" />
        <div className="mt-2 h-[14px] w-[480px] bg-hairline-soft" />
        <div className="mt-2 h-[14px] w-[440px] bg-hairline-soft" />
      </div>
    </div>
  );
}

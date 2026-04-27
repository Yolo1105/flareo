import { PageHero } from "@/components/ui/PageHero";
import { SignupForm } from "@/components/sections/signup/SignupForm";
import { PreviewConversionDetector } from "@/components/analytics/PreviewConversionDetector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Early access",
  description:
    "Flareo is in closed beta. Join the waitlist and we'll email you when your seat opens.",
};

export default function SignupPage() {
  return (
    <>
      <PageHero
        eyebrow="SIGNUP / CLOSED BETA"
        prompt="echo $EMAIL >> waitlist"
        promptComment="# we email you when your seat opens"
        title={
          <>
            JOIN THE
            <br />
            WAITLIST.
          </>
        }
      >
        Flareo is currently in <span className="text-ink">closed beta</span>.
        We&apos;re onboarding small batches of homelabbers and small-business
        operators as we harden the pipeline. Drop your email and we&apos;ll
        reach out when it&apos;s your turn —{" "}
        <span className="text-accent">no marketing emails</span>, no upsells,
        one message when a seat opens.
      </PageHero>
      <SignupForm />
      <PreviewConversionDetector target="signup" />
    </>
  );
}

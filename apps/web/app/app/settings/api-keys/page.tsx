import type { Metadata } from "next";
import { ViewHeader } from "@/components/sections/app-dashboard/ViewHeader";
import { ApiKeysManager } from "@/components/sections/app-settings/ApiKeysManager";
import { SettingsSidebar } from "@/components/sections/app-settings/SettingsSidebar";

export const metadata: Metadata = {
  title: "API keys",
};

export default function ApiKeysPage() {
  return (
    <>
      <ViewHeader
        eyebrow="SETTINGS &middot; API KEYS"
        title="Programmatic access."
        subtitle="Personal access tokens for the Flareo CLI and CI integrations. Scopes are minimum privilege by default."
      />

      <div className="grid grid-cols-[200px_1fr]">
        <SettingsSidebar active="api-keys" />

        <div className="px-7 py-7">
          <ApiKeysManager />

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="border border-hairline bg-canvas-deep p-5">
              <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                USING A KEY IN CI
              </div>
              <p className="mb-3 font-body text-[12.5px] leading-[1.55] text-ink-softer">
                Set the token as{" "}
                <code className="text-accent">FLAREO_TOKEN</code> in your
                GitHub Actions secrets. The CLI picks it up automatically.
              </p>
              <pre className="overflow-x-auto border border-hairline bg-canvas p-3 font-mono text-[11.5px] leading-[1.65] text-ink-mute">
{`- name: Verify
  env:
    FLAREO_TOKEN: \${{ secrets.FLAREO_TOKEN }}
  run: flareo verify my_module@\${{ github.sha }}`}
              </pre>
            </div>
            <div className="border border-hairline bg-canvas-deep p-5">
              <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
                REVOCATION
              </div>
              <p className="font-body text-[12.5px] leading-[1.55] text-ink-softer">
                Revoking a key takes effect within 30 seconds. All cached
                sessions using it are invalidated. If you suspect a leak,
                revoke immediately. The reason stays visible in the audit
                log for 90 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

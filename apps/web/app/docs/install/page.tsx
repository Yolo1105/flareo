import { DocPage } from "@/components/docs/DocPage";
import { PreviewConversionDetector } from "@/components/analytics/PreviewConversionDetector";
import Content from "./content.mdx";

export const metadata = { title: "Install the CLI" };

export default function Page() {
  return (
    <DocPage slug="/docs/install" title="Install the CLI">
      <Content />
      <PreviewConversionDetector target="docs_install" />
    </DocPage>
  );
}

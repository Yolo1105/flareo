import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Threat model" };

export default function Page() {
  return (
    <DocPage slug="/docs/threat-model" title="Threat model">
      <Content />
    </DocPage>
  );
}

import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Trust Score methodology" };

export default function Page() {
  return (
    <DocPage slug="/docs/trust-score" title="Trust Score methodology">
      <Content />
    </DocPage>
  );
}

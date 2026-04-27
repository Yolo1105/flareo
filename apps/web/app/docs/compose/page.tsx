import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Generate compose files" };

export default function Page() {
  return (
    <DocPage slug="/docs/compose" title="Generate compose files">
      <Content />
    </DocPage>
  );
}

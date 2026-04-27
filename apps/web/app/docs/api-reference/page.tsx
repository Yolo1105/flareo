import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "API reference" };

export default function Page() {
  return (
    <DocPage slug="/docs/api-reference" title="API reference">
      <Content />
    </DocPage>
  );
}

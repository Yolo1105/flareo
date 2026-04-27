import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "CLI reference" };

export default function Page() {
  return (
    <DocPage slug="/docs/cli-reference" title="CLI reference">
      <Content />
    </DocPage>
  );
}

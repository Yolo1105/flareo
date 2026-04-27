import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Pull and run" };

export default function Page() {
  return (
    <DocPage slug="/docs/pull-run" title="Pull and run">
      <Content />
    </DocPage>
  );
}

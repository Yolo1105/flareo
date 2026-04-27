import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Writing a good module" };

export default function Page() {
  return (
    <DocPage slug="/docs/good-module" title="Writing a good module">
      <Content />
    </DocPage>
  );
}

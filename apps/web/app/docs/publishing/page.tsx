import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Publishing a module" };

export default function Page() {
  return (
    <DocPage slug="/docs/publishing" title="Submission overview">
      <Content />
    </DocPage>
  );
}

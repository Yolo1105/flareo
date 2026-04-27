import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Submitting a Dockerfile" };

export default function Page() {
  return (
    <DocPage slug="/docs/submitting-dockerfiles" title="Submitting a Dockerfile">
      <Content />
    </DocPage>
  );
}

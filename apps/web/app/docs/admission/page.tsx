import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Admission policies" };

export default function Page() {
  return (
    <DocPage slug="/docs/admission" title="Admission policies">
      <Content />
    </DocPage>
  );
}

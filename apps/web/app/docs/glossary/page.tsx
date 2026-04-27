import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Glossary" };

export default function Page() {
  return (
    <DocPage slug="/docs/glossary" title="Glossary">
      <Content />
    </DocPage>
  );
}

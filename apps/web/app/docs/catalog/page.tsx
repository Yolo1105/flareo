import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Browse the catalog" };

export default function Page() {
  return (
    <DocPage slug="/docs/catalog" title="Browse the catalog">
      <Content />
    </DocPage>
  );
}

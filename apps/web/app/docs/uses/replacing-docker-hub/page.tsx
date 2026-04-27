import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Replacing Docker Hub in a homelab" };

export default function Page() {
  return (
    <DocPage
      slug="/docs/uses/replacing-docker-hub"
      title="Replacing Docker Hub in a homelab"
    >
      <Content />
    </DocPage>
  );
}

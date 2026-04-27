import { DocPage } from "@/components/docs/DocPage";
import Content from "./content.mdx";

export const metadata = { title: "Review timelines" };

export default function Page() {
  return (
    <DocPage slug="/docs/review-timelines" title="Review timelines">
      <Content />
    </DocPage>
  );
}

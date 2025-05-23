import Header from "@/components/header"
import PluginHeader from "@/components/plugin-header"
import PluginContent from "@/components/plugin-content"
import Footer from "@/components/footer"

export default function PluginDetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <PluginHeader />
      <PluginContent />
      <Footer />
    </div>
  )
}

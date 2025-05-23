import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { PluginSubmissionForm } from "@/components/plugin-submission-form"

export default function UploadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PluginSubmissionForm />
      </main>
      <Footer />
    </div>
  )
} 
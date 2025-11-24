import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SharedHeader } from "@/components/SharedHeader"
import { FooterNavigation } from "@/components/FooterNavigation"

export default function TypographyPage() {
  return (
    <div className="min-h-screen bg-[#1a1814]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Tipografia</h1>
          <p className="text-xl text-white/80 mb-8">
            A marca se baseia fortemente em tipografia bem equilibrada e confiante
          </p>
          <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814]">Download Inter Font Family</Button>
        </div>

        <Card className="bg-[#1a1814] border-[#c8b79e]/20">
          <CardContent className="p-8">
            <div className="mb-8">
              <p className="text-[#c8b79e] text-sm mb-2">Fonte</p>
              <h2 className="text-white text-6xl font-bold mb-8">Inter</h2>
            </div>

            <div className="space-y-6">
              <p className="text-[#c8b79e] text-sm mb-4">Tamanhos</p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-white text-5xl font-bold">Heading 1</h3>
                  <p className="text-white/60 text-sm">Inter 60 Bold</p>
                </div>
                <div>
                  <h3 className="text-white text-4xl font-bold">Heading 2</h3>
                  <p className="text-white/60 text-sm">Inter 48 Bold</p>
                </div>
                <div>
                  <h3 className="text-white text-2xl font-bold">Heading 3</h3>
                  <p className="text-white/60 text-sm">Inter 32 Bold</p>
                </div>
                <div>
                  <h3 className="text-white text-xl font-semibold">Heading 4</h3>
                  <p className="text-white/60 text-sm">Inter 24 Semibold</p>
                </div>
                <div>
                  <p className="text-white text-base">Texto do corpo</p>
                  <p className="text-white/60 text-sm">Inter 16 Regular</p>
                </div>
                <div>
                  <p className="text-white text-sm">Texto pequeno</p>
                  <p className="text-white/60 text-sm">Inter 14 Regular</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <FooterNavigation />
      </main>
    </div>
  )
}

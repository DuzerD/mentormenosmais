import { Card, CardContent } from "@/components/ui/card"
import { SharedHeader } from "@/components/SharedHeader"
import { FooterNavigation } from "@/components/FooterNavigation"

export default function ImageryPage() {
  return (
    <div className="min-h-screen bg-[#1a1814]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Imagens</h1>
          <p className="text-xl text-white/80 max-w-2xl">
            As imagens visuais se inspiram nas profundezas da excelência empresarial, evocando uma sensação de
            exploração e descoberta.
          </p>
        </div>

        <Card className="bg-[#1a1814] border-[#c8b79e]/20">
          <CardContent className="p-8">
            <div className="mb-8">
              <div className="w-full h-64 bg-gradient-to-r from-[#c8b79e] via-[#b09e85] to-[#1a1814] rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-4xl font-bold">BrandPlot</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-full h-48 bg-gradient-to-br from-[#c8b79e] to-[#b09e85] rounded-lg mb-4"></div>
                <p className="text-white/80 text-sm">
                  Descubra o poder dos reflexos e sombras; um símbolo refinado e expressivo que reflete a essência da
                  nossa marca.
                </p>
              </div>
              <div>
                <div className="w-full h-48 bg-gradient-to-br from-[#b09e85] to-[#1a1814] rounded-lg mb-4"></div>
                <p className="text-white/80 text-sm">
                  Domine a arte da fotografia empresarial e potencialize suas criações com assets de imagem de alta
                  classe.
                </p>
              </div>
              <div>
                <div className="w-full h-48 bg-gradient-to-br from-[#d0c0a8] to-[#c8b79e] rounded-lg mb-4"></div>
                <p className="text-white/80 text-sm">
                  Abrace o charme do nosso estilo de imagem, oferecendo uma jornada visual excepcional que complementa
                  nossa identidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <FooterNavigation />
      </main>
    </div>
  )
}

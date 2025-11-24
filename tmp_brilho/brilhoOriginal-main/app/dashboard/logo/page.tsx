import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SharedHeader } from "@/components/SharedHeader"
import { FooterNavigation } from "@/components/FooterNavigation"

export default function LogoPage() {
  return (
    <div className="min-h-screen bg-[#1a1814]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Logo</h1>
          <p className="text-xl text-white/80 mb-6">
            Logo pode ser usado apenas como símbolo ou na orientação horizontal ou vertical.
          </p>
          <p className="text-white/60 mb-8">Disponível na versão colorida e monocromática</p>
          <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814]">Download BrandPlot Logo Pack</Button>
        </div>

        <Card className="bg-[#1a1814] border-[#c8b79e]/20 mb-8">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="bg-[#1a1814] border border-[#c8b79e]/20 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-[#c8b79e] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-[#1a1814] font-bold text-xl">B</span>
                </div>
                <p className="text-white text-sm">Símbolo do logo</p>
              </div>
              <div className="bg-[#1a1814] border border-[#c8b79e]/20 rounded-lg p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-[#c8b79e] rounded-full flex items-center justify-center mr-2">
                    <span className="text-[#1a1814] font-bold text-sm">B</span>
                  </div>
                  <span className="text-white font-bold text-lg">BrandPlot</span>
                </div>
                <p className="text-white text-sm">Logo completo horizontal</p>
              </div>
              <div className="bg-[#1a1814] border border-[#c8b79e]/20 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-8 h-8 bg-[#c8b79e] rounded-full flex items-center justify-center mb-1">
                    <span className="text-[#1a1814] font-bold text-sm">B</span>
                  </div>
                  <span className="text-white font-bold text-sm">Brand</span>
                  <span className="text-white font-bold text-sm">Plot</span>
                </div>
                <p className="text-white text-sm">Logo completo vertical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Uso</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Zona de proteção</h3>
              <p className="text-white/80 mb-6">A zona de proteção é 2/3 do tamanho do logo para cada lado.</p>
              <Card className="bg-[#1a1814] border-[#c8b79e]/20">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#c8b79e] rounded-full flex items-center justify-center mr-2">
                      <span className="text-[#1a1814] font-bold text-sm">B</span>
                    </div>
                    <span className="text-white font-bold">BrandPlot</span>
                    <span className="text-[#c8b79e] ml-4 text-sm">56px</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Tamanho mínimo</h3>
              <p className="text-white/80 mb-6">O tamanho mínimo do logo é 24px.</p>
              <Card className="bg-[#1a1814] border-[#c8b79e]/20">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 bg-[#c8b79e] rounded-full flex items-center justify-center mr-2">
                      <span className="text-[#1a1814] font-bold text-xs">B</span>
                    </div>
                    <span className="text-white font-bold text-sm">BrandPlot</span>
                    <span className="text-[#c8b79e] ml-4 text-xs">24px</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <FooterNavigation />
      </main>
    </div>
  )
}

import { Card, CardContent } from "@/components/ui/card"
import { SharedHeader } from "@/components/SharedHeader"
import { FooterNavigation } from "@/components/FooterNavigation"

export default function ColorsPage() {
  return (
    <div className="min-h-screen bg-[#1a1814]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Cores</h1>
          <p className="text-xl text-white/80 max-w-4xl">
            Nossa marca emprega um esquema de cores com dourado quente, marrom rico e acentos elegantes contrastando
            cores creme e marrom escuro. Complementado por preto, conjunto de cinzas, branco.
          </p>
        </div>

        <Card className="bg-[#1a1814] border-[#c8b79e]/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#c8b79e] rounded-lg h-24 flex items-end p-4">
                <div>
                  <p className="text-[#1a1814] font-medium text-sm">Dourado Claro</p>
                  <p className="text-[#1a1814]/70 text-xs">#c8b79e</p>
                </div>
              </div>
              <div className="bg-[#b09e85] rounded-lg h-24 flex items-end p-4">
                <div>
                  <p className="text-white font-medium text-sm">Dourado Médio</p>
                  <p className="text-white/70 text-xs">#b09e85</p>
                </div>
              </div>
              <div className="bg-[#d0c0a8] rounded-lg h-24 flex items-end p-4">
                <div>
                  <p className="text-[#1a1814] font-medium text-sm">Dourado Hover</p>
                  <p className="text-[#1a1814]/70 text-xs">#d0c0a8</p>
                </div>
              </div>
              <div className="bg-[#1a1814] border border-[#c8b79e]/20 rounded-lg h-24 flex items-end p-4">
                <div>
                  <p className="text-white font-medium text-sm">Fundo Escuro</p>
                  <p className="text-white/70 text-xs">#1a1814</p>
                </div>
              </div>
            </div>

            <h3 className="text-white font-semibold mb-4">Tons de Âmbar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-amber-400 rounded-lg h-20 flex items-end p-3">
                <div>
                  <p className="text-amber-900 font-medium text-sm">Amber 400</p>
                </div>
              </div>
              <div className="bg-amber-500 rounded-lg h-20 flex items-end p-3">
                <div>
                  <p className="text-amber-900 font-medium text-sm">Amber 500</p>
                </div>
              </div>
              <div className="bg-amber-600 rounded-lg h-20 flex items-end p-3">
                <div>
                  <p className="text-white font-medium text-sm">Amber 600</p>
                </div>
              </div>
              <div className="bg-amber-700 rounded-lg h-20 flex items-end p-3">
                <div>
                  <p className="text-white font-medium text-sm">Amber 700</p>
                </div>
              </div>
            </div>

            <h3 className="text-white font-semibold mb-4">Cores de Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 font-medium text-sm">Alto</p>
                <p className="text-red-300/70 text-xs">Prioridade alta</p>
              </div>
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300 font-medium text-sm">Médio</p>
                <p className="text-yellow-300/70 text-xs">Prioridade média</p>
              </div>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 font-medium text-sm">Baixo</p>
                <p className="text-green-300/70 text-xs">Prioridade baixa</p>
              </div>
              <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-4">
                <p className="text-gray-300 font-medium text-sm">Padrão</p>
                <p className="text-gray-300/70 text-xs">Status padrão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <FooterNavigation />
      </main>
    </div>
  )
}

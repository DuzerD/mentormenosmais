import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download } from "lucide-react"
import { SharedHeader } from "@/components/SharedHeader"
import { FooterNavigation } from "@/components/FooterNavigation"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DownloadPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1814]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Download</h1>
          <p className="text-xl text-white/80 mb-8">
            Obtenha todos os assets da marca em vários formatos para uso digital e impresso
          </p>
        </div>

        <Card className="bg-[#1a1814] border-[#c8b79e]/20">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-white text-2xl font-bold mb-4">Pacote de Logo</h3>
                <p className="text-white/80 mb-6">
                  Conjunto completo de logos incluindo símbolo, versões horizontal e vertical em múltiplos formatos.
                </p>
                <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Pacote de Logo
                </Button>
              </div>

              <div>
                <h3 className="text-white text-2xl font-bold mb-4">Guia da Marca</h3>
                <p className="text-white/80 mb-6">
                  Documento completo do guia da marca com todas as especificações e regras de uso.
                </p>
                <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Guia PDF
                </Button>
              </div>

              <div>
                <h3 className="text-white text-2xl font-bold mb-4">Paleta de Cores</h3>
                <p className="text-white/80 mb-6">
                  Amostras de cores e códigos para todas as cores da marca em vários formatos (HEX, RGB, CMYK).
                </p>
                <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Paleta de Cores
                </Button>
              </div>

              <div>
                <h3 className="text-white text-2xl font-bold mb-4">Tipografia</h3>
                <p className="text-white/80 mb-6">
                  Família de fontes Inter em todos os pesos e estilos para uso web e impresso.
                </p>
                <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Família de Fontes
                </Button>
              </div>
            </div>

            <div className="mt-12 p-6 bg-[#c8b79e]/10 border border-[#c8b79e]/20 rounded-lg">
              <h3 className="text-white text-xl font-bold mb-4">Pacote Completo da Marca</h3>
              <p className="text-white/80 mb-6">
                Obtenha tudo em um pacote abrangente incluindo todos os logos, diretrizes, cores e fontes.
              </p>
              <Button className="bg-[#c8b79e] hover:bg-[#d0c0a8] text-[#1a1814] text-lg px-8 py-3">
                <Download className="w-5 h-5 mr-2" />
                Download Pacote Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        <FooterNavigation />
      </main>
    </div>
    </ProtectedRoute>
  )
}

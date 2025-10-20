import { Card, CardContent } from "@/components/ui/card"
import { SharedHeader } from "@/components/SharedHeader"
import { FooterNavigation } from "@/components/FooterNavigation"

export default function TonePage() {
  return (
    <div className="min-h-screen bg-[#1a1814]">
      <SharedHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Tom de voz</h1>
          <p className="text-xl text-white/80 max-w-2xl">
            Mantenha-se consistente, genuíno e alinhado com nossos valores de marca para promover uma conexão forte com
            nosso público.
          </p>
        </div>

        <Card className="bg-[#1a1814] border-[#c8b79e]/20">
          <CardContent className="p-8 space-y-12">
            <div>
              <h2 className="text-white text-3xl font-bold mb-4">Inovador e otimista</h2>
              <p className="text-white/80">
                Seja ousado, confiante e visionário, refletindo nosso compromisso com a inovação e otimismo.
              </p>
            </div>

            <div>
              <h2 className="text-white text-3xl font-bold mb-4">Confiável e Confiável</h2>
              <p className="text-white/80">
                Instile confiança com linguagem que é confiável, credível e tranquilizadora, enfatizando nossa{" "}
                <span className="text-[#c8b79e]">confiabilidade</span>.
              </p>
            </div>

            <div>
              <h2 className="text-white text-3xl font-bold mb-4">Orientado à Ação</h2>
              <p className="text-white/80">
                Encoraje <span className="text-[#c8b79e]">ação</span> e destaque o caminho para a{" "}
                <span className="text-[#c8b79e]">inovação</span>, refletindo nossa ênfase em dar passos proativos.
              </p>
            </div>

            <div>
              <h2 className="text-white text-3xl font-bold mb-4">Profissional mas Acessível</h2>
              <p className="text-white/80">
                Encontre um equilíbrio entre <span className="text-[#c8b79e]">profissionalismo</span> e{" "}
                <span className="text-[#c8b79e]">acessibilidade</span>, sendo caloroso e amigável enquanto mantém um{" "}
                <span className="text-[#c8b79e]">nível de sofisticação</span>.
              </p>
            </div>
          </CardContent>
        </Card>

        <FooterNavigation />
      </main>
    </div>
  )
}

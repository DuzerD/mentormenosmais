import { Button } from "@/components/ui/button"

export function CompletionPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center space-y-8 animate-fade-in py-12">
        {/* Success Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-black leading-tight">
            APLICAÇÃO ENVIADO
            <br />
            COM SUCESSO
          </h1>
          <p className="text-lg text-gray-600">Mas ainda não acabou...</p>
        </div>

        {/* Material Banner */}
        <div className="bg-[#d4f4dd] rounded-2xl py-6 px-8">
          <p className="text-lg font-semibold text-gray-800">Material Liberado por tempo LIMITADO!</p>
        </div>

        {/* Content Section */}
        <div className="space-y-6 pt-4">
          <h2 className="text-3xl md:text-4xl font-bold text-black">MATERIAL LIBERADO!</h2>

          <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-xl mx-auto px-4">
            Como ter um discurso claro que te permite falar menos e vender mais. Não é um curso. Não é teoria. É o
            primeiro passo estratégico para empreendedores que querem parar de perder dinheiro com comunicação rasa.
          </p>

          {/* Instagram CTA */}
          <div className="pt-6 space-y-6">
            <div className="text-xl md:text-2xl font-semibold text-black leading-snug max-w-lg mx-auto px-4">
              Escreva a palavra &quot;menos&quot; no direct do <span className="text-[#222052]">@menosmaistd</span>
              <br />E garanta seu material exclusivo.
            </div>

            <Button
              asChild
              className="px-12 py-6 text-lg font-semibold bg-[#222052] hover:bg-[#1a1840] text-white rounded-xl transition-colors"
            >
              <a href="https://instagram.com/menosmaistd" target="_blank" rel="noopener noreferrer">
                Ir para o Instagram
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProblemSection() {
  return (
    <section className="bg-zinc-950 py-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            Essa é a proposta do Mentoor
          </span>
          <h2 className="text-balance text-4xl font-bold text-white md:text-6xl">
            Quanto vale parar de trabalhar o dobro para faturar o triplo?
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-pretty text-xl text-gray-400">
            Pensa em quanto tempo da sua vida você já gastou fazendo tudo sozinho(a): atendendo, criando, vendendo e
            ainda sentindo que nunca é o bastante. Agora imagina ter uma marca que fala por você, atrai os clientes
            certos e devolve o tempo que o trabalho roubou.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="relative">
            <img
              src="/stressed-entrepreneur-working-late-at-night-on-lap.jpg"
              alt="Empreendedora sobrecarregada trabalhando até tarde"
              className="h-full w-full rounded-2xl object-cover"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <span className="flex-shrink-0 text-3xl">😮‍💨</span>
              <p className="text-gray-400">
                E quanto da sua energia tem ido embora tentando resolver o que não é sua função principal?
              </p>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <span className="flex-shrink-0 text-3xl">✨</span>
              <p className="text-gray-400">
                O Mentoor foi criado para simplificar o crescimento de quem cansou da confusão e quer clareza,
                posicionamento e paz no negócio.
              </p>
            </div>

            <p className="pt-4 text-lg font-semibold text-white">
              Bem-vindo(a) ao Mentoor — o método para falar menos, faturar mais e viver o que o seu trabalho prometeu.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

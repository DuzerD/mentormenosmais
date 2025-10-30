const painPoints = [
  {
    icon: "hourglass_top",
    title: "Comunicação que consome energia",
    description:
      "Você cria conteúdo, campanhas e propostas diferentes toda semana, mas a mensagem nunca parece consistente o suficiente para converter com previsibilidade.",
  },
  {
    icon: "layers",
    title: "Oferta difícil de explicar",
    description:
      "O produto evoluiu, mas ainda é preciso contar a história inteira para cada cliente novo. Falta clareza sobre a transformação real que você entrega.",
  },
  {
    icon: "rocket_launch",
    title: "Crescimento travado",
    description:
      "Sem priorização e sem materiais de apoio, o time gira em círculos. A sensação é de estar sempre atrasado, mesmo trabalhando mais do que deveria.",
  },
]

const promiseHighlights = [
  "Diagnóstico do posicionamento e da jornada do cliente",
  "Roteiro de mensagens para canais e propostas",
  "Plano de 90 dias com foco nas ações que movem a receita",
]

export function ProblemSection() {
  return (
    <section id="solucao" className="bg-slate-900/10 pb-24 pt-20 text-slate-900">
      <div className="container mx-auto grid gap-16 px-4 lg:grid-cols-[1.15fr_1fr] lg:px-8">
        <div className="space-y-8">
          <span className="inline-flex items-center rounded-full border border-slate-300/60 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Quando tudo depende de você
          </span>
          <h2 className="text-balance text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Sua marca entrega muito. Mas sem uma narrativa afinada, o resultado não acompanha.
          </h2>
          <p className="text-lg leading-relaxed text-slate-600">
            O Mentoor nasce para founders e times enxutos que precisam alinhar mensagem, promessa e experiência sem
            transformar a operação em um caos. Em minutos você descobre onde está a incoerência, quais peças precisam ser
            ajustadas e recebe os materiais para colocar a marca em ordem.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <p className="font-semibold text-slate-900">
              O que você leva do diagnóstico Mentoor:
            </p>
            <ul className="mt-4 space-y-3">
              {promiseHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-base text-sky-500">check_circle</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6">
          {painPoints.map((point) => (
            <article
              key={point.title}
              className="rounded-3xl border border-white/40 bg-white/70 p-6 text-slate-700 backdrop-blur transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="material-symbols-outlined mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl text-sky-500">
                {point.icon}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{point.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

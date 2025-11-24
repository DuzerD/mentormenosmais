const features = [
  {
    title: "Hub de posicionamento",
    description:
      "Um painel onde você enxerga a essência da marca em uma única página: promessa, diferenciais, personas e âncoras de comunicação.",
    icon: "target",
  },
  {
    title: "Biblioteca de mensagens",
    description:
      "Headlines, argumentos e scripts adaptados para landing pages, propostas, redes sociais e funil comercial – tudo no tom da sua marca.",
    icon: "library_books",
  },
  {
    title: "Playbooks acionáveis",
    description:
      "Sequências prontas para campanhas, lançamentos e relacionamento. Cada playbook vem com metas, checkpoints e indicadores.",
    icon: "auto_stories",
  },
  {
    title: "Acompanhamento de impacto",
    description:
      "Acesso ao Mentoor IA para ajustar mensagem, medir evolução e mover as prioridades conforme o negócio cresce.",
    icon: "insights",
  },
]

export function FeaturesSection() {
  return (
    <section id="resultados" className="bg-white py-24">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="max-w-xl space-y-6">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            O que você recebe
          </span>
          <h2 className="text-balance text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
            Um sistema completo para manter a marca coerente e vender com tranquilidade.
          </h2>
          <p className="text-lg leading-relaxed text-slate-600">
            O Mentoor não entrega um PDF estático. Você recebe um hub vivo que organiza posicionamento, materiais prontos
            e plano de execução. Tudo pensado para founders e times pequenos colocarem a estratégia em prática no dia a
            dia.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
            <p className="text-sm font-semibold text-slate-900">Resultados que clientes relatam:</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-base text-indigo-500">north_east</span>
                Crescimento mais previsível por alinhar marketing, vendas e entrega em uma narrativa única.
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-base text-indigo-500">north_east</span>
                Tempo recuperado – em vez de refazer materiais, basta adaptar o que já foi aprovado no diagnóstico.
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-base text-indigo-500">north_east</span>
                Time confiante para comunicar valor sem depender de fundador(a) em toda conversa.
              </li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_25px_50px_rgba(79,70,229,0.12)]"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-transparent to-blue-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="material-symbols-outlined mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-500">
                {feature.icon}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

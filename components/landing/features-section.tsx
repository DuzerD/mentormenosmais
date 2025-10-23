const features = [
  {
    icon: "layers",
    title: "Clareza & direção",
    description:
      "Descubra onde está o ruído da sua comunicação e o que precisa mudar para atrair clientes certos com leveza.",
  },
  {
    icon: "chat_bubble",
    title: "Mensagem & posicionamento",
    description:
      "Transforme o que você já faz em uma mensagem que conecta e diferencia — sem precisar se explicar o tempo todo.",
  },
  {
    icon: "bolt",
    title: "Sistema estratégico com IA",
    description: "Monte um fluxo simples para gerar ideias, mensagens e propostas — sem depender de improviso.",
  },
  {
    icon: "trending_up",
    title: "Plano de ação validado",
    description: "Saia com um plano leve e claro, pronto para aplicar e gerar resultado nas próximas semanas.",
  },
]

export function FeaturesSection() {
  return (
    <section id="beneficios" className="bg-zinc-950 py-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            O que você vai receber
          </span>
          <h2 className="text-balance text-4xl font-bold text-white md:text-5xl">
            O método que transforma confusão em clareza
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.icon}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 transition-colors hover:border-primary/50"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <span className="material-symbols-outlined text-3xl text-white">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-gray-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

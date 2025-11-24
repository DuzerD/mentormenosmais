const testimonials = [
  {
    name: "Ana Silva",
    role: "CMO & cofundadora",
    company: "SaaS de logística",
    content:
      "Em uma semana conseguimos alinhar a proposta do produto e atualizar todas as peças comerciais. O time agora fala a mesma língua e os fechamentos ficaram mais rápidos.",
    rating: 5,
    avatar: "/professional-woman-avatar.jpg",
  },
  {
    name: "Carlos Mendes",
    role: "CEO",
    company: "Consultoria de crescimento",
    content:
      "O diagnóstico traduziu o valor da nossa solução em mensagens simples. Hoje os leads chegam entendendo o que fazemos e as reuniões são muito mais objetivas.",
    rating: 5,
    avatar: "/professional-man-avatar.jpg",
  },
  {
    name: "Juliana Costa",
    role: "Head de Marketing",
    company: "Edtech B2B",
    content:
      "Ganhei clareza sobre a jornada e recebi playbooks prontos. Economizamos horas produzindo conteúdo e elevamos a consistência da marca em todos os canais.",
    rating: 5,
    avatar: "/professional-woman-avatar-smiling.jpg",
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-slate-900/10 py-24 text-slate-900">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Histórias reais
          </span>
          <h2 className="mt-6 text-balance text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
            Profissionais que destravaram clareza, tempo e receita com o Mentoor.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 text-slate-600 shadow-[0_20px_45px_rgba(15,23,42,0.1)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="mb-5 flex gap-1 text-sky-500">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <span key={index} className="material-symbols-outlined text-xl">
                    star
                  </span>
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-700">"{testimonial.content}"</p>
              <div className="mt-6 flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="h-12 w-12 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-xs text-slate-500">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  {
    name: "Ana Silva",
    role: "Criadora de conteúdo",
    company: "Mentoria digital",
    content:
      "O Mentoor me ajudou a entender exatamente o que faltava na minha comunicação. Em 30 dias dobrei meu engajamento e comecei a receber propostas melhores.",
    rating: 5,
    avatar: "/professional-woman-avatar.jpg",
  },
  {
    name: "Carlos Mendes",
    role: "Empresário em ascensão",
    company: "Consultoria digital",
    content:
      "Finalmente consegui estruturar minha presença online. O diagnóstico foi preciso e o plano de ação me deu clareza total sobre os próximos passos.",
    rating: 5,
    avatar: "/professional-man-avatar.jpg",
  },
  {
    name: "Juliana Costa",
    role: "Social media & marketing",
    company: "Agência própria",
    content:
      "Método validado e direto ao ponto. Hoje tenho um sistema de conteúdo funcionando no piloto automático e clientes satisfeitos com os resultados.",
    rating: 5,
    avatar: "/professional-woman-avatar-smiling.jpg",
  },
]

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-4xl font-bold md:text-5xl">
            Profissionais que simplificaram com o método e voltaram a viver de verdade
          </h2>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <span key={index} className="material-symbols-outlined text-xl text-primary">
                    star
                  </span>
                ))}
              </div>
              <p className="mb-6 text-gray-700">"{testimonial.content}"</p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="h-12 w-12 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role} · {testimonial.company}
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

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "O diagnóstico é realmente personalizado?",
    answer:
      "Sim! O diagnóstico Mentoor analisa especificamente o seu negócio, o posicionamento atual e os objetivos que você define. A IA processa suas respostas para gerar insights únicos e um plano de ação customizado — nada de relatório genérico.",
  },
  {
    question: "Quanto tempo leva para receber o retorno?",
    answer:
      "O diagnóstico completo é gerado em tempo real assim que você finaliza as perguntas. Você recebe imediatamente o plano de ação de 90 dias, a análise de posicionamento e recomendações de conteúdo personalizadas.",
  },
  {
    question: "Preciso ter a marca pronta para fazer o teste?",
    answer:
      "Não! O Mentoor foi criado justamente para quem está começando ou quer reestruturar a presença digital. Mesmo sem audiência ou marca consolidada, você recebe orientações claras para construir seu posicionamento do zero.",
  },
  {
    question: "Como funciona a criação de conteúdo com IA?",
    answer:
      "Depois do diagnóstico, você tem acesso ao Mentoor IA, que gera posts, legendas e ideias de conteúdo alinhadas ao seu posicionamento. A IA aprende com as suas respostas e replica a voz da sua marca.",
  },
  {
    question: "Posso usar o Mentoor para múltiplas marcas?",
    answer:
      "Pode sim! Você pode rodar diagnósticos separados para cada marca ou projeto. Cada diagnóstico gera um plano de ação independente, permitindo que você gerencie várias marcas com estratégias personalizadas.",
  },
]

export function FaqSection() {
  return (
    <section className="bg-gradient-to-b from-blue-50/50 to-white px-4 py-24">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-zinc-900">Perguntas frequentes</h2>
          <p className="mt-3 text-lg text-zinc-600">Tire dúvidas rápidas antes de iniciar o diagnóstico Mentoor.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${index}`}
              className="rounded-lg border border-zinc-200 bg-white px-6 shadow-sm"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-zinc-900 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

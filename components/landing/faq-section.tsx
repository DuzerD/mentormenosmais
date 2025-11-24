import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "O diagnóstico é realmente personalizado?",
    answer:
      "Sim. A IA do Mentoor considera suas respostas, o estágio do negócio e dados históricos para gerar insights alinhados ao seu contexto. Nada de relatórios genéricos: você recebe recomendações que se encaixam no seu momento.",
  },
  {
    question: "Quanto tempo demora para receber o retorno?",
    answer:
      "O relatório fica pronto imediatamente após responder às perguntas. Em menos de cinco minutos você tem o resumo estratégico, o plano de 90 dias e os materiais essenciais para executar.",
  },
  {
    question: "Preciso ter a marca pronta para fazer o diagnóstico?",
    answer:
      "O Mentoor ajuda tanto quem está estruturando a marca agora quanto negócios que cresceram rápido e precisam organizar a mensagem. Basta ter clareza sobre o produto, público e objetivos.",
  },
  {
    question: "Como funciona o apoio contínuo do Mentoor IA?",
    answer:
      "Você tem acesso ao hub com atualizações ilimitadas, gera novas mensagens sob demanda, recebe playbooks para campanhas e pode solicitar revisões mensais do nosso time para garantir consistência.",
  },
  {
    question: "Posso usar o Mentoor para mais de uma marca?",
    answer:
      "Pode sim. É possível rodar diagnósticos separados para cada marca ou linha de produto, mantendo planos e materiais organizados em espaços diferentes dentro da plataforma.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="bg-gradient-to-b from-slate-50 to-white py-24">
      <div className="container mx-auto max-w-3xl px-4 lg:px-0">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Dúvidas frequentes
          </span>
          <h2 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">Antes de dar o primeiro passo</h2>
          <p className="mt-4 text-base text-slate-600">
            Se não encontrar sua resposta, fale com a gente pelo Instagram @menosmaistd ou pelo e-mail contato@mentoor.app.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`faq-${index}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            >
              <AccordionTrigger className="px-6 py-4 text-left text-base font-semibold text-slate-900 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-sm leading-relaxed text-slate-600">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

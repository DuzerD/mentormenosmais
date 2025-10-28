# Mercado Pago – Passo a passo de configuração

## 1. Variáveis de ambiente obrigatórias

| Variável             | Descrição                                                                           |
|----------------------|--------------------------------------------------------------------------------------|
| `APP_URL`            | URL pública da aplicação (ex.: `https://app.menoroumais.com`). Usada em callbacks.   |
| `MP_ACCESS_TOKEN`    | Access token do Mercado Pago com permissão para criar preferências de pagamento.     |
| `MP_WEBHOOK_SECRET`  | Segredo usado para validar a assinatura (`x-mercadopago-signature`) do webhook.      |

Defina-as no `.env.local` (já há placeholders criados) e no ambiente de produção.

## 2. Registrar a URL de webhook

1. Acesse o painel do Mercado Pago (`https://www.mercadopago.com.br/developers/panel`).
2. Em **Webhooks**, cadastre a URL pública:  
   `https://SEU-DOMINIO/api/mercadopago/webhook`
3. Informe o mesmo segredo configurado em `MP_WEBHOOK_SECRET`.
4. Marque o tópico **`payment`** (pagamentos) para receber notificações de status.
5. Salve e utilize o botão **Enviar teste** para garantir que a resposta é `200`.

## 3. Testar o fluxo sandbox

1. Gere uma preferência pela aplicação (botão “Liberar Missão 3” ou seleção de plano no onboarding).
2. Finalize o pagamento em sandbox com um cartão de teste.
3. Confirme no dashboard do Mercado Pago que o pagamento foi aprovado.
4. Verifique na base `brandplot` se os campos `missaoLiberada` e `onboardingMetadata.lastPayment` foram atualizados.
5. Tente o login novamente — a API deve responder com sucesso e o painel mostrar Missão 3 liberada.

## 4. Mensagens ao usuário

- Ao tentar login com pagamento pendente, o backend responde com:  
  “Seu pagamento ainda está em processamento…” — fique à vontade para ajustar o texto em `app/api/login/route.ts`.
- Caso deseje reforçar no front, exiba banners/avisos adicionais no dashboard ou na tela de login.

## 5. Observabilidade (opcional)

- Adicione logs ou um provider (Datadog, Logtail, etc.) dentro de `app/api/mercadopago/webhook/route.ts` para monitorar falhas.
- Configure alertas caso algum webhook retorne código diferente de `200`.

Seguindo os passos acima, qualquer pagamento aprovado deve liberar automaticamente as missões relacionadas. 

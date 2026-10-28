# Treino Híbrido

App PWA (React 19 + Vite, sem backend) que guia o Filipe num protocolo de
reabilitação de fascite plantar + treino híbrido (musculação + corrida),
2026-2028. Live: https://filipebiten.github.io/treino-hibrido/

## Arquitetura

- Sem React Router — `src/App.jsx` roteia telas via `scr` (useState).
- Log append-only em `src/lib/eventos.js` — `{ id, data, timestamp, tipo, payload }`.
  Nunca editar/remover eventos do passado; correção é sempre um evento novo. Edição
  retroativa de dia (`aplicarEdicaoDia`) faz **merge** com o evento existente, nunca
  substitui tudo — evita perder campos não tocados na edição.
- Estado em `src/lib/storage.js` (`defaultState()`, localStorage key `th1`). Campo novo
  = sempre aditivo, nunca remove/renomeia campo existente sem camada de compatibilidade.
- Relatórios são funções puras em `src/lib/relatorios.js`, com gate explícito de amostra
  mínima (nunca mostrar estatística/tendência com n pequeno).
- Sem dependência nova, sem API externa (clima, Strava, etc) — tudo roda local.

## O método (Time Híbrido, Victor Pareto) — regras R1-R5

Musculação e corrida são pilares iguais, não um subordinado ao outro. Em
`src/lib/agendamento.js` (`validarAgendamento`, `distribuicaoIntensidade`):

- **R1** (bloqueio real): leg day (Musculação B) + corrida no mesmo dia é proibido.
  Corrida regenerativa fica pro dia seguinte.
- **R2** (sugestão forte, sobrescrevível): dia seguinte a leg day pede corrida
  regenerativa (caminhada/walk-run), não qualidade/longão.
- **R3** (informativo): dois treinos diferentes no mesmo dia, avisa mas não bloqueia.
- **R4**: distribuição de intensidade de corrida — alerta se >20% das corridas forem
  intensas (amostra mínima de 3).
- **R5**: regra dos 10% — volume semanal de corrida não sobe mais de 10% sobre a
  média das últimas 4 semanas (`lib/corrida-temporada.js`).

## Roadmap de temporadas (gerenciado em `state.temporadas`, Relatório 14)

10km → dez/2026 · meia-maratona → 2027 · maratona → 2028, com exceção de redução de
musculação só na reta final de maratona (volume de corrida alto demais pra manter
musculação no mesmo volume). Não pular a meia — volume triplica da meia pra maratona.
Temporadas são registro paralelo gerenciado pelo usuário: **não** dirigem a macrofase
fixa em `data/plano.js` automaticamente.

## Modo manutenção vitalícia (Bloco 6, `data/rehab.js`)

Quando o plano fixo de 15 semanas termina (03/01/2027), rehab cai pra manutenção
1x/dia + Rathleff 2x/semana fixo (segunda+quinta). Reativa sozinho o protocolo
intensivo (`getRehabManutencaoVitalicia(diaSemana, reativado)`) se a dor ficar acima
da baseline 3 dias seguidos — a recaída clássica é parar assim que melhora, então
isso nunca deve depender de decisão manual.

## Gates (nunca pular)

- **Pliometria** (`data/forcaProtetiva.js`, `gatePliometria`): só libera com 28 dias
  de dor baixa (média ≤2) e estável (pico ≤4). Pliometria em fascite ativa piora.
- **Silbernagel** (progressão de macrofase, `lib/progressao.js`): dor ≤5/10, sem
  subir de semana — não é ≤2/10 por 5 dias (critério antigo, mantido só como
  comparação informativa).
- Nenhum gate é alarme/bloqueio de ACWR — ACWR é só gráfico de tendência
  (Impellizzeri 2020: sem evidência sólida como preditor de lesão).

## Tipos de evento (append-only, `lib/eventos.js`)

`dor_checkin, carga_pe, nota_dia, rehab_dose, rathleff, treino_concluido,
treino_pulado, teste, recuo_automatico, passos_semana, forca_protetiva,
pliometria, teste_funcional` — mais os campos ricos de `treino_concluido` pra
corrida: `fcMedia, temperaturaC, umidadePct, superficie, tenisId, cadencia`.

## Ajuste de calor (`lib/corrida-temporada.js`)

Sem API de clima — entrada manual de temperatura/umidade no `DiaEdit`. Acima de
20°C, +2% de ritmo a cada 5°C, +2% extra se umidade >60%.

## O que NÃO fazer (explícito no spec original, não quebrar)

- Virar app de corredor puro — musculação continua pilar até 2028.
- Regressão estatística dor~carga (n pequeno, variáveis confundidas) — só dispersão
  descritiva.
- Parsear export do Apple Health.
- Integrar API de clima, Strava, Darebee, MuscleWiki ou qualquer fonte externa.
- Streak que reseta, badge de culpa, alarme de dia perdido (Lally 2010).
- ACWR como alerta de risco.
- Deletar, renomear ou descartar qualquer evento do log.

## Workflow de mudança

1. Implementar aditivo (nunca remover campo/tipo de evento existente).
2. `npm run build` + `npx eslint src/<arquivos tocados>` — limpo antes de testar.
3. Testar ao vivo via `npx vite preview` + claude-in-chrome sempre que der; pra
   features gated por tempo/amostra longa, testar a função pura via Node e dizer
   isso explicitamente no commit (nunca afirmar "testado ao vivo" sem ter feito).
4. Commit pequeno, um por item, mensagem honesta sobre o que foi/não foi testado.

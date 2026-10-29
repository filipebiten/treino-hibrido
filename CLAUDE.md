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
pliometria, teste_funcional, pergunta_pulada, passos_dia, treino_importado`
— mais os campos ricos de `treino_concluido` pra corrida: `fcMedia,
temperaturaC, umidadePct, superficie, tenisId, cadencia`.

- `pergunta_pulada { perguntaId }` — Bloco 1, usuário tocou "pular" na fila.
- `passos_dia { total }` — Bloco 3, um por dia, vem da importação do Atalho.
- `treino_importado { tipo, distanciaKm, duracaoMin, fcMedia, cadencia }` —
  Bloco 3, registro do iPhone pro dia. Nunca sobrescreve `treino_concluido`
  sozinho — mesclar é ação explícita do usuário (`lib/importacao.js
  mesclarTreinoImportado`).
- `cargas[exName].historico[].reps` (não é evento, vive em `state.cargas`) —
  Bloco 5.3, reps realmente feitas por série (opcional, null se não
  preenchido). Base do e1RM (`lib/treino.js e1rm`, Epley, só até 10 reps).

## Fila de perguntas (Bloco 1, `lib/perguntas.js`)

Motor puro: `CATALOGO` (13 perguntas — dor, carga de pé, 7 campos pós-corrida,
semana declarada, peso, passos, teste de campo, teste funcional), cada uma
com `deveriaPerguntar(ctx)` e `prioridade`. `filaCandidatos(ctx)` devolve a
fila ordenada; quem aplica o limite de **2 por visita à Home** é o
`FilaPerguntasCard` (estado local, reseta a cada montagem do componente —
cada volta pra Home conta como "abertura"). "Pular" sempre grava
`pergunta_pulada` e não reaparece no mesmo dia; **3 pulos seguidos sem
resposta depois** (`pulosConsecutivos`) tira a pergunta da fila até ela ser
respondida uma vez (modo discreto — fica só em Histórico/Relatórios).

Campos pós-corrida (distância, tempo, temperatura, umidade, superfície,
tênis, cadência) são o fallback de quem pulou tudo na captura do
WorkoutScreen (Bloco 2) — fazem merge no `treino_concluido` do dia, nunca
criam evento duplicado.

## Home — no máximo 5 blocos (Bloco 5.1)

Ordem fixa: 1) rehab pendente + força protetiva, 2) fila de perguntas
(máx 2), 3) treino em andamento ou próximo treino, 4) no máximo 1 alerta
ativo (reativação de manutenção > gate de macrofase > recaída, nessa
ordem), 5) grid de treinos. Tudo mais (instalar PWA, backup, plano
se-então, bem-vindo de volta, nota de manutenção/semana apertada) vai pro
card "Mais", recolhido por padrão. Rodapé é tab bar fixa (Hoje · Histórico
· Relatórios · Ajustes) — Lembretes e Recalibrar vivem em Ajustes.

## Importação do Atalho do iPhone (Bloco 3, `lib/importacao.js`)

**Não existe API web pra HealthKit — isso não é contornável.** O Atalho
(app nativo do iOS) lê o Saúde e copia um JSON pra área de transferência;
o app só lê esse JSON com `navigator.clipboard.readText()` (gesto do
usuário obrigatório) — fallback textarea, fallback `<input type=file>`.
Isso é diferente de parsear o `export.xml` do Apple Saúde (continua
proibido, ver "o que NÃO fazer" — arquivo gigante, trava navegador).

Contrato do JSON (**mudar quebra o Atalho já montado no iPhone**):
```json
{
  "versao": 1,
  "gerado": "AAAA-MM-DD",
  "passos": [{ "data": "AAAA-MM-DD", "total": 7421 }],
  "treinos": [{ "data": "AAAA-MM-DD", "tipo": "corrida", "distanciaKm": 4.2, "duracaoMin": 32, "fcMedia": 138, "cadencia": 168 }],
  "peso": [{ "data": "AAAA-MM-DD", "kg": 86.8 }]
}
```
Idempotente por (data, tipo) — reimportar não duplica. Peso manual sempre
vence o importado (`payload.importado` marca a diferença); passos e
treinos não têm essa noção de conflito (ver comentário em
`prepararPreview`).

## Ajuste de calor (`lib/corrida-temporada.js`)

Sem API de clima — entrada manual de temperatura/umidade no `DiaEdit`. Acima de
20°C, +2% de ritmo a cada 5°C, +2% extra se umidade >60%.

## O que NÃO fazer (explícito no spec original, não quebrar)

- Virar app de corredor puro — musculação continua pilar até 2028.
- Regressão estatística dor~carga (n pequeno, variáveis confundidas) — só dispersão
  descritiva.
- Parsear export.xml do Apple Health (arquivo gigante, trava navegador) OU
  fingir que existe acesso direto ao HealthKit via web — não existe, ponto
  final, não é falta de biblioteca. A única ponte é o Atalho do iPhone +
  clipboard (ver "Importação do Atalho", Bloco 3). Não tentar "integrar com
  o Saúde" de outro jeito numa sessão futura.
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

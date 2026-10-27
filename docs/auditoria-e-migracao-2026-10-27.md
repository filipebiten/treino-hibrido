# Auditoria + plano de migração — passo 0 (antes do Bloco 1-4)

Executado conforme a "ORDEM DE EXECUÇÃO" do prompt de evolução funcional
(versão BLOCO 1-4, com REGRA ZERO de preservação de dados). Só backup +
auditoria + plano aqui. Nenhum código de feature foi tocado.

## 1. Backup

`backups/treino-eventos-2026-10-27.json` — export completo do log real do
usuário (puxado do `localStorage` no celular dele via export JSON do app).

**Divergência do diagnóstico do prompt**: o prompt assumia 53 eventos desde
21/09. O export real tem **57 eventos**, com o primeiro em **07/08/2026**
(duas doses de rehab pré-cirurgia/pré-marco-zero). Isso não invalida a
tabela de aderência do prompt (que já usa 21/09 como início), mas o
denominador de "doses totais" deveria recontar a partir do log real, não do
número citado no prompt.

## 2. O que já existe e já está alinhado com a Regra Zero

- `src/lib/eventos.js` já é um log append-only com `registrar/editar/remover`
  puros — nenhuma função sobrescreve em lote.
- `src/lib/storage.js` já tem schema versionado (`SCHEMA_VERSION`, chave
  `th1`) e uma migração idempotente de chaves legadas (`tp7*`) para o
  formato de eventos, guardada por flag (`eventosMigrados`), sem perda.
- Os relatórios já tratam ausência de dado como "sem dados" em vez de
  inventar (ver comentário ponytail no relatório 7 — volume de corrida).

Conclusão: a arquitetura atual já segue o princípio aditivo que a Regra Zero
pede. A migração de schema proposta abaixo é uma extensão desse padrão, não
uma mudança de abordagem.

## 3. Correção a uma premissa do prompt (benchmark, item c)

O prompt diz: *"O protocolo de Rathleff é A CADA DOIS DIAS... Se o app conta
dose diária, o denominador da aderência está inflado."*

Isso **não é verdade neste código**. `src/lib/progressao.js:93-100` já trava
Rathleff com `RATHLEFF_MIN_MS = 36h` (`rathleffStatus`) — o usuário não
consegue registrar duas sessões em menos de 36h, então a cadência real já é
a cada 1,5-3 dias, não diária. Além disso, hoje **não existe relatório de
aderência do Rathleff** (o Relatório 1 só cobre `periodo: manha/noite` do
rehab geral) — não há denominador inflado porque não há denominador nenhum
ainda. O item do Bloco 1.2 do prompt vale como "criar relatório de
aderência do Rathleff com denominador correto (janela de 36-72h)", não como
"corrigir" algo que já existe.

O item (a) ACWR como alerta de risco **é real e procede**:
`Relatorio5Acwr.jsx` já pinta "risco alto" em vermelho (`color.pain`) acima
de 1.5. Rebaixar pra gráfico descritivo é uma mudança concreta e pequena
(trocar cor/rótulo, manter o número).

O gate M1→M2 (`progressao.js:46-53`, dor ≤2/10 por 5 dias) é real e
confirmado. Substituir por critério Silbernagel é mudança concreta na
função `gateM1toM2`.

## 4. Onde cada parte do Bloco 1-4 toca o código real

| Bloco | Arquivo(s) principais | Tipo de mudança |
|---|---|---|
| 1.1-1.2 Home + aderência corrigida | `App.jsx`, `relatorios.js` (`aderenciaRehab`), novo relatório Rathleff | aditiva |
| 1.3 Plano se-então | novo campo em `state` (`planoSeEntao: {texto, barreira}`), não é evento | aditiva |
| 1.5 Streak sem punição | `Relatorio1Aderencia.jsx` ou componente Home — é só UI, sem novo dado | nenhuma mudança de schema |
| 1.6 Lembrete | novo, sem tocar em dados existentes | n/a |
| 2.1-2.3 Tela de treino | **já existe**: `src/components/WorkoutScreen.jsx` (148 linhas) — índice sequencial (`sI`), contador de série (`cS`), `resume` pra retomar, Wake Lock já pedido (`pedirWakeLock`/`liberarWakeLock`, `src/lib/wakelock.js`). Navegação livre (2.4) e troca de exercício (2.5) são adições a esse componente existente, não tela nova. |
| 2.2 Timer | **confirmado o bug**: `src/components/Timers.jsx` — `TabataTimer` usa `setInterval` decrementando `time` tick a tick (`t > 1 return t-1`), sem `Date.now()`/timestamp e sem listener de `visibilitychange`. É exatamente o padrão que o navegador suspende em aba/app em segundo plano. Fix é local a esse arquivo + o cronômetro de descanso equivalente em `WorkoutScreen.jsx`. |
| 2.5 Troca de exercício | `src/data/musculacao.js` — adicionar `padrao`, `impactoPlantar`, `alternativas[]` em cada exercício de `m:[...]` nas 4 fases × MA/MB/MC (~30 exercícios). Puramente aditivo, não quebra nada existente. |
| 3.1 Gate Silbernagel | `progressao.js` `gateM1toM2` — substitui critério, mantém o antigo acessível 30 dias (precisa guardar os dois resultados) |
| 3.3-3.7 e1RM/volume/PR/sRPE | novas funções em `relatorios.js`/novo lib, leem de `state.cargas` e eventos existentes — aditivo |
| Exportação Web Share | `Relatorio10Export.jsx` — troca de mecanismo de download, não de dado |

**Achado que muda a ordem sugerida**: o Bloco 2 (tela de treino com timer
robusto, navegação livre, séries estilo Hevy) pressupõe uma tela de
execução de treino que registra série a série. Não localizei esse
componente no grep rápido — pode já existir em algum lugar que não bati, ou
pode ser que hoje o treino seja só "marcar concluído" de uma vez
(`treino_concluido` com `duracaoSeg`/`volume` agregados, sem granularidade
de série). Antes de tocar no Bloco 2, preciso confirmar isso — é a diferença
entre "consertar um timer existente" e "construir uma tela de execução de
treino que não existe".

## 5. Plano de migração de schema (aditivo, versionado)

- `SCHEMA_VERSION` de `storage.js` sobe de `1` para `2`.
- Novos campos em `rehab_dose.payload`: `modo` ("completo"|"essencial",
  default "completo" pra eventos antigos), `horaLocal`, `foraDaJanela`
  (default `false` pra eventos antigos — não reclassifica o passado).
- Novos campos em `treino_concluido.payload`: `ordemExecucao[]`,
  `substituicoes[]` (default `[]`).
- Novo tipo de evento: `pr` (payload: `{exercicio, tipo: peso|reps|e1rm|volume, valor}`).
- Novo campo em `state`: `planoSeEntao` (objeto, não eventos).
- Migração em `eventos.js`: função nova `migrarSchemaV2(state)`, mesmo
  padrão de `migrarParaEventos` — idempotente, guardada por flag
  (`schemaV2Migrado`), só adiciona defaults, nunca remove campo.
- Teste de regressão antes de qualquer commit: importar
  `backups/treino-eventos-2026-10-27.json`, confirmar 57 eventos carregados
  e os 10 relatórios renderizando sem erro.

## 6. O que eu preciso de você antes de ir pro Bloco 1

1. Confirmar se a divergência de contagem (57 vs 53) muda algo pra você ou
   é só o número que eu já ia recalcular mesmo.
2. Dar liberação pra eu seguir pro Bloco 1 (aderência) como próximo passo,
   conforme a ordem do prompt.

(Item resolvido nesta auditoria: a tela de treino já existe —
`WorkoutScreen.jsx` + `Timers.jsx`, ver seção 4. Bloco 2 é ajuste em código
existente.)

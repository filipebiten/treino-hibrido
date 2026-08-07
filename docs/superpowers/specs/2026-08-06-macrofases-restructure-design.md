# Design — Reestruturação para Macrofases 0-4

Data: 2026-08-06
Repo: treino-hibrido
Fonte de verdade do plano: `../app-treino-corrida.md` (CLAUDE.md do projeto), seções 4, 6, 7, 8

## Contexto

App hoje roda um plano linear de 30 semanas (corrida meia-maratona) que ficou obsoleto em 04/08/2026: fascite piorou, cirurgia de septoplastia marcada pra 11/08/2026, meia maratona adiada pra 2027. O doc do projeto já define o plano novo: 5 macrofases com datas de calendário fixas (04/08 a 28/12/2026), cada uma com conteúdo de reabilitação/musculação/corrida próprio.

Este é o primeiro de vários sub-projetos (ver seção 9 do doc): é o **PRIORITÁRIO**, porque o app hoje mostra estado (semana 2, Musculação B) que não corresponde a nada do plano real, e a cirurgia é em 5 dias.

Sub-projetos seguintes (specs separadas, depois desta): tracking de dor matinal, peso por exercício, histórico de treinos, modo offline.

## Decisão de arquitetura herdada

Mantém tudo em `src/App.jsx` (decisão de design nº1 do doc — edição via GitHub web quando não usa Claude Code). Este trabalho só adiciona/troca dados e funções dentro do arquivo único, não cria componentes em arquivos separados.

## Modelo de dados

### Datas das macrofases (constante, calendário real)

```js
const MACRO_PHASES = [
  { id: 0, nome: "Pré-operatório", inicio: "2026-08-04", fim: "2026-08-10", semanas: [
    { inicio: "2026-08-04", fim: "2026-08-10" } ]},
  { id: 1, nome: "Pós-operatório + Rehab", inicio: "2026-08-11", fim: "2026-09-07", semanas: [
    { inicio: "2026-08-11", fim: "2026-08-17" },
    { inicio: "2026-08-18", fim: "2026-08-24" },
    { inicio: "2026-08-25", fim: "2026-08-31" },
    { inicio: "2026-09-01", fim: "2026-09-07" } ]},
  { id: 2, nome: "Retorno à Força", inicio: "2026-09-08", fim: "2026-10-05", semanas: [
    { inicio: "2026-09-08", fim: "2026-09-14" },
    { inicio: "2026-09-15", fim: "2026-09-21" },
    { inicio: "2026-09-22", fim: "2026-09-28" },
    { inicio: "2026-09-29", fim: "2026-10-05" } ]},
  { id: 3, nome: "Retorno à Corrida", inicio: "2026-10-06", fim: "2026-11-02", semanas: [
    { inicio: "2026-10-06", fim: "2026-10-12" },
    { inicio: "2026-10-13", fim: "2026-10-19" },
    { inicio: "2026-10-20", fim: "2026-10-26" },
    { inicio: "2026-10-27", fim: "2026-11-02" } ]},
  { id: 4, nome: "Construção", inicio: "2026-11-03", fim: "2026-12-28", semanas: [
    { inicio: "2026-11-03", fim: "2026-11-09" },
    { inicio: "2026-11-10", fim: "2026-11-16" },
    { inicio: "2026-11-17", fim: "2026-11-23" },
    { inicio: "2026-11-24", fim: "2026-11-30" },
    { inicio: "2026-12-01", fim: "2026-12-07" },
    { inicio: "2026-12-08", fim: "2026-12-14" },
    { inicio: "2026-12-15", fim: "2026-12-21" },
    { inicio: "2026-12-22", fim: "2026-12-28" } ]},
];
```

Datas transcritas literalmente da seção 6 do doc — sem ambiguidade, sem cálculo derivado (evita erro de off-by-one em "4 semanas a partir de tal data").

### Função pura de resolução

```js
function getMacrofase(date) {
  // varre MACRO_PHASES, acha a macrofase cuja [inicio,fim] contém `date`
  // dentro dela, acha o índice da semana cujo [inicio,fim] contém `date`
  // retorna { macrofase, semanaIdx, diasDesdeInicioMacrofase, diasDesdeCirurgia }
  // se date < primeira macrofase.inicio → clampa na macrofase 0, semana 0
  // se date > última macrofase.fim → clampa na última macrofase, última semana
}
```

Pura, sem `localStorage`, sem `Date.now()` interno — recebe a data já resolvida, testável isolado.

### Estado / override manual

- `tp7` (localStorage) ganha campo novo: `diasOffset` (inteiro, default 0).
- "hoje efetivo" = `new Date(Date.now() + diasOffset*86400000)`.
- Substitui o slider "Semana 1-30" por um stepper "Ajustar dias: -N / +N" (mostra a data efetiva resultante). Mesma ideia de hoje (permite adiantar/atrasar visualização), só que em dias de calendário em vez de índice de semana solta.
- Sessão dentro da macrofase 2+ (Musculação A/B/C, corrida) continua avançando por conclusão (`ses` no localStorage), como já funciona — calendário só decide QUAL macrofase/semana/tabela de conteúdo vale, não a ordem das sessões.

## Conteúdo por macrofase

Todas as tabelas abaixo são transcrição direta das seções 6/7 do doc — trabalho mecânico de dados, sem decisão de design nova.

- **Macrofase 0** (`REHAB_PRE_OP`): 6 exercícios, 2x/dia (acordar + dormir), lista fixa da seção "MACROFASE 0" do doc.
- **Macrofase 1** (`REHAB_M1[0..3]`): 4 variantes semanais.
  - Semana 0: rotina base sentado/deitado (6 itens).
  - Semana 1: base + Toe Yoga + Catador de toalha + 4-vias elástico.
  - Semana 2: mantém alongamentos 2x/dia + adiciona dias alternados (seg/qua/sex) Heel Raise bilateral + equilíbrio unipodal.
  - Semana 3: dias alternados evolui pra Rathleff completo (unilateral, toalha) + equilíbrio 45s + glute bridge + clamshell.
- **Macrofase 2**: reusa `MA[0]`/`MB[0]`/`MC[0]` (Fase 1 já existe) com override de reps por semana:
  - Semanas 0-1: `sets:3, reps:15` (peso leve), sem pirâmide.
  - Semanas 2-3: `sets:4, reps:12`, pirâmide only a partir da semana 2.
  - Rehab reduzido fixo (DiGiovanni + panturrilha + bolinha + gelo, 2x/dia) + Rathleff dias alternados progressão 4x10 com mochila.
  - Testes de caminhada a partir da semana 2 (índice 0-based = "semana 3" do doc): novo tipo de conteúdo, checklist pass/fail (não timer), 3 testes (20min/30min/40min), critério "dor ≤2/10 durante e no dia seguinte". Guarda resultado no localStorage.
- **Macrofase 3**: corrida walk/run (`RUN_M3[0..3]`, tabela nova com os 4 intervalos exatos do doc) + musculação transição (semanas 0-1 = Fase 1 `4x12`, semanas 2-3 = Fase 2, ou seja passa a usar `MA[1]/MB[1]/MC[1]`) + rehab 1x/dia (acordar) + gelo pós-corrida.
- **Macrofase 4**: corrida progressiva (`RUN_M4[0..7]`, tabela nova com fartlek/tiros/longão por semana, testes 5km na semana 3 e 10km na semana 7) + musculação Fase 2 (nov) → Fase 3 (dez), ou seja novembro usa `MA[1]/MB[1]/MC[1]`, dezembro usa `MA[2]/MB[2]/MC[2]` + rehab manutenção (DiGiovanni 1x/dia + gelo pós-corrida + Rathleff 2x/semana).

## Tela Home

- Cabeçalho troca "SEMANA X/30" por: nome da macrofase + "Dia X de Y" dentro dela + data efetiva.
- Banner "o que está liberado hoje", derivado de `diasDesdeCirurgia` (tabela da seção 4: dias 1-7 repouso total, 8-15 sem esforço moderado, 16-30 musculação leve gradual, 31+ liberado). Só aparece nas macrofases 0-1 (é sobre restrição pós-cirúrgica).
- **Macrofases 0-1**: home vira checklist do dia — "Rotina Manhã" / "Rotina Noite" (+ "Carga" se dia alternado da semana 2-3), cada uma com estado feito/não-feito salvo por data no localStorage (chave nova, ex. `tp7rehab: {"2026-08-11": {manha:true, noite:false}}`). Substitui o card "Próximo treino" — não existe conceito de sessão ABC aqui.
- **Macrofases 2-4**: mantém o layout atual (grid de 6 sessões, card "próximo treino", botão iniciar), só trocando de onde vêm os dados (funções novas em vez de `bw`/`RD` antigos). Rehab reduzido aparece como banner secundário (não checklist).
- Card de teste de caminhada / teste 5km / teste 10km aparece quando a macrofase+semana é a que introduz o teste, com botão pra abrir checklist e marcar resultado.

## Tela de treino / rehab

- Reaproveita o motor existente (`RehabScreen`, tela `workout`, `CT`/`CU`/`TabataTimer`) — eles já são genéricos (recebem lista de exercícios/steps). Só troca QUAL lista é passada, conforme macrofase/semana atual.
- Checklist de teste de caminhada é tela nova e simples: nome do teste, critério de aprovação, botão "Passou" / "Não passou (dor > 2/10)", salva resultado + data.

## Edge cases

- localStorage ausente/corrompido → cai no `try/catch` já existente, usa data real, `diasOffset=0`.
- `diasOffset` levando a uma data fora de [04/08, 28/12] → clampado dentro de `getMacrofase` (retorna limite mais próximo), não quebra.
- Dia alternado (Rathleff, corrida qualidade) = paridade de `diasDesdeInicioMacrofase` — determinístico, não precisa de estado extra pra saber "hoje é dia de carga?".
- Usuário abre app num dia sem treino de carga agendado mas quer fazer mesmo assim → botão manual "Fazer Rathleff hoje" sempre visível dentro do checklist rehab (não bloqueia, só não é o padrão sugerido).

## Teste

Sem framework de teste no projeto — não adiciono um só pra isso (YAGNI). `getMacrofase` fica pura e com export nomeado (`export function getMacrofase`) ao lado do `export default function App`. Script `scripts/check-macrofase.mjs` (fora de `src/`, não entra no bundle) importa a função e roda `assert` nos casos-chave: início/fim de cada macrofase, transição entre macrofases, dia alternado, data fora do range (clamp). Roda com `node scripts/check-macrofase.mjs`.

## Fora de escopo aqui

Tracking de dor matinal, peso por exercício, histórico de treinos, modo offline, imagens/GIFs — sub-projetos separados, specs próprias depois desta.

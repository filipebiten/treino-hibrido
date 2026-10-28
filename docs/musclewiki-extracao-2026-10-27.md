# Extração MuscleWiki — matches pro núcleo sem gif (2026-10-27)

Staging pra revisão. Nada foi aplicado em `gifs.js`/`musculacao.js` ainda.

Contexto: `scripts/exercicios-sem-gif.mjs` achou 92 exercícios do app sem gif em `gifs.js`.
Desses, 92−16 = 76 são combos (BI-SET/SUPERSET/DROPSET), aquecimento/cardio genérico
(esteira, rotação, caminhada) ou exercício específico do protocolo de fascite plantar
(Short Foot, DiGiovanni, Rathleff, Toe Yoga) — não existem no MuscleWiki sob esse nome e
não valem a busca. Ficou o núcleo de 16 exercícios de musculação reais, todos achados.

Método: sitemap.xml do MuscleWiki (1985 slugs) filtrado por palavra-chave, confirmado
abrindo cada página real via browser (Cloudflare bloqueia scraping headless, só funciona
com browser de verdade).

## Matches

| Exercício no app | Match MuscleWiki (pt-br) | Nível | Vídeo (front) |
|---|---|---|---|
| Remada Pendlay | Remada Pendlay com barra (pegada pronada) | Avançado | https://musclewiki.com/api-next/videos/male-barbell-pronated-pendlay-row-front.mp4 |
| Remada T barra | Remadas T-Bar na Landmine | Iniciante | https://musclewiki.com/api-next/videos/male-Barbell-landmine-t-bar-rows-front.mp4 |
| Remada baixa cabo | Remada Sentada na Máquina | Iniciante | https://musclewiki.com/api-next/videos/male-machine-seated-cable-row-front.mp4 |
| Remada supinada | Remada Subalterna na Máquina | Iniciante | https://musclewiki.com/api-next/videos/male-Machine-machine-underhand-row-front.mp4 |
| Remada unilateral | Remada unilateral com haltere | Iniciante | https://musclewiki.com/api-next/videos/male-Dumbbells-dumbbell-single-arm-row-front.mp4 |
| Puxada aberta | Puxada na máquina *(genérico — ver nota)* | Iniciante | https://musclewiki.com/api-next/videos/male-machine-pulldown-front.mp4 |
| Peck deck invertido | Máquina de Voo Reverso | Iniciante | https://musclewiki.com/api-next/videos/male-Machine-machine-reverse-fly-front.mp4 |
| Tríceps kickback | Kickback de tríceps com haltere | Iniciante | https://musclewiki.com/api-next/videos/male-dumbbell-tricep-kickback-front.mp4 |
| Panturrilha em pé | Vitruvian Elevação de Panturrilha em Pé | Iniciante | https://musclewiki.com/api-next/videos/male-Vitruvian-standing-calf-raise-front.mp4 |
| Panturrilha sentado+pé | Vitruvian Elevação de Panturrilha Sentada *(parte "sentado")* | Iniciante | https://musclewiki.com/api-next/videos/male-Vitruvian-seated-calf-raise-front.mp4 |
| Panturrilha unilateral | Elevação de Panturrilha com uma Perna com Peso Corporal | Iniciante | https://musclewiki.com/api-next/videos/male-Bodyweight-bodyweight-single-leg-calf-raise-front.mp4 |
| Stiff halteres | Peso Morto Romeno com Halteres | Iniciante | https://musclewiki.com/api-next/videos/male-Dumbbells-dumbbell-romanian-deadlift-front.mp4 |
| Passada halteres | Afundo Caminhando | Intermediário | https://musclewiki.com/api-next/videos/male-Recovery-lunge-walking-front.mp4 |
| Leg Press pé alto+baixo | Leg press na máquina *(genérico — ver nota)* | Iniciante | https://musclewiki.com/api-next/videos/male-Machine-machine-leg-press-front.mp4 |
| Prancha abdominal | Prancha nos antebraços | Iniciante | https://musclewiki.com/api-next/videos/male-Bodyweight-forearm-plank-front.mp4 |
| Prancha lateral | Prancha lateral no antebraço | Iniciante | https://musclewiki.com/api-next/videos/male-bodyweight-elbow-side-plank-front.mp4 |

Vídeo lateral: troque `-front.mp4` por `-side.mp4` no mesmo link.

## Notas por exercício (comparação "how" atual × passos MuscleWiki)

**Remada Pendlay** — `how` atual: "Barra em T. Puxe ao peito. Espessura das costas." *(esse texto é da entrada
"Remada T barra" do app, não da Pendlay — confirme se bateu certo com o nome).* MuscleWiki: começa com anilhas
no chão, cotovelos travados, puxa até o esterno, solta a barra até ela parar — pausa completa entre reps é o
ponto chave da Pendlay (diferencia de remada curvada comum). Sugestão: enriquecer `how` com "solte a barra no
chão entre cada rep, cotovelos travados antes de puxar".

**Remada T barra** — MuscleWiki usa landmine (barra em V), não máquina. Se a versão do Filipe é na máquina de
placas, o vídeo não corresponde 1:1 — existe `machine-plate-loaded-t-bar-row` como alternativa, não extraído
ainda (fica pra um segundo lote se quiser).

**Puxada aberta** — MuscleWiki não tem variação "pegada aberta" com slug próprio; a página `machine-pulldown`
usa pegada ampla como padrão de demonstração (dito no texto: "nosso vídeo de demonstração... pulldown com
pegada ampla"). Serve como está.

**Panturrilha sentado+pé** — no app é um bi-set (15 sentado + 15 em pé). Achei as duas pontas separadas
(`seated-calf-raise` e `standing-calf-raise`, essa já cobre "Panturrilha em pé"). Precisa decidir: 2 gifs
(um por metade do bi-set) ou só 1.

**Stiff halteres** — MuscleWiki chama de "Peso Morto Romeno com Halteres" (RDL), que é o nome técnico correto
pro movimento que o app descreve como "stiff" — mesmo padrão biomecânico, nomenclatura BR diverge (stiff =
joelho travado; RDL = joelho quase travado). `how` do app já está alinhado.

**Leg Press pé alto+baixo** — vídeo é do leg press padrão (pé neutro); não achei variação "pé alto" vs "pé
baixo" com slug próprio no MuscleWiki.

## Lote 2 — resto do gap (76 → 43)

Depois do núcleo de 16, fui no resto dos 76. Resultado: 72 mapeados no total (115/158),
43 ficaram sem fonte boa — documentado por quê, pra não ficar tentando de novo depois.

**10 exercícios reais novos** (achados direto por slug no sitemap):
Puxada supinada, Tríceps barra reta DROPSET (→ Puxada de Tríceps na Polia), Abdominal
c/ carga (→ Máquina para Abdominais com Placas), Tibial anterior sentado, Fibulares
elástico (→ Eversões), Tibial posterior elástico (→ Inversões Sentadas com Banda),
Along. bíceps, Along. lat, Along. costas, Along. ombro, Along. tríceps.

**22 combos/alongamentos compostos** — reaproveitam o gif do exercício-base (mesmo
padrão que o arquivo já usa pra Agachamento PIRÂMIDE/PESADO/FORÇA apontarem pro mesmo
gif): Pulldown DROPSET, Pulldown invertido DROPSET, Puxada leve, Crossover DROPSET,
Extensora DROPSET, Extensora+Flexora BI-SET, Lateral DROPSET, Lateral+Frontal BI-SET,
Concentrada+Martelo BI-SET, Martelo+Concentrado SUPERSET, Corda+Barra SUPERSET,
Encolhimento+Peck inv BI-SET, Pullover+Pulldown SUPERSET, Rosca 21s,
Abdutora+Panturrilha BI-SET, Along. adutores+panturrilha, Along. costas+lat,
Along. glúteo+adutores, Along. ombro+bíceps, Along. panturrilha (joelho reto+dobrado),
Along. posterior+glúteo, Along. tríceps+ombro.

**Tentei e não achei match real** (busquei no sitemap, não existe equivalente):
Bombas de tornozelo (só achei "ankle-circle", movimento diferente — rejeitei por ser
reabilitação, prefiro sem gif a gif errado), Alongamento com toalha (panturrilha) (só
achei variação com caixa, não toalha).

**Decidido não buscar** (sem valor em forçar match):
- Combos mistos sem exercício-base único: Abdominal Tabata, Abdominal infra+Roda,
  Fly+Flexão SUPERSET, Circuito Core
- Aquecimento/cardio/mobilidade genérico (23 itens): Esteira/bike, Caminhada*,
  Corrida Z2, Fartlek, Tempo Run Z3, Tiro, Volta à calma, Recuperação, Respiração
  profunda, Rotação* (6 variantes), Saltitos/Saltos leves, Flexão leve, Elevação
  joelhos, Equilíbrio unipodal, Aquec. punhos, Balanço pernas, Aquecimento: Caminhada
- Protocolo de fascite plantar — específico de fisioterapia, não é exercício de
  catálogo fitness: 4-vias tornozelo c/ elástico, Alongamento DiGiovanni (fáscia),
  Along. fáscia plantar (×2), Bolinha de tênis na sola, Catador de toalha, Equilíbrio
  unilateral c/ Short Foot, Gelo nos pés, Heel Raise Rathleff (PROTOCOLO PRINCIPAL),
  Massagem bolinha, Short Foot (encurtamento do pé), Toe Yoga (piano com os dedos)

Resultado final: **115/158 exercícios com gif/vídeo** (antes do lote 1 eram 66).

## Pendências / não extraído

- `machine-plate-loaded-t-bar-row` (variação máquina da Remada T) — alternativa pro ALT_* se quiser.
- Alongamentos (`Along. *`, 13 itens) — MuscleWiki tem categoria "Alongamentos" própria, não extraído nesse lote.
- Biblioteca de alternativas (ALT_*) maior — não iniciado. Próximo passo natural: pra cada padrão
  (`squat`, `hip hinge`, `knee extension`, `knee flexion`, `single-leg`, `calf raise`) buscar 2-3 exercícios
  adicionais no MuscleWiki por categoria de músculo (mesma técnica do sitemap).

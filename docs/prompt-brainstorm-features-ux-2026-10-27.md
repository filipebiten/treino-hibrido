# Prompt pra colar no claude.ai (planejamento — features novas e UX)

---

Quero que você me ajude a brainstormar **features novas** e **melhorias de UX** pro meu app pessoal de treino/reabilitação. Não quero que você escreva código — isso eu faço depois com Claude Code. Quero ideias, com prioridade e trade-off.

## O que é o app

App web (PWA, React 19 + Vite, sem backend — tudo local via localStorage/IndexedDB) que eu uso sozinho pra:
1. **Reabilitação de fascite plantar** pós-lesão — protocolo baseado em papers (Rathleff 2015 heel raise excêntrico, DiGiovanni alongamento específico, McKeon Short Foot, JOSPT 2023).
2. **Musculação** — programa ABC periodizado em 4 fases (adaptação → hipertrofia → força → potência), com progressão de carga.
3. **Corrida** — plano de 15 semanas (volta pós-lesão), com controle de carga/ACWR pra não reincidir na fascite.

Tudo escrito à mão pra mim especificamente (não é app genérico de fitness) — sets/reps/kg/progressão calibrados pro meu caso.

## Timeline (pra você entender onde estou)

- Cirurgia/lesão no pé (fascite plantar), app criado pra guiar a volta.
- Plano atual: 21/09 a 03/01, dividido em macrofases.
- App está em uso diário desde então, bem maduro (~35 commits de feature, não é prototipo).

## O que já existe (não sugira reconstruir isso — sugira o que falta)

**Core do treino:**
- Tela de treino com timer, contagem de série, registro de carga (kg), steppers +/- (2,5kg membro superior, 5kg inferior)
- Troca de exercício em tempo real por alternativa pré-curada (ex: agachamento → leg press se dor no pé)
- PR automático (detecta quando bate recorde de carga)
- Navegação livre entre exercícios do treino (não precisa ser sequencial)
- GIF/vídeo de execução por exercício (82 de 158 exercícios cobertos — gifdotreino.com + MuscleWiki)
- Wake Lock (tela não apaga durante o treino) + timer sobrevive app em segundo plano

**Reabilitação:**
- Rotina fascite roteada por macrofase/fase da semana (2x/dia no início → 1x/dia manutenção)
- Reforço automático pra 3x/dia quando dor reportada é alta (≥5)
- Gate de progressão pelo critério de Silbernagel (2007) — não libera avançar de fase sem critério objetivo batido
- Edição manual de duração de rehab e distância/tempo de corrida (pros dias que não seguiu o padrão)

**Histórico e BI:**
- Log de eventos append-only (toda sessão registrada, nunca sobrescrita)
- Calendário + linha do tempo + heatmap de atividade
- Registro retroativo (esqueceu de logar, loga depois)
- 10 relatórios: aderência ao rehab, aderência Rathleff, dor ao longo do tempo, dor×aderência, dor por tipo de treino, ACWR (acute:chronic workload ratio) descritivo com sugestão de deload, progressão de carga + detecção de exercício estagnado, volume por grupo muscular, volume de corrida, sRPE de corrida, peso corporal
- Export de eventos em JSON/CSV

**Adesão/comportamento:**
- Plano "se-então" (gatilho de implementação) pra aumentar aderência
- Lembretes
- Dose parcial (registra quando fez só parte do protocolo, não é tudo-ou-nada)

**Infra:**
- PWA instalável (ícone maskable Android, splash screens iOS)
- CSP configurado
- Acessibilidade: contraste, semântica, zona do polegar revisados (audit UX já rodado uma vez)

## O que eu quero que você sugira

1. **Features que ainda fazem sentido** dado que o core (treino+rehab+histórico+BI) já está completo — o que normalmente um app assim ainda não tem que eu não pensei?
2. **Melhorias de UX** especificamente pensando em: uso durante o treino (uma mão, suado, sem querer ficar catando botão), uso pós-lesão (ansiedade com recaída — como o app podia ajudar a reduzir isso sem virar enfadonho), e adesão de longo prazo (o que faz esse tipo de app ser abandonado depois de 2-3 meses, e como evitar).
3. Se puder, separe em: **quick win** (baixo esforço, alto valor), **feature grande** (vale planejar fase própria), e **ideia especulativa** (pode não valer a pena, mas quero saber que existe).

Não preciso de código nem de plano de implementação agora — só ideias com prioridade e o porquê.

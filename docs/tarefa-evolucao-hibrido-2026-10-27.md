# TAREFA: Evolução do app Treino Híbrido — carga plantar, longo prazo e fidelidade ao método híbrido

> Gerado pelo claude.ai (chat de planejamento) em 27/10/2026, a partir do brainstorm de
> features/UX. **Não executado ainda** — o passo 0 abaixo pede pra parar e aguardar
> liberação antes de qualquer mudança de schema. Colar isso numa sessão nova do Claude
> Code quando for a hora de tocar o trabalho.

Repositório: filipebiten/treino-hibrido
Local: ~/Desktop/Documentos/claude_code/app treino/treino-hibrido
No ar: https://filipebiten.github.io/treino-hibrido/

Leia o CLAUDE.md e a skill `treino-hibrido` antes de qualquer coisa.
Hoje é 27/10/2026. Macrofase 1, semana 6 do plano iniciado em 21/09.

O core já está maduro (~35 commits de feature): timer, séries, carga, PR,
troca de exercício, GIFs (82/158), Wake Lock, rotina de fascite por
macrofase, gate de Silbernagel, log append-only, 10 relatórios, heatmap,
export, plano se-então, dose parcial, PWA instalável.
NÃO reconstrua nada disso. Esta tarefa adiciona o que falta.

═══════════════════════════════════════════════════════════
REGRA ZERO — PRESERVAÇÃO TOTAL DE DADOS
═══════════════════════════════════════════════════════════

Nenhum evento, relatório ou registro histórico pode ser perdido. O log é o
ativo mais valioso do projeto.

1. ANTES de qualquer mudança de schema: backup completo (JSON) em
   `backups/`, com data no nome.
2. Migração sempre ADITIVA. Campos novos com default. Nada removido ou
   renomeado sem camada de compatibilidade.
3. Migração idempotente e versionada (`schemaVersion`).
4. Eventos antigos sem os campos novos continuam legíveis, com tratamento
   explícito de ausência — nunca descartados.
5. Os 10 relatórios existentes continuam funcionando.
6. Teste de regressão antes do commit: importar backup, conferir eventos e
   todos os relatórios renderizando.

═══════════════════════════════════════════════════════════
FUNDAMENTO — O MÉTODO HÍBRIDO É O DNA DO APP
═══════════════════════════════════════════════════════════

O app nasceu do método Time Híbrido (Victor Pareto), cujo material está no
projeto do usuário. A premissa não é "corrida com musculação de apoio": é
que as duas modalidades se COMPLETAM. A musculação prepara o corpo para o
impacto da corrida; a corrida dá condicionamento e composição corporal.
Nenhuma feature nova pode subordinar uma à outra.

Regras do método que o app deve implementar explicitamente:

R1. Leg day é dia ISOLADO. Sem corrida no mesmo dia.
R2. No dia seguinte ao leg day, a corrida é REGENERATIVA (muito leve) —
    serve como recuperação ativa, acelera a regeneração e reduz dor
    muscular. O app deve agendar isso automaticamente e nunca colocar
    treino intenso de corrida no dia seguinte a pernas.
R3. Corrida e musculação no mesmo dia: idealmente em períodos diferentes.
    Se forem no mesmo período, o treino PRIORITÁRIO vem primeiro. O app
    deve ter um campo de prioridade da temporada (corrida ou musculação) e
    ordenar a sessão com base nele.
R4. A maioria dos treinos de corrida é LEVE. O erro de quem vem da
    musculação é tratar todo treino como tentativa de recorde. O app deve
    exibir a distribuição semanal de intensidade e avisar quando a
    proporção de treinos intensos estiver alta demais.
R5. Base aeróbica antes de intensidade. Na avaliação de 05/01/2026 o score
    de corrida era 3/21 contra 18/28 de musculação — o usuário é forte e
    sem base. Prioridade é volume leve, não velocidade.

═══════════════════════════════════════════════════════════
BLOCO 1 — A VARIÁVEL QUE FALTA: CARGA PLANTAR REAL
═══════════════════════════════════════════════════════════

Diagnóstico: o app mede a carga do TREINO e ignora a maior fonte de carga
sobre a fáscia. O usuário é pastor — prega em pé, 5 cultos por fim de
semana, além de aulas. Um treino dura 55 minutos; um domingo dele são ~8
horas em pé em piso duro.
Consequência: o relatório "dor por tipo de treino" correlaciona a variável
MENOR e atribui a ela efeito que vem provavelmente da outra.

1.1 Registro de carga de pé
Junto ao check-in de dor matinal, 3 botões GRANDES (não slider):
  leve (maior parte sentado) / normal / muito tempo em pé
Evento: `carga_pe` { nivel, data }

1.2 Passos semanais (versão magra, deliberadamente)
Campo semanal para a média de passos/dia que o app Saúde do iPhone exibe.
NÃO implementar parsing do export XML do Apple Saúde — arquivo enorme,
processamento pesado no navegador, retorno baixo. A entrada manual entrega
~80% do valor com 5% do esforço.

1.3 Relatório: dor × carga de pé
Dor matinal média por nível de carga do dia anterior, e por dia da semana.
Hipótese a testar: segunda-feira tem dor acima da média.
Mínimo de 4 semanas. Abaixo disso, "dados insuficientes" com contagem
regressiva. NÃO exibir correlação com amostra pequena.

1.4 Rastreio de calçado
Pares de tênis com km e horas acumuladas. Alerta aos 600km.
Pé plano pronador com amortecimento morto é fator de recidiva.
Se houver apenas um par cadastrado, a feature fica oculta.

═══════════════════════════════════════════════════════════
BLOCO 2 — ANSIEDADE DE RECAÍDA E ABANDONO
═══════════════════════════════════════════════════════════

2.1 "Isso já aconteceu antes"
Quando a dor sobe acima da linha de base, card comparando com o histórico
do próprio usuário: "Você registrou 4/10 em 3 ocasiões. A dor voltou a ≤2
em média em 4 dias."
Travar até existirem 8+ semanas de histórico — antes disso o número mente.
Objetivo: impedir a parada por precaução, que é o que quebra o hábito.

2.2 Regra de produto: o app NUNCA abre em tela de déficit
A home abre no que fazer AGORA. Retrospecto e aderência em aba separada.
Este é o motivo nº1 de abandono: o app vira juiz e abrir passa a ser
desconfortável.

2.3 Dose parcial no momento da decisão
"Fiz só o mínimo" aparece na MESMA tela onde o usuário decide desistir —
nunca escondida em menu.

2.4 Projeção de gate
"No ritmo atual, entrada em M2 em ~12 dias." Tendência REAL, nunca a ideal.

2.5 Semana declarada
Toda segunda, uma pergunta: "essa semana é normal ou apertada?"
Se apertada, converte para MODO MANUTENÇÃO antes do fracasso: só rehab +
1 treino, sem gerar déficit no relatório.
Permitir marcar semanas futuras (eventos, retiros, viagens).
Superior a realinhar depois: remove a culpa — não é falha, é plano.

2.6 Backup automático
Lembrete mensal + `navigator.share({ files: [...] })` com fallback
`<a download>`. localStorage sem backend está a uma limpeza de Safari de
perder tudo.

2.7 Nota livre por sessão
Uma linha, opcional, exibida junto do dia no histórico. Explica outliers.

═══════════════════════════════════════════════════════════
BLOCO 3 — AGENDAMENTO HÍBRIDO INTELIGENTE (novo, vem do método)
═══════════════════════════════════════════════════════════

3.1 Motor de regras de agendamento
Implementar as regras R1 a R4 como validação ativa do calendário semanal:
  - Leg day sem corrida no mesmo dia (bloqueio)
  - Dia seguinte a leg day → corrida regenerativa automática (sugestão
    forte, sobrescrevível)
  - Dois treinos no mesmo dia → exibir qual vem primeiro, conforme a
    prioridade da temporada
  - Aviso quando mais de ~20% dos treinos de corrida da semana forem
    intensos
Quando o usuário violar uma regra, explicar o porquê em uma linha — não só
bloquear.

3.2 Campo de prioridade da temporada
"Esta temporada prioriza: corrida | musculação | equilíbrio"
Afeta a ordem sugerida dos treinos no dia e a alocação de volume.
NUNCA zera a outra modalidade — o método é híbrido, não periodização de
corredor puro.

3.3 Distribuição de intensidade
Relatório semanal: proporção de treinos leves vs moderados vs intensos,
em corrida e musculação. Base aeróbica exige predominância de leve.

═══════════════════════════════════════════════════════════
BLOCO 4 — CORRIDA: DE PLANO FIXO A ESTRUTURA PLURIANUAL
═══════════════════════════════════════════════════════════

O app hoje termina em 03/01/2027. Precisa virar estrutura de temporadas.
Objetivo declarado: maratona.

Caminho definido (não encurtar):
  Dez/2026 — 10km — pico ~20km/semana — híbrido pleno
  2027     — meia maratona — pico ~45km/semana — híbrido pleno
  2028     — maratona — pico ~70km/semana — musculação cede volume
Pular a meia em 2027 é o erro clássico: o volume triplica da meia para a
maratona, e é volume, não velocidade, que inflama fáscia.
Perfil de risco: pé plano pronador, fascite com recidiva, 87kg/172cm.

IMPORTANTE: até a meia (2027), musculação e corrida progridem JUNTAS,
conforme o método. Só na temporada de maratona (2028) a musculação reduz
para 2x/semana de manutenção — e isso deve estar documentado como exceção
justificada por tempo de recuperação, não como regra geral do app.

4.1 Estrutura de temporadas
Modelo: Temporada → Macrofase → Semana. Cada temporada com prova-alvo,
data, distância, volume de pico e prioridade. Fases: base → build → pico →
taper → recuperação. Suportar temporada sem prova (manutenção).

4.2 Teste de recalibração periódica
A cada 6-8 semanas: teste de campo (1km, 3km ou Cooper 12min).
Recalcular ritmos de treino por zona a partir do resultado.
Riegel para projeção: T2 = T1 × (D2/D1)^1.06
Exibir com ressalva: Riegel superestima em distâncias longas para quem não
tem base de volume. Não é promessa.

4.3 Ritmos por zona
Hoje o app usa só FC. Adicionar zonas de RITMO derivadas do teste: fácil /
moderado / limiar / intervalado / longão / REGENERATIVO.
Exibir ritmo-alvo em cada treino de corrida, não só FC. Em rua a FC atrasa
e sofre com calor; ritmo é mais acionável.

4.4 Ajuste de ritmo por calor (Campo Grande)
Verão de 34°C+ com umidade alta muda o ritmo em 20-40s/km.
Campos de temperatura e umidade no registro + ajuste sugerido.
Regra prática: a partir de 20°C, +2% de tempo a cada 5°C, com agravante
por umidade acima de 60%.
Sem API de clima (dependência externa proibida) — entrada manual com o
último valor pré-preenchido.

4.5 Registro de corrida mais rico
Distância, tempo, ritmo médio (calculado), FC média, PSE (0-10),
temperatura, umidade, superfície (asfalto/esteira/terra), tênis.
Superfície importa: esteira e terra reduzem carga plantar — o app deve
sugerir isso durante pico de dor.

4.6 Progressão de volume
Volume semanal não sobe mais de 10% sobre a média de 4 semanas.
A cada 4 semanas, semana de recuperação a ~60%.
Avisar quando o plano violar a regra E quando estiver abaixo do necessário
para a meta da temporada.

4.7 Cadência
Campo opcional (passos/min). Cadência abaixo de ~165 com passada longa
aumenta impacto. Para pé plano com fascite, subir cadência 5% é das
intervenções de maior retorno. Sugerir só com 3+ registros.

4.8 Calendário de provas
Provas-alvo com data, contagem regressiva, posicionamento do taper, marcação
no histórico como carga máxima.

═══════════════════════════════════════════════════════════
BLOCO 5 — FORÇA ESPECÍFICA, INTEGRADA AO ABC
═══════════════════════════════════════════════════════════

O ABC atual é musculação geral e DEVE continuar existindo — é metade do
método. O que falta é força específica que protege o pé, integrada ao ABC,
não substituindo-o.

5.1 Bloco de força protetiva (acoplado ao ABC, não paralelo)
Adicionar ao treino B (pernas) e a um segundo dia:
  - Panturrilha: heel raise joelho reto E dobrado separadamente. O sóleo
    absorve 6-8× o peso corporal na corrida e é o mais negligenciado.
  - Glúteo médio: abdução, monster walk, step-down lateral. Fraqueza aqui
    aumenta pronação, que aumenta carga na fáscia.
  - Isquiotibiais: nórdico progressivo, stiff unilateral.
  - Core antirrotação: prancha lateral, pallof press, bird-dog.
  - Pliometria PROGRESSIVA e tardia: só entra quando a dor matinal estiver
    na linha de base por 4 semanas consecutivas. Saltos e corda são carga
    plantar alta — bloquear por gate, igual à corrida.

5.2 Teste funcional mensal
Heel raise unilateral até a falha. Repetições por pé.
Medida padrão de capacidade do tríceps sural.
Dois ganhos: evidência objetiva de melhora e um número que SOBE — o único
feedback que sustenta motivação quando a dor oscila.
Agendar longe de leg day. Bloquear em semana com dor acima da base.
Relatório: evolução + assimetria entre pés (meta: diferença <10%).

═══════════════════════════════════════════════════════════
BLOCO 6 — O "DEPOIS"
═══════════════════════════════════════════════════════════

6.1 Protocolo de manutenção vitalício
O plano acaba em 03/01/2027. Fascite recidiva, e a recaída clássica é
quando a pessoa melhora e para o protocolo.
Modo manutenção permanente:
  - Rathleff 2x/semana, indefinidamente
  - Check-in de dor semanal (não diário)
  - Reativação AUTOMÁTICA do protocolo intensivo se a dor ficar acima da
    linha de base por 3 dias
É a feature que decide se ele estará correndo em 2028.

6.2 Relatório de uma página para consulta médica
HTML/PDF imprimível: curva de dor, aderência, carga, marcos do teste
funcional, linha do tempo da lesão. CSV não serve em consultório.

═══════════════════════════════════════════════════════════
O QUE NÃO FAZER
═══════════════════════════════════════════════════════════

- NÃO transformar o app em plano de corredor puro. Musculação e corrida são
  pilares iguais até 2028. Qualquer feature que subordine uma à outra
  contraria o método que originou o projeto.
- NÃO implementar regressão estatística dor ~ carga. Com n pequeno e
  variáveis confundidas, gera correlação espúria e decisão clínica baseada
  em ruído. Dispersão SEM linha de tendência é mais honesto.
- NÃO fazer parsing do export XML do Apple Saúde.
- NÃO integrar API de clima, Strava, Darebee, MuscleWiki ou qualquer fonte
  externa. Sem dependência nova. React puro.
- NÃO criar streak que zere, badge de culpa ou alarme por dia perdido.
  Lally (2010): perder um dia não afeta a formação do hábito.
- NÃO usar ACWR como alerta de risco (Impellizzeri 2020). Gráfico de
  tendência descritivo apenas.
- NÃO apagar, renomear ou descartar evento algum do log.

═══════════════════════════════════════════════════════════
ORDEM DE EXECUÇÃO
═══════════════════════════════════════════════════════════

0. Backup completo + auditoria + plano de migração de schema + proposta de
   modelo de dados para temporadas. PARE e me mostre. Aguarde liberação.
1. Bloco 1 (carga plantar) — a variável que falta nos relatórios
2. Bloco 2 (ansiedade e abandono) — barato e decisivo
3. Bloco 6 (manutenção) — garante que o app sobreviva a janeiro
4. Bloco 3 (agendamento híbrido) — resgata as regras do método
5. Bloco 4 (temporadas e corrida)
6. Bloco 5 (força protetiva)
7. Regressão + `npm run build` + commit + push

Commits pequenos, um por item. Backup novo após cada bloco.

═══════════════════════════════════════════════════════════
AO FINAL
═══════════════════════════════════════════════════════════

Atualize o CLAUDE.md e a skill `treino-hibrido` com:
- As regras R1-R5 do método híbrido como fundamento do agendamento
- Modelo de temporadas e o roteiro 10km/2026 → meia/2027 → maratona/2028,
  com o motivo de não encurtar e a exceção de 2028
- Novos eventos: carga_pe, teste_funcional, prova, tenis, passos_semana
- Modo manutenção e reativação automática
- Ajuste por calor, regra dos 10%, gates de pliometria e corrida

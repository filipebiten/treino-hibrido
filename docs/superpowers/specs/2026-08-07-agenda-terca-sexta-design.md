# Agenda Terça-Sexta + Ponteiro de Dia com Carryover — Design

## Contexto

App já tem motor de calendário real (`getMacrofase`, `hojeEfetivo`) e Home dirigida por macrofase (checklist Manhã/Noite/Carga, banner de restrição pós-op, fallback pra macrofase 2+) — implementado no plano `2026-08-06-macrofases-0-1-implementation.md`.

Uso real revelou 3 problemas:
1. O protocolo assumia rehab **todo dia**, mas o usuário só treina **terça a sexta**.
2. O usuário está **pausado agora** e só quer começar tudo em **2026-08-12** (quarta-feira, primeiro dia útil pós-operatório completo — cirurgia é 11/08, terça).
3. Se ele não abre o app ou não termina um dia, quer que aquele dia **continue aparecendo** até fechar (checkbox por checkbox) ou apertar um botão explícito "Dia finalizado" — não quer que o calendário real simplesmente pule pro dia seguinte e "esqueça" o que ficou pendente.
4. A Home mostra só o nome da rotina (ex: "Rotina Manhã"), sem listar os exercícios — precisa abrir a tela de execução pra saber o que tem dentro. Ele quer ver a lista completa direto na Home.

## Decisão de arquitetura

Duas datas coexistem, com papéis diferentes:

- **Data real** (`hojeEfetivo(Date.now(), diasOffset)`, motor existente) — continua sendo a única fonte pra `getMacrofase` (macrofase/semana/banner de restrição). A cicatrização do pé não pausa se o usuário atrasa o checklist.
- **`chaveDiaBase`** (novo, persistido) — ponteiro pro "dia de checklist" que o usuário está trabalhando. Só muda em dois eventos: inicialização (primeira vez que a data real alcança `INICIO_TREINO`) e o botão "Dia finalizado" (avanço forçado).

A cada render, deriva-se um **dia efetivo** a partir de `chaveDiaBase`, andando pra frente automaticamente enquanto os dias percorridos estiverem 100% completos, até o teto (o dia ativo real mais recente). Trava no primeiro dia incompleto — é isso que implementa o carryover sem precisar de nenhum efeito/gravação automática: é uma função pura de `(chaveDiaBase, rehabLog, hojeReal)`.

## Componentes

### 1. Portão de início e dias ativos

```js
const INICIO_TREINO = "2026-08-12";
function isDiaAtivo(iso){ const dw=new Date(iso+"T00:00:00").getDay(); return dw>=2&&dw<=5; } // terça(2)…sexta(5)
function proximoDiaAtivo(iso){ let d=new Date(iso+"T00:00:00"); do{ d=new Date(d.getTime()+86400000); }while(!isDiaAtivo(toISO(d))); return toISO(d); }
function ultimoDiaAtivoAte(iso){ let d=iso; while(!isDiaAtivo(d)){ d=toISO(new Date(new Date(d+"T00:00:00").getTime()-86400000)); } return d; }
```

Antes de `hojeReal >= INICIO_TREINO`: Home mostra tela "Pausado até 12/08" — sem checklist, sem cobrança, nem o protocolo pré-operatório (que hoje roda diário) aparece. Reaproveita o estilo visual da tela de fallback macrofase 2+ já existente (🚧-like, mas com mensagem de pausa).

### 2. Ponteiro de dia + carryover

```js
function diaCompleto(iso, rehabLog){
  const mf=getMacrofase(new Date(iso+"T00:00:00"));
  const rotinas=getRehabForMacrofase(mf.macrofase, mf.semanaIdx, mf.diaAlternado);
  const precisaCarga = rotinas.length>1;
  const log=rehabLog[iso]||{};
  return !!log.manha && !!log.noite && (!precisaCarga || !!log.carga);
}

function computeChaveDiaEfetivo(chaveDiaBase, rehabLog, hojeReal){
  if(!chaveDiaBase) return null;
  const teto=ultimoDiaAtivoAte(hojeReal);
  let d=chaveDiaBase;
  while(d<teto && diaCompleto(d,rehabLog)){ d=proximoDiaAtivo(d); }
  return d;
}
```

- **Caso feliz** (usuário completa tudo, todo dia útil): `chaveDiaEfetivo` sempre igual ao dia ativo mais recente — comportamento idêntico ao que já existia.
- **Caso incompleto**: trava no primeiro dia não fechado. Esse MESMO dia (mesma data, mesmo `rehabLog[iso]`) continua sendo mostrado nos próximos renders/sessões, mesmo que dias reais tenham passado — isso é o carryover. Exercícios não duplicam nem se acumulam numa lista crescente; é sempre "o dia que você deve fechar agora".
- **Botão "Dia finalizado"**: `chaveDiaBase = proximoDiaAtivo(chaveDiaEfetivo)` — persistido em `localStorage`, força avançar mesmo com itens pendentes (o registro histórico do dia anterior fica como estava, só marcado como "pulado" implicitamente por não ter os 3 checks).

Estado novo em `App`: `chaveDiaBase` (string ISO | null), carregado/salvo em `localStorage` (nova chave `tp7dia`, shape `{b:"2026-08-12"}`).

### 3. Estados da Home (a partir de `INICIO_TREINO`)

| Condição | Tela |
|---|---|
| `hojeReal < INICIO_TREINO` | Pausado até 12/08 |
| `!diaCompleto(chaveDiaEfetivo)` | Checklist do `chaveDiaEfetivo` (rótulo mostra a data dele; se for diferente de hoje, aviso "atrasado desde X") |
| `diaCompleto(chaveDiaEfetivo)` && dia real de hoje não é ativo (Sáb/Dom/Seg) | "Dia de descanso" |
| `diaCompleto(chaveDiaEfetivo)` && dia real de hoje é ativo && `chaveDiaEfetivo === hojeAtivo` | Checklist normal de hoje (tudo zerado, começa do zero) — cai naturalmente no mesmo ramo do item 2 já que `diaCompleto` fica falso assim que o dia novo começa sem nada marcado |

Ou seja, na prática só 3 telas: Pausado / Checklist (hoje ou atrasado) / Descanso.

### 4. Lista de exercícios direto na Home

Cada card de dose (Manhã/Noite/Carga) ganha, abaixo do título, uma lista compacta com `rotina.exercises.map(e=>e.name)` (texto pequeno, cinza, separado por "·" ou em lista). Tocar no card continua abrindo `RehabScreen` (fluxo guiado com timer/como fazer) via `abrirDose`, sem mudança nesse fluxo.

## Fora de escopo

- Macrofase 2+ (fallback "não configurada") não ganha portão de dias ativos nem carryover nesta mudança — só relevante quando aquele plano futuro for implementado.
- Não recalcula `mfInfo`/banner de restrição a partir de `chaveDiaEfetivo` — continuam vindo da data real, por design (ver seção "Decisão de arquitetura").
- `sv()`/preview/workout continuam código morto, sem mudança (achado já registrado em `.superpowers/sdd/task-4-5-review.md`).

## Testes manuais esperados (sem framework de UI no projeto)

1. Antes de 12/08 (offset de teste): Home mostra "Pausado até 12/08".
2. Em 12/08: checklist normal aparece (chaveDiaBase inicializa).
3. Completar só "Manhã" e avançar a data de teste +1 dia (pular pro dia ativo seguinte) sem fechar: o MESMO checklist de 12/08 continua aparecendo (Noite ainda pendente), não o de 13/08.
4. Completar "Noite" também (fecha 12/08 100%): avançar +1 dia → agora mostra 13/08 zerado.
5. Deixar um dia incompleto e apertar "Dia finalizado": avança pro próximo dia ativo mesmo incompleto.
6. Avançar a data de teste pra um sábado com o dia anterior completo: mostra "Dia de descanso".
7. Cada card mostra a lista de nomes dos exercícios sem precisar abrir a rotina.

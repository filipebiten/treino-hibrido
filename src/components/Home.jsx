import { useState } from "react";
import Icon from "./Icon.jsx";
import PlanoSeEntaoCard from "./PlanoSeEntaoCard.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const cardBase = { width: "100%", color: color.text, borderRadius: radius.lg, border: "1px solid " + color.border, background: color.surface, cursor: "pointer", textAlign: "left" };

// Bloco 1 — fora do modo manutenção, a pergunta diária de dor virou parte da fila de
// perguntas (FilaPerguntasCard); aqui só mostra a confirmação depois de respondida. O
// modo manutenção (check-in semanal) ainda não foi migrado pra fila — mantém seu próprio
// grid de resposta.
function DorCard({ dorHoje, onRegistrar, modoManutencao }) {
  if (dorHoje !== undefined) {
    return (
      <div style={{ ...cardBase, padding: space.md, marginBottom: space.md, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="drop" size={16} color={color.pain} /><span style={{ fontSize: ty.sm, color: color.textDim }}>Dor {modoManutencao ? "essa semana" : "hoje"}: <b style={{ color: color.text }}>{dorHoje}/10</b></span></div>
      </div>
    );
  }
  if (!modoManutencao) return null;
  return (
    <div style={{ ...cardBase, padding: space.lg, marginBottom: space.md, border: "2px solid " + color.alert, background: color.alert + "14" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: space.sm }}>
        <Icon name="drop" size={20} color={color.alert} />
        <div style={{ fontSize: ty.lg, fontWeight: 800 }}>Dor no calcanhar essa semana?</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
        {Array.from({ length: 11 }, (_, i) => i).map(n => (
          <button key={n} onClick={() => onRegistrar(n)} style={{ minHeight: 44, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.sm, cursor: "pointer" }}>{n}</button>
        ))}
      </div>
      <div style={{ fontSize: ty.xs, color: color.textDim, textAlign: "center", marginTop: space.sm }}>0 = sem dor · 10 = pior dor possível</div>
    </div>
  );
}

const NIVEL_CARGA_PE_LABEL = { leve: "Leve (sentado maior parte)", normal: "Normal", muito: "Muito tempo em pé" };

// Bloco 1 — pergunta virou parte da fila (FilaPerguntasCard). Aqui só confirma depois.
function CargaPeCard({ cargaPeHoje }) {
  if (cargaPeHoje === undefined) return null;
  return (
    <div style={{ ...cardBase, padding: space.md, marginBottom: space.md, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="foot" size={16} color={color.textDim} /><span style={{ fontSize: ty.sm, color: color.textDim }}>Carga de pé hoje: <b style={{ color: color.text }}>{NIVEL_CARGA_PE_LABEL[cargaPeHoje]}</b></span></div>
    </div>
  );
}

function RehabCard({ doses, doseFeitaFn, onAbrirDose, cargaDisponivel, cargaFeita, cargaTitulo, cargaBloqueada, restanteRathleff }) {
  return (
    <div style={{ marginBottom: space.md }}>
      <div style={{ fontSize: ty.xs, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm, display: "flex", alignItems: "center", gap: 6 }}><Icon name="foot" size={14} />Reabilitação</div>
      {doses.map(d => {
        const feita = doseFeitaFn(d.key);
        return (
          <button key={d.key} onClick={() => onAbrirDose(d.key)} style={{ ...cardBase, minHeight: touch.min, padding: space.md, marginBottom: space.sm, border: "1px solid " + (feita ? color.success + "55" : color.alert + "77"), background: feita ? color.success + "12" : color.alert + "16", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {feita ? <Icon name="check" size={18} color={color.success} /> : <Icon name="play" size={16} color={color.alert} />}
              <span style={{ fontSize: ty.md, fontWeight: 700 }}>{d.label}</span>
            </div>
          </button>
        );
      })}
      {cargaDisponivel && (
        <button disabled={cargaBloqueada} onClick={() => !cargaBloqueada && onAbrirDose("carga")} style={{ ...cardBase, minHeight: touch.min, padding: space.md, border: "1px solid " + (cargaFeita ? color.success + "55" : cargaBloqueada ? color.border : color.pain + "77"), background: cargaFeita ? color.success + "12" : cargaBloqueada ? color.surfaceAlt : color.pain + "16", opacity: cargaBloqueada ? 0.6 : 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: ty.md, fontWeight: 700 }}>{cargaTitulo}</span>
          {cargaBloqueada ? <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ty.xs, color: color.textFaint }}><Icon name="lock" size={14} />{restanteRathleff}</div> : (cargaFeita ? <Icon name="check" size={18} color={color.success} /> : <Icon name="play" size={16} color={color.pain} />)}
        </button>
      )}
    </div>
  );
}

// Bloco 5.1 — força protetiva (opcional) e pliometria (gate de 4 semanas dor-baseline).
function ForcaProtetivaCard({ feita, onAbrir, pliometriaFeita, pliometriaLiberada, pliometriaMotivoBloqueio, onAbrirPliometria }) {
  return (
    <div style={{ marginBottom: space.md }}>
      <div style={{ fontSize: ty.xs, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm, display: "flex", alignItems: "center", gap: 6 }}><Icon name="dumbbell" size={14} />Força protetiva (opcional)</div>
      <button onClick={onAbrir} style={{ ...cardBase, minHeight: touch.min, padding: space.md, marginBottom: space.sm, border: "1px solid " + (feita ? color.success + "55" : color.border), background: feita ? color.success + "12" : color.surfaceAlt, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: ty.md, fontWeight: 700 }}>Panturrilha, glúteo, nórdico, core</span>
        {feita ? <Icon name="check" size={18} color={color.success} /> : <Icon name="play" size={16} color={color.textDim} />}
      </button>
      <button disabled={!pliometriaLiberada} onClick={() => pliometriaLiberada && onAbrirPliometria()} style={{ ...cardBase, minHeight: touch.min, padding: space.md, border: "1px solid " + (pliometriaFeita ? color.success + "55" : !pliometriaLiberada ? color.border : color.border), background: pliometriaFeita ? color.success + "12" : color.surfaceAlt, opacity: pliometriaLiberada ? 1 : 0.6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: ty.md, fontWeight: 700 }}>Pliometria leve</span>
        {!pliometriaLiberada ? <Icon name="lock" size={14} color={color.textFaint} /> : (pliometriaFeita ? <Icon name="check" size={18} color={color.success} /> : <Icon name="play" size={16} color={color.textDim} />)}
      </button>
      {!pliometriaLiberada && <div style={{ fontSize: ty.xs, color: color.textFaint, marginTop: 4 }}>{pliometriaMotivoBloqueio}</div>}
    </div>
  );
}

function NumeroInline({ onConfirmar, placeholder }) {
  const [valor, setValor] = useState("");
  return (
    <div style={{ display: "flex", gap: space.sm }}>
      <input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, minHeight: touch.min, borderRadius: radius.md, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontSize: ty.md, padding: "0 12px", textAlign: "center" }} />
      <button disabled={!valor} onClick={() => valor && onConfirmar(parseFloat(valor))}
        style={{ minHeight: touch.min, padding: "0 20px", borderRadius: radius.md, border: "none", background: valor ? color.success : color.surfaceAlt, color: valor ? "#0f1115" : color.textFaint, fontWeight: 700, cursor: valor ? "pointer" : "default" }}>OK</button>
    </div>
  );
}

// Bloco 1 — card único "Responder agora". Mostra no máximo 2 perguntas por visita à Home
// (estado local, reseta a cada montagem — cada vez que o usuário volta pra Home conta como
// uma "abertura" nova); perguntas além dessas 2 esperam a próxima. `fila` já vem filtrada
// e ordenada por prioridade (lib/perguntas.js) — aqui só decide COMO mostrar cada tipo.
function FilaPerguntasCard({ fila, tenis, onResponder, onPular }) {
  const [resolvidasNestaVisita, setResolvidasNestaVisita] = useState(0);
  if (resolvidasNestaVisita >= 2 || !fila.length) return null;
  const atual = fila[0];

  function responder(valor) { onResponder(atual.id, valor); setResolvidasNestaVisita(n => n + 1); }
  function pular() { onPular(atual.id); setResolvidasNestaVisita(n => n + 1); }

  const opcoes = atual.tipo === "opcoes-tenis" ? tenis.map(t => [t.id, t.nome]) : atual.opcoes;

  return (
    <div style={{ ...cardBase, cursor: "default", padding: space.lg, marginBottom: space.md, border: "1px solid " + color.border, background: color.surface }}>
      <div style={{ fontSize: ty.xs, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Responder agora</div>
      <div style={{ fontSize: ty.md, fontWeight: 700, marginBottom: space.md }}>{atual.pergunta}</div>

      {atual.tipo === "escala0a10" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
          {Array.from({ length: 11 }, (_, i) => i).map(n => (
            <button key={n} onClick={() => responder(n)} style={{ minHeight: 48, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.sm, cursor: "pointer" }}>{n}</button>
          ))}
        </div>
      )}

      {(atual.tipo === "opcoes" || atual.tipo === "opcoes-tenis") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {opcoes.map(([v, l]) => (
            <button key={v} onClick={() => responder(v)} style={{ minHeight: 48, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontWeight: 600, fontSize: ty.sm, cursor: "pointer", textAlign: "left", padding: "0 12px" }}>{l}</button>
          ))}
        </div>
      )}

      {atual.tipo === "numero" && <NumeroInline onConfirmar={responder} />}

      {atual.tipo === "convite" && (
        <button onClick={() => responder(true)} style={{ width: "100%", minHeight: touch.min, borderRadius: radius.md, border: "none", background: color.success, color: "#0f1115", fontWeight: 700, cursor: "pointer" }}>Abrir</button>
      )}

      <button onClick={pular} style={{ width: "100%", marginTop: space.md, background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Pular</button>
    </div>
  );
}

export default function Home({
  macrofaseNome, semanaIdx, totalSemanas, hojeISO,
  dorHoje, onRegistrarDor,
  cargaPeHoje,
  fila, tenis = [], onResponderPergunta, onPularPergunta,
  doses, doseFeitaFn, onAbrirDose, cargaDisponivel, cargaFeita, cargaTitulo, cargaBloqueada, restanteRathleff,
  forcaProtetivaFeita, onAbrirForcaProtetiva, pliometriaFeita, pliometriaLiberada, pliometriaMotivoBloqueio, onAbrirPliometria,
  proximaSessao, onIniciar, onPular,
  gateInfo,
  sessoes, onVerSessao,
  onAbrirHistorico, onAbrirRelatorios, onRecalibrar, onAbrirLembretes,
  retomar, onRetomar, onDescartarRetomar,
  planoSeEntao, onSalvarPlano, isSegunda, diasSemUso, instalarPwa,
  precisaBackup, onFazerBackup, recaida,
  semanaDeclarada, onDeclararSemana,
  modoManutencao, reativadoManutencao,
}) {
  return (
    <div style={{ background: color.bg, color: color.text, minHeight: "100vh", fontFamily: "system-ui", padding: space.xl + "px " + space.lg + "px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: space.lg }}>
        <div style={{ fontSize: ty.xs, color: color.textFaint, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Treino Híbrido</div>
        <h1 style={{ fontSize: ty.display, fontWeight: 800 }}>{macrofaseNome}</h1>
        <div style={{ fontSize: ty.xs, color: color.textFaint, marginTop: 4 }}>Semana {semanaIdx + 1}/{totalSemanas} · {hojeISO.split("-").reverse().slice(0, 2).join("/")}</div>
      </div>

      {retomar && (
        <div style={{ ...cardBase, cursor: "default", padding: space.lg, marginBottom: space.md, border: "1px solid " + color.success + "88", background: color.success + "12" }}>
          <div style={{ fontSize: ty.md, fontWeight: 800, marginBottom: 2 }}>Treino em andamento</div>
          <div style={{ fontSize: ty.sm, color: color.textDim, marginBottom: space.md }}>{retomar.label} · passo {retomar.passo}/{retomar.total}</div>
          <div style={{ display: "flex", gap: space.sm }}>
            <button onClick={onRetomar} style={{ flex: 1, minHeight: 48, borderRadius: radius.md, border: "none", background: color.success, color: color.bg, fontSize: ty.md, fontWeight: 800, cursor: "pointer" }}>Retomar</button>
            <button onClick={onDescartarRetomar} style={{ minHeight: 48, padding: "0 16px", borderRadius: radius.md, border: "1px solid " + color.border, background: "transparent", color: color.textDim, fontSize: ty.sm, cursor: "pointer" }}>Descartar</button>
          </div>
        </div>
      )}

      {diasSemUso >= 3 && (
        <div style={{ ...cardBase, cursor: "default", padding: space.lg, marginBottom: space.md, border: "1px solid " + color.success + "66", background: color.success + "0e" }}>
          <div style={{ fontSize: ty.md, fontWeight: 800, marginBottom: 2 }}>Bem-vindo de volta</div>
          <div style={{ fontSize: ty.sm, color: color.textDim }}>Vamos realinhar — sem pressa, só retomar de onde parou.</div>
        </div>
      )}

      {instalarPwa && (
        <div style={{ ...cardBase, cursor: "default", padding: space.md, marginBottom: space.md, border: "1px solid " + color.alert + "55", background: color.alert + "0e", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Icon name="flag" size={16} color={color.alert} />
          <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.5 }}>
            Instala na Tela de Início (compartilhar → "Adicionar à Tela de Início") pra não perder dados por limpeza automática do navegador e liberar tela sempre acesa durante o treino.
          </div>
        </div>
      )}

      {precisaBackup && (
        <div style={{ ...cardBase, cursor: "default", padding: space.md, marginBottom: space.md, border: "1px solid " + color.border, background: color.surface, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.5 }}>Faz um tempo sem backup — localStorage some numa limpeza do navegador.</div>
          <button onClick={onFazerBackup} style={{ minHeight: 36, padding: "0 14px", borderRadius: radius.sm, border: "none", background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.xs, cursor: "pointer", whiteSpace: "nowrap" }}>Fazer backup</button>
        </div>
      )}

      {isSegunda && !semanaDeclarada && (
        <div style={{ ...cardBase, cursor: "default", padding: space.md, marginBottom: space.md, border: "1px solid " + color.border, background: color.surface }}>
          <div style={{ fontSize: ty.sm, fontWeight: 700, marginBottom: space.sm }}>Essa semana é normal ou apertada?</div>
          <div style={{ display: "flex", gap: space.sm }}>
            <button onClick={() => onDeclararSemana("normal")} style={{ flex: 1, minHeight: 40, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.sm, cursor: "pointer" }}>Normal</button>
            <button onClick={() => onDeclararSemana("apertada")} style={{ flex: 1, minHeight: 40, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.sm, cursor: "pointer" }}>Apertada</button>
          </div>
        </div>
      )}
      {semanaDeclarada === "apertada" && (
        <div style={{ ...cardBase, cursor: "default", padding: space.md, marginBottom: space.md, border: "1px solid " + color.textFaint + "55", background: "transparent" }}>
          <div style={{ fontSize: ty.xs, color: color.textDim }}>Modo manutenção essa semana — só rehab + 1 treino contam. Não conta como falha.</div>
        </div>
      )}

      {modoManutencao && (
        <div style={{ ...cardBase, cursor: "default", padding: space.md, marginBottom: space.md, border: "1px solid " + (reativadoManutencao ? color.alert + "88" : color.textFaint + "55"), background: reativadoManutencao ? color.alert + "0e" : "transparent" }}>
          <div style={{ fontSize: ty.xs, color: reativadoManutencao ? color.alert : color.textDim, lineHeight: 1.5 }}>
            {reativadoManutencao
              ? "Dor acima do normal por 3 dias seguidos — protocolo intensivo reativado automaticamente."
              : "Modo manutenção (plano de 15 semanas concluído) — Rathleff 2x/semana, check-in de dor semanal."}
          </div>
        </div>
      )}

      <DorCard dorHoje={dorHoje} onRegistrar={onRegistrarDor} modoManutencao={modoManutencao} />

      {recaida && recaida.suficiente && recaida.elevada && recaida.vezes > 0 && (
        <div style={{ ...cardBase, cursor: "default", padding: space.md, marginBottom: space.md, border: "1px solid " + color.success + "55", background: color.success + "0e" }}>
          <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.5 }}>
            Isso já aconteceu antes — você registrou {recaida.dorHoje}/10 em {recaida.vezes} {recaida.vezes === 1 ? "ocasião" : "ocasiões"} e a dor voltou a ≤2/10 em média em {recaida.diasMediaRecuperacao} {recaida.diasMediaRecuperacao === 1 ? "dia" : "dias"}.
          </div>
        </div>
      )}

      <CargaPeCard cargaPeHoje={cargaPeHoje} />

      <RehabCard doses={doses} doseFeitaFn={doseFeitaFn} onAbrirDose={onAbrirDose} cargaDisponivel={cargaDisponivel} cargaFeita={cargaFeita} cargaTitulo={cargaTitulo} cargaBloqueada={cargaBloqueada} restanteRathleff={restanteRathleff} />
      <FilaPerguntasCard fila={fila} tenis={tenis} onResponder={onResponderPergunta} onPular={onPularPergunta} />
      <ForcaProtetivaCard feita={forcaProtetivaFeita} onAbrir={onAbrirForcaProtetiva} pliometriaFeita={pliometriaFeita} pliometriaLiberada={pliometriaLiberada} pliometriaMotivoBloqueio={pliometriaMotivoBloqueio} onAbrirPliometria={onAbrirPliometria} />

      <PlanoSeEntaoCard plano={planoSeEntao} isSegunda={isSegunda} onSalvar={onSalvarPlano} />

      {proximaSessao && (
        <div style={{ background: color.surface, border: "1px solid " + color.border, borderRadius: radius.lg, padding: space.xl, textAlign: "center", marginBottom: space.md }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: space.sm }}><Icon name={proximaSessao.icon} size={30} color={proximaSessao.cor} /></div>
          <div style={{ fontSize: ty.xs, color: color.textFaint, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Próximo treino</div>
          <div style={{ fontSize: ty.xl, fontWeight: 800, marginBottom: 6 }}>{proximaSessao.label}</div>
          {proximaSessao.resumo && <div style={{ fontSize: ty.sm, color: proximaSessao.cor, fontWeight: 600, background: proximaSessao.cor + "18", borderRadius: radius.sm, padding: "6px 14px", display: "inline-block" }}>{proximaSessao.resumo}</div>}
        </div>
      )}
      <button onClick={onIniciar} style={{ width: "100%", minHeight: touch.min, fontSize: ty.md, fontWeight: 800, background: proximaSessao ? proximaSessao.cor : color.success, color: color.bg, border: "none", borderRadius: radius.lg, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", marginBottom: space.sm }}>Iniciar treino</button>
      <button onClick={() => window.confirm("Pular este treino e ir para o próximo?") && onPular()} style={{ width: "100%", minHeight: 44, fontSize: ty.xs, background: "transparent", color: color.textFaint, border: "none", cursor: "pointer" }}>Pular treino</button>

      {gateInfo && !gateInfo.ok && (
        <div style={{ marginTop: space.lg, padding: space.md, background: color.alert + "14", border: "1px solid " + color.alert + "44", borderRadius: radius.lg }}>
          <div style={{ fontSize: ty.sm, fontWeight: 700, color: color.alert, marginBottom: 6 }}>Fim da semana — ainda falta pra avançar de macrofase</div>
          <div style={{ fontSize: ty.xs, color: color.textDim, lineHeight: 1.6 }}>{gateInfo.faltando.map((f, i) => <div key={i}>• {f}</div>)}</div>
        </div>
      )}

      <div style={{ marginTop: space.xl }}>
        <div style={{ fontSize: ty.xs, color: color.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: space.sm }}>Treinos desta macrofase</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {sessoes.map((s, i) => (
            <button key={i} onClick={() => onVerSessao(i)} style={{ minHeight: touch.min, padding: "12px 6px", borderRadius: radius.md, border: "1px solid " + color.border, background: color.surface, cursor: "pointer", textAlign: "center" }}>
              <Icon name={s.icon} size={20} color={s.cor} />
              <div style={{ fontSize: ty.micro, color: color.textDim, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: space.lg, marginTop: space.xl, flexWrap: "wrap" }}>
        <button onClick={onAbrirHistorico} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Histórico</button>
        <button onClick={onAbrirRelatorios} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Relatórios</button>
        <button onClick={onAbrirLembretes} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Lembretes</button>
        <button onClick={onRecalibrar} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Recalibrar</button>
      </div>
    </div>
  );
}

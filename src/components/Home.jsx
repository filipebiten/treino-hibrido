import Icon from "./Icon.jsx";
import { color, space, type as ty, radius, touch } from "../lib/tokens.js";

const cardBase = { width: "100%", color: color.text, borderRadius: radius.lg, border: "1px solid " + color.border, background: color.surface, cursor: "pointer", textAlign: "left" };

function DorCard({ dorHoje, diasSemRegistro, onRegistrar }) {
  if (dorHoje !== undefined) {
    return (
      <div style={{ ...cardBase, padding: space.md, marginBottom: space.md, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="drop" size={16} color={color.pain} /><span style={{ fontSize: ty.sm, color: color.textDim }}>Dor hoje: <b style={{ color: color.text }}>{dorHoje}/10</b></span></div>
      </div>
    );
  }
  const insistente = diasSemRegistro >= 2;
  return (
    <div style={{ ...cardBase, padding: space.lg, marginBottom: space.md, border: "2px solid " + (insistente ? color.pain : color.alert), background: (insistente ? color.pain : color.alert) + "14" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: space.sm }}>
        <Icon name="drop" size={20} color={insistente ? color.pain : color.alert} />
        <div style={{ fontSize: ty.lg, fontWeight: 800 }}>Dor no calcanhar hoje?</div>
      </div>
      {insistente && <div style={{ fontSize: ty.xs, color: color.pain, marginBottom: space.sm }}>Sem registro há {diasSemRegistro} dias — tenta não pular.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
        {Array.from({ length: 11 }, (_, i) => i).map(n => (
          <button key={n} onClick={() => onRegistrar(n)} style={{ minHeight: 44, borderRadius: radius.sm, border: "1px solid " + color.border, background: color.surfaceAlt, color: color.text, fontWeight: 700, fontSize: ty.sm, cursor: "pointer" }}>{n}</button>
        ))}
      </div>
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

export default function Home({
  macrofaseNome, semanaIdx, totalSemanas, hojeISO,
  dorHoje, diasSemRegistroDor, onRegistrarDor,
  doses, doseFeitaFn, onAbrirDose, cargaDisponivel, cargaFeita, cargaTitulo, cargaBloqueada, restanteRathleff,
  proximaSessao, onIniciar, onPular,
  gateInfo,
  sessoes, onVerSessao,
  onAbrirHistorico, onAbrirRelatorios, onRecalibrar,
  retomar, onRetomar, onDescartarRetomar,
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

      <DorCard dorHoje={dorHoje} diasSemRegistro={diasSemRegistroDor} onRegistrar={onRegistrarDor} />

      <RehabCard doses={doses} doseFeitaFn={doseFeitaFn} onAbrirDose={onAbrirDose} cargaDisponivel={cargaDisponivel} cargaFeita={cargaFeita} cargaTitulo={cargaTitulo} cargaBloqueada={cargaBloqueada} restanteRathleff={restanteRathleff} />

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

      <div style={{ display: "flex", justifyContent: "center", gap: space.lg, marginTop: space.xl }}>
        <button onClick={onAbrirHistorico} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Histórico</button>
        <button onClick={onAbrirRelatorios} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Relatórios</button>
        <button onClick={onRecalibrar} style={{ background: "none", border: "none", color: color.textFaint, fontSize: ty.xs, cursor: "pointer", minHeight: 44 }}>Recalibrar</button>
      </div>
    </div>
  );
}

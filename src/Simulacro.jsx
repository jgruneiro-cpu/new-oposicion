import { useState, useEffect, useRef } from "react";

const API_URL = "/.netlify/functions/claude";
const TOTAL_PREGUNTAS = 100;
const DURACION_SEG    = 90 * 60;
const PENALIZACION    = 1 / 3;
const NUM_LOTES       = 10;
const POR_LOTE        = 10;
const NOTA_APROBADO   = 5;

function tryJSON(s) {
  if (!s) return null;
  const cleaned = s.replace(/```json|```/g, "").trim();
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  try { return JSON.parse(cleaned); } catch { return null; }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

async function callClaude(messages) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages,
    }),
  });
  if (!res.ok) throw new Error("Error API: " + res.status);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function generarLote(temasMuestra, n, intento = 0) {
  const lista = temasMuestra.map(t => `${t.numero}. ${t.titulo}`).join("\n");
  const prompt = `Eres un tribunal experto en oposiciones a Auxiliar y Ayudante de Bibliotecas del Estado (Ministerio de Cultura, España).

Genera EXACTAMENTE ${n} preguntas tipo test al estilo de los exámenes oficiales españoles, basadas en estos temas:

${lista}

Reparte las preguntas de forma equilibrada entre los temas listados. Cada pregunta debe:
- Tener 4 opciones (A, B, C, D), solo una correcta
- Ser de dificultad media-alta, similar a la oposición real
- Cuando proceda, incluir datos concretos: artículos de leyes, años, siglas, normas
- Llevar una explicación breve (1-2 frases)

Devuelve SOLO un array JSON válido, SIN markdown:
[{"tema":"num","tituloTema":"...","pregunta":"...","opciones":["...","...","...","..."],"correcta":0,"explicacion":"..."}]`;

  try {
    const txt = await callClaude([{ role: "user", content: prompt }]);
    const arr = tryJSON(txt);
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("parse");
    return arr.slice(0, n);
  } catch (e) {
    if (intento < 1) return generarLote(temasMuestra, n, intento + 1);
    return [];
  }
}

const S = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modal: { background:"var(--color-bg)", borderRadius:"var(--radius-lg)", width:"100%", maxWidth:880, maxHeight:"94vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.25)" },
  header: { padding:"18px 24px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"var(--color-bg-soft)" },
  title: { fontSize:18, fontWeight:600, color:"var(--color-text)", margin:0 },
  body: { padding:24, overflowY:"auto", flex:1 },
  footer: { padding:"14px 24px", borderTop:"1px solid var(--color-border)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, background:"var(--color-bg-soft)", flexWrap:"wrap" },
  btn: { padding:"10px 20px", borderRadius:"var(--radius-md)", border:"1px solid transparent", fontSize:14, fontWeight:500, cursor:"pointer" },
  btnPrimary: { background:"var(--color-accent)", color:"white", fontWeight:600 },
  btnSecondary: { background:"var(--color-bg)", color:"var(--color-text)", borderColor:"var(--color-border)" },
  btnDanger: { background:"var(--color-danger)", color:"white", fontWeight:600 },
  cronoBox: { display:"inline-flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:"var(--radius-md)", fontVariantNumeric:"tabular-nums", fontWeight:700, fontSize:15 },
  preguntaCard: { background:"var(--color-bg-soft)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:22 },
  opcion: { display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", marginBottom:8, cursor:"pointer", background:"var(--color-bg)", transition:"all .12s" },
  opcionSel: { borderColor:"var(--color-accent)", background:"var(--color-accent-soft)" },
  letra: { width:28, height:28, borderRadius:"var(--radius-sm)", background:"var(--color-bg)", border:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:600, fontSize:13 },
  letraSel: { background:"var(--color-accent)", color:"white", borderColor:"var(--color-accent)" },
  navGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(36px, 1fr))", gap:6, marginTop:14 },
  navCell: { height:36, borderRadius:"var(--radius-sm)", border:"1px solid var(--color-border)", background:"var(--color-bg)", fontSize:12, fontWeight:500, cursor:"pointer", color:"var(--color-text-soft)" },
};

function Inicio({ onIniciar, onClose, error, numTemas, historico }) {
  return (
    <>
      <div style={S.header}>
        <h2 style={S.title}>🎯 Simulacro de examen — 100 preguntas</h2>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Cerrar</button>
      </div>
      <div style={S.body}>
        <div style={{ display:"grid", gap:10, marginBottom:20 }}>
          <Fila k="Preguntas" v="100, mezcladas de todos los temas" />
          <Fila k="Tiempo" v="90 minutos · cuenta atrás visible" />
          <Fila k="Penalización" v="cada 3 errores restan 1 acierto (1/3)" />
          <Fila k="Nota mínima para aprobar" v="5 sobre 10" />
          <Fila k="Temas en cartera" v={`${numTemas} disponibles`} />
        </div>
        <div style={{
          padding:16, background:"var(--color-accent-soft)", border:"1px solid var(--color-accent-border)",
          borderRadius:"var(--radius-md)", fontSize:13, lineHeight:1.6, color:"#5C2E0F",
        }}>
          <strong>Cómo aprovecharlo.</strong> Hazlo en una sola sentada, sin pausa, en silencio.
          La penalización es real: si dudas mucho entre dos opciones, déjala en blanco. Marca
          las que no tengas claras y vuelve al final con el tiempo que te sobre.
        </div>
        {historico.length > 0 && (
          <div style={{ marginTop:20 }}>
            <p style={{ fontSize:12, fontWeight:600, color:"var(--color-text-mute)", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>
              Tus últimos simulacros
            </p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {historico.slice(-8).map((h, i) => (
                <div key={i} style={{
                  padding:"6px 12px", borderRadius:"var(--radius-sm)", fontSize:12, fontWeight:600,
                  background: h.aprobado ? "var(--color-success-soft)" : "var(--color-danger-soft)",
                  color: h.aprobado ? "var(--color-success)" : "var(--color-danger)",
                  border: `1px solid ${h.aprobado ? "#9FE1CB" : "#FCA5A5"}`,
                }}>
                  {h.sobre10.toFixed(2)}/10
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div style={{
            marginTop:16, padding:14, borderRadius:"var(--radius-md)",
            background:"var(--color-danger-soft)", color:"var(--color-danger)", fontSize:13,
          }}>{error}</div>
        )}
      </div>
      <div style={S.footer}>
        <span style={{ fontSize:12, color:"var(--color-text-mute)" }}>
          La generación tarda ~30-60 s.
        </span>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={onIniciar}>Empezar simulacro</button>
      </div>
    </>
  );
}

function Fila({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", gap:12, padding:"10px 0", borderBottom:"1px dashed var(--color-border)" }}>
      <span style={{ fontSize:13, color:"var(--color-text-mute)" }}>{k}</span>
      <span style={{ fontSize:13, color:"var(--color-text)", fontWeight:500, textAlign:"right" }}>{v}</span>
    </div>
  );
}

function Cargando({ progreso }) {
  const pct = Math.min(100, Math.round((progreso / TOTAL_PREGUNTAS) * 100));
  return (
    <div style={{ padding:60, textAlign:"center" }}>
      <div style={{
        width:56, height:56, borderRadius:"50%", margin:"0 auto 22px",
        border:"4px solid var(--color-accent-soft)", borderTopColor:"var(--color-accent)",
        animation:"spin .8s linear infinite",
      }} />
      <p style={{ fontSize:16, fontWeight:600, color:"var(--color-text)", marginBottom:6 }}>
        Generando preguntas con IA…
      </p>
      <p style={{ fontSize:13, color:"var(--color-text-mute)", marginBottom:22 }}>
        {progreso} / {TOTAL_PREGUNTAS} listas
      </p>
      <div style={{
        height:8, width:"100%", maxWidth:360, margin:"0 auto",
        background:"var(--color-bg-soft)", borderRadius:99, overflow:"hidden",
      }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"var(--color-accent)", transition:"width .3s ease" }} />
      </div>
    </div>
  );
}

function Examen({ preguntas, actual, setActual, resp, elegir, marc, marcarRevision, time, finalizar, onClose }) {
  const p = preguntas[actual];
  if (!p) return null;
  const tBajo = time <= 600;
  const tCritico = time <= 60;
  const cronoStyle = {
    ...S.cronoBox,
    background: tCritico ? "var(--color-danger-soft)" : tBajo ? "var(--color-accent-soft)" : "var(--color-success-soft)",
    color: tCritico ? "var(--color-danger)" : tBajo ? "var(--color-accent)" : "var(--color-success)",
    border: `1px solid ${tCritico ? "#FCA5A5" : tBajo ? "var(--color-accent-border)" : "#9FE1CB"}`,
  };

  return (
    <>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Pregunta {actual + 1} de {preguntas.length}</h2>
          <p style={{ fontSize:12, color:"var(--color-text-mute)", margin:"3px 0 0" }}>
            Tema {p.tema} {p.tituloTema ? `· ${p.tituloTema}` : ""}
          </p>
        </div>
        <div style={cronoStyle}>{fmtTime(time)}</div>
      </div>
      <div style={S.body}>
        <div style={S.preguntaCard}>
          <p style={{ fontSize:16, lineHeight:1.55, color:"var(--color-text)", margin:"0 0 18px", fontWeight:500 }}>
            {p.pregunta}
          </p>
          {p.opciones.map((op, i) => {
            const sel = resp[actual] === i;
            return (
              <div key={i} style={{ ...S.opcion, ...(sel ? S.opcionSel : {}) }} onClick={() => elegir(i)}>
                <div style={{ ...S.letra, ...(sel ? S.letraSel : {}) }}>{String.fromCharCode(65 + i)}</div>
                <span style={{ fontSize:14, lineHeight:1.5, color:"var(--color-text)" }}>{op}</span>
              </div>
            );
          })}
          <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
            <button style={{ ...S.btn, ...S.btnSecondary, fontSize:13 }} onClick={() => elegir(-1)}>
              Dejar en blanco
            </button>
            <button style={{
              ...S.btn, ...S.btnSecondary, fontSize:13,
              background: marc.has(actual) ? "var(--color-accent-soft)" : "var(--color-bg)",
              borderColor: marc.has(actual) ? "var(--color-accent-border)" : "var(--color-border)",
            }} onClick={marcarRevision}>
              {marc.has(actual) ? "✓ Marcada para revisar" : "Marcar para revisar"}
            </button>
          </div>
        </div>
        <div style={{ marginTop:22 }}>
          <p style={{ fontSize:12, fontWeight:600, color:"var(--color-text-mute)", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
            Navegador de preguntas
          </p>
          <div style={{ display:"flex", gap:12, fontSize:11, color:"var(--color-text-mute)", marginBottom:10 }}>
            <Leyenda c="var(--color-success)" t="Contestada" />
            <Leyenda c="var(--color-accent)" t="Para revisar" />
            <Leyenda c="var(--color-border)" t="Sin contestar" />
          </div>
          <div style={S.navGrid}>
            {preguntas.map((_, i) => {
              const r = resp[i];
              const respondida = r !== undefined && r !== -1;
              const enRevision = marc.has(i);
              const esActual = i === actual;
              let bg = "var(--color-bg)", color = "var(--color-text-soft)", bd = "var(--color-border)";
              if (respondida) { bg = "var(--color-success-soft)"; color = "var(--color-success)"; bd = "#9FE1CB"; }
              if (enRevision) { bg = "var(--color-accent-soft)"; color = "var(--color-accent)"; bd = "var(--color-accent-border)"; }
              if (esActual) { bd = "var(--color-accent)"; }
              return (
                <button key={i} onClick={() => setActual(i)} style={{
                  ...S.navCell, background:bg, color, borderColor:bd,
                  borderWidth: esActual ? 2 : 1, fontWeight: esActual ? 700 : 500,
                }}>{i + 1}</button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={S.footer}>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => setActual(Math.max(0, actual - 1))} disabled={actual === 0}>
            ← Anterior
          </button>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={() => setActual(Math.min(preguntas.length - 1, actual + 1))} disabled={actual === preguntas.length - 1}>
            Siguiente →
          </button>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Abandonar</button>
          <button style={{ ...S.btn, ...S.btnDanger }} onClick={() => {
            const sinResp = preguntas.filter((_, i) => resp[i] === undefined || resp[i] === -1).length;
            const msg = sinResp > 0
              ? `Tienes ${sinResp} preguntas sin contestar. ¿Finalizar?`
              : "¿Finalizar y ver resultados?";
            if (confirm(msg)) finalizar();
          }}>Finalizar</button>
        </div>
      </div>
    </>
  );
}

function Leyenda({ c, t }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <span style={{ width:10, height:10, borderRadius:2, background:c, border:"1px solid rgba(0,0,0,.08)" }} />
      {t}
    </div>
  );
}

function Resultado({ resultado, preguntas, resp, reiniciar, onClose }) {
  const { ok, err, blanco, sobre10, aprobado, porTema } = resultado;
  const [verSolo, setVerSolo] = useState("fallos");

  const fallosArr = preguntas.map((p, i) => ({ p, i, r: resp[i] })).filter(x => x.r !== undefined && x.r !== -1 && x.r !== x.p.correcta);
  const blancosArr = preguntas.map((p, i) => ({ p, i, r: resp[i] })).filter(x => x.r === undefined || x.r === -1);
  const debiles = Object.entries(porTema)
    .map(([tema, c]) => ({ tema, total: c.ok + c.err + c.blanco, pct: c.ok / Math.max(1, c.ok + c.err + c.blanco) * 100 }))
    .filter(t => t.total >= 2).sort((a, b) => a.pct - b.pct).slice(0, 5);

  return (
    <>
      <div style={S.header}>
        <h2 style={S.title}>Resultado del simulacro</h2>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Cerrar</button>
      </div>
      <div style={S.body}>
        <div style={{
          padding:28, borderRadius:"var(--radius-lg)", textAlign:"center", marginBottom:22,
          background: aprobado ? "var(--color-success-soft)" : "var(--color-danger-soft)",
          border: `1px solid ${aprobado ? "#9FE1CB" : "#FCA5A5"}`,
        }}>
          <p style={{
            fontSize:12, fontWeight:700, letterSpacing:.8,
            color: aprobado ? "var(--color-success)" : "var(--color-danger)",
            margin:"0 0 8px", textTransform:"uppercase",
          }}>
            {aprobado ? "APROBADO" : "SUSPENSO"}
          </p>
          <p style={{ fontSize:52, fontWeight:700, color:"var(--color-text)", margin:"0 0 4px", fontVariantNumeric:"tabular-nums" }}>
            {sobre10.toFixed(2)}
          </p>
          <p style={{ fontSize:13, color:"var(--color-text-mute)", margin:0 }}>sobre 10</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:22 }}>
          <Stat n={ok} l="Aciertos" c="var(--color-success)" />
          <Stat n={err} l="Errores" c="var(--color-danger)" />
          <Stat n={blanco} l="En blanco" c="var(--color-text-mute)" />
        </div>
        <div style={{
          padding:14, borderRadius:"var(--radius-md)", background:"var(--color-bg-soft)",
          border:"1px solid var(--color-border)", fontSize:12, color:"var(--color-text-soft)", marginBottom:22,
        }}>
          Cálculo: {ok} aciertos − ({err} errores × 1/3) = <strong>{(ok - err * PENALIZACION).toFixed(2)} puntos</strong> sobre {preguntas.length} → {sobre10.toFixed(2)}/10
        </div>
        {debiles.length > 0 && (
          <div style={{ marginBottom:22 }}>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--color-text)", marginBottom:10 }}>Tus puntos débiles</p>
            {debiles.map(d => (
              <div key={d.tema} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 14px", borderRadius:"var(--radius-md)", background:"var(--color-accent-soft)",
                border:"1px solid var(--color-accent-border)", marginBottom:6, fontSize:13,
              }}>
                <span style={{ color:"var(--color-text)", fontWeight:500 }}>Tema {d.tema}</span>
                <span style={{ color:"var(--color-accent)", fontWeight:700 }}>{d.pct.toFixed(0)}% de acierto</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          <button style={{ ...S.btn, ...(verSolo==="fallos" ? S.btnPrimary : S.btnSecondary), fontSize:13 }} onClick={() => setVerSolo("fallos")}>
            Solo fallos ({fallosArr.length})
          </button>
          <button style={{ ...S.btn, ...(verSolo==="blancos" ? S.btnPrimary : S.btnSecondary), fontSize:13 }} onClick={() => setVerSolo("blancos")}>
            En blanco ({blancosArr.length})
          </button>
          <button style={{ ...S.btn, ...(verSolo==="todas" ? S.btnPrimary : S.btnSecondary), fontSize:13 }} onClick={() => setVerSolo("todas")}>
            Todas
          </button>
        </div>
        <div>
          {(verSolo === "fallos" ? fallosArr : verSolo === "blancos" ? blancosArr : preguntas.map((p, i) => ({ p, i, r: resp[i] }))).map(({ p, i, r }) => {
            const acertada = r === p.correcta;
            const enBlanco = r === undefined || r === -1;
            return (
              <div key={i} style={{
                padding:16, borderRadius:"var(--radius-md)", marginBottom:10,
                background: enBlanco ? "var(--color-bg-soft)" : acertada ? "var(--color-success-soft)" : "var(--color-danger-soft)",
                border: `1px solid ${enBlanco ? "var(--color-border)" : acertada ? "#9FE1CB" : "#FCA5A5"}`,
              }}>
                <p style={{ fontSize:11, color:"var(--color-text-mute)", margin:"0 0 5px", fontWeight:600 }}>
                  #{i+1} · Tema {p.tema}
                </p>
                <p style={{ fontSize:14, color:"var(--color-text)", margin:"0 0 8px", fontWeight:500, lineHeight:1.5 }}>{p.pregunta}</p>
                {!enBlanco && !acertada && (
                  <p style={{ fontSize:13, color:"var(--color-danger)", margin:"0 0 4px" }}>
                    Tu respuesta: {String.fromCharCode(65 + r)}. {p.opciones[r]}
                  </p>
                )}
                <p style={{ fontSize:13, color:"var(--color-success)", margin:"0 0 6px" }}>
                  Correcta: {String.fromCharCode(65 + p.correcta)}. {p.opciones[p.correcta]}
                </p>
                {p.explicacion && (
                  <p style={{ fontSize:12, color:"var(--color-text-soft)", lineHeight:1.5, margin:0, fontStyle:"italic" }}>
                    {p.explicacion}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={S.footer}>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Cerrar</button>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={reiniciar}>Hacer otro simulacro</button>
      </div>
    </>
  );
}

function Stat({ n, l, c }) {
  return (
    <div style={{ padding:16, borderRadius:"var(--radius-md)", background:"var(--color-bg)", border:"1px solid var(--color-border)", textAlign:"center" }}>
      <p style={{ fontSize:30, fontWeight:700, color:c, margin:0, fontVariantNumeric:"tabular-nums" }}>{n}</p>
      <p style={{ fontSize:12, color:"var(--color-text-mute)", margin:"3px 0 0", fontWeight:500 }}>{l}</p>
    </div>
  );
}

export default function Simulacro({ temas, onClose }) {
  const [fase, setFase] = useState("inicio");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [resp, setResp] = useState({});
  const [marc, setMarc] = useState(new Set());
  const [actual, setActual] = useState(0);
  const [time, setTime] = useState(DURACION_SEG);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const timerRef = useRef(null);
  const finalizarRef = useRef(null);

  useEffect(() => {
    try { setHistorico(JSON.parse(localStorage.getItem("simulacros") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    if (fase !== "examen") return;
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) { clearInterval(timerRef.current); finalizarRef.current?.(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [fase]);

  async function iniciar() {
    if (!temas || temas.length === 0) { setError("No hay temas."); return; }
    setFase("cargando"); setError(null); setProgreso(0);
    try {
      const buckets = Array.from({ length: NUM_LOTES }, () => []);
      shuffle(temas).forEach((t, i) => buckets[i % NUM_LOTES].push(t));
      let done = 0;
      const lotes = await Promise.all(buckets.map(async (b) => {
        const arr = b.length > 0 ? await generarLote(b, POR_LOTE) : [];
        done += arr.length; setProgreso(done); return arr;
      }));
      const todas = shuffle(lotes.flat()).slice(0, TOTAL_PREGUNTAS);
      if (todas.length < 50) throw new Error(`Solo se generaron ${todas.length} preguntas.`);
      setPreguntas(todas); setResp({}); setMarc(new Set()); setActual(0); setTime(DURACION_SEG); setFase("examen");
    } catch (e) { setError(e.message); setFase("inicio"); }
  }

  function elegir(i) { setResp(p => ({ ...p, [actual]: i })); }
  function marcarRevision() {
    setMarc(m => { const n = new Set(m); if (n.has(actual)) n.delete(actual); else n.add(actual); return n; });
  }

  function finalizar() {
    clearInterval(timerRef.current);
    let ok = 0, err = 0, blanco = 0;
    preguntas.forEach((p, i) => {
      const r = resp[i];
      if (r === undefined || r === -1) blanco++;
      else if (r === p.correcta) ok++;
      else err++;
    });
    const puntos = ok - err * PENALIZACION;
    const sobre10 = Math.max(0, (puntos / preguntas.length) * 10);
    const aprobado = sobre10 >= NOTA_APROBADO;
    const porTema = {};
    preguntas.forEach((p, i) => {
      const t = p.tema || "?";
      if (!porTema[t]) porTema[t] = { ok:0, err:0, blanco:0 };
      const r = resp[i];
      if (r === undefined || r === -1) porTema[t].blanco++;
      else if (r === p.correcta) porTema[t].ok++;
      else porTema[t].err++;
    });
    setResultado({ ok, err, blanco, puntos, sobre10, aprobado, porTema });
    setFase("resultado");
    try {
      const h = JSON.parse(localStorage.getItem("simulacros") || "[]");
      h.push({ fecha:Date.now(), ok, err, blanco, sobre10, aprobado, tiempoUsado:DURACION_SEG - time, porTema });
      localStorage.setItem("simulacros", JSON.stringify(h.slice(-30)));
      setHistorico(h.slice(-30));
    } catch {}
  }
  finalizarRef.current = finalizar;

  function reiniciar() {
    setFase("inicio"); setResultado(null); setPreguntas([]); setResp({});
    setMarc(new Set()); setActual(0); setTime(DURACION_SEG);
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {fase === "inicio" && <Inicio onIniciar={iniciar} onClose={onClose} error={error} numTemas={temas.length} historico={historico} />}
        {fase === "cargando" && <Cargando progreso={progreso} />}
        {fase === "examen" && <Examen preguntas={preguntas} actual={actual} setActual={setActual} resp={resp} elegir={elegir} marc={marc} marcarRevision={marcarRevision} time={time} finalizar={finalizar} onClose={onClose} />}
        {fase === "resultado" && <Resultado resultado={resultado} preguntas={preguntas} resp={resp} reiniciar={reiniciar} onClose={onClose} />}
      </div>
    </div>
  );
}

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
  const lista = temasMuestra
    .map(t => `${t.numero}. ${t.titulo}`)
    .join("\n");

  const prompt = `Eres un tribunal experto en oposiciones a Auxiliar y Ayudante de Bibliotecas del Estado (Ministerio de Cultura, España).

Genera EXACTAMENTE ${n} preguntas tipo test al estilo de los exámenes oficiales españoles, basadas en estos temas:

${lista}

Reparte las preguntas de forma equilibrada entre los temas listados. Cada pregunta debe:
- Tener 4 opciones (A, B, C, D), solo una correcta
- Ser de dificultad media-alta, similar a la oposición real
- Cuando proceda, incluir datos concretos: artículos de leyes, años, siglas, normas (UNE, ISBD, RDA, ISO), cifras, instituciones
- Llevar una explicación breve (1-2 frases) de por qué la respuesta es la correcta

Devuelve SOLO un array JSON válido, SIN markdown, SIN texto extra, SIN comentarios:
[
  {
    "tema": "número del tema (ej: '25')",
    "tituloTema": "título corto del tema",
    "pregunta": "...",
    "opciones": ["...","...","...","..."],
    "correcta": 0,
    "explicacion": "..."
  }
]`;

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
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
  },
  modal: {
    background: "#fff", borderRadius: 18, width: "100%", maxWidth: 880,
    maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  header: {
    padding: "16px 22px", borderBottom: "1px solid #E5E7EB",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    background: "#FAFAF7",
  },
  title: { fontSize: 17, fontWeight: 600, color: "#1A1A1A", margin: 0 },
  body: { padding: 22, overflowY: "auto", flex: 1 },
  footer: {
    padding: "14px 22px", borderTop: "1px solid #E5E7EB",
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
    background: "#FAFAF7", flexWrap: "wrap",
  },
  btn: {
    padding: "10px 18px", borderRadius: 10, border: "1px solid transparent",
    fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all .15s",
  },
  btnPrimary: { background: "#0F6E56", color: "#fff" },
  btnSecondary: { background: "#fff", color: "#1A1A1A", borderColor: "#D1D5DB" },
  btnDanger: { background: "#B91C1C", color: "#fff" },
  cronoBox: {
    display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px",
    borderRadius: 8, fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 14,
  },
  preguntaCard: {
    background: "#FAFAF7", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20,
  },
  opcion: {
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 8, cursor: "pointer",
    background: "#fff", transition: "all .12s",
  },
  opcionSel: { borderColor: "#0F6E56", background: "#E1F5EE" },
  letra: {
    width: 26, height: 26, borderRadius: 6, background: "#fff", border: "1px solid #D1D5DB",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    fontWeight: 600, fontSize: 13,
  },
  letraSel: { background: "#0F6E56", color: "#fff", borderColor: "#0F6E56" },
  navGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))",
    gap: 6, marginTop: 14,
  },
  navCell: {
    height: 34, borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff",
    fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#374151",
  },
};

function Inicio({ onIniciar, onClose, error, numTemas, historico }) {
  return (
    <>
      <div style={S.header}>
        <h2 style={S.title}>Simulacro de examen — 100 preguntas</h2>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Cerrar</button>
      </div>
      <div style={S.body}>
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <Fila k="Preguntas" v="100, mezcladas de todos los temas" />
          <Fila k="Tiempo" v="90 minutos · cuenta atrás visible" />
          <Fila k="Penalización" v="cada 3 errores restan 1 acierto (1/3)" />
          <Fila k="Nota mínima para aprobar" v="5 sobre 10 (50% de la nota máxima)" />
          <Fila k="Temas en cartera" v={`${numTemas} disponibles en tu repositorio`} />
        </div>
        <div style={{
          padding: 14, background: "#FFF8E5", border: "1px solid #F2D58A",
          borderRadius: 10, fontSize: 13, lineHeight: 1.5, color: "#5C4910",
        }}>
          <strong>Cómo aprovecharlo.</strong> Hazlo en una sola sentada, sin pausa, en silencio.
          La penalización es real: si dudas mucho entre dos opciones, déjala en blanco. Marca
          las que no tengas claras y vuelve al final con el tiempo que te sobre.
        </div>
        {historico.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Tus últimos simulacros
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {historico.slice(-8).map((h, i) => (
                <div key={i} style={{
                  padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: h.aprobado ? "#E1F5EE" : "#FEE2E2",
                  color: h.aprobado ? "#0F6E56" : "#991B1B",
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
            marginTop: 14, padding: 12, borderRadius: 10,
            background: "#FEE2E2", color: "#991B1B", fontSize: 13,
          }}>{error}</div>
        )}
      </div>
      <div style={S.footer}>
        <span style={{ fontSize: 12, color: "#6B7280" }}>
          La generación tarda ~30-60 s la primera vez.
        </span>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={onIniciar}>
          Empezar simulacro
        </button>
      </div>
    </>
  );
}

function Fila({ k, v }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12,
      padding: "8px 0", borderBottom: "1px dashed #E5E7EB",
    }}>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{k}</span>
      <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function Cargando({ progreso }) {
  const pct = Math.min(100, Math.round((progreso / TOTAL_PREGUNTAS) * 100));
  return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", margin: "0 auto 22px",
        border: "4px solid #E1F5EE", borderTopColor: "#0F6E56",
        animation: "spin .8s linear infinite",
      }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>
        Generando preguntas con IA…
      </p>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 22 }}>
        {progreso} / {TOTAL_PREGUNTAS} listas
      </p>
      <div style={{
        height: 8, width: "100%", maxWidth: 360, margin: "0 auto",
        background: "#F1EFE8", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: "#0F6E56",
          transition: "width .3s ease",
        }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Examen({ preguntas, actual, setActual, resp, elegir, marc, marcarRevision,
                  time, finalizar, onClose }) {
  const p = preguntas[actual];
  if (!p) return null;
  const tBajo = time <= 600;
  const tCritico = time <= 60;
  const cronoStyle = {
    ...S.cronoBox,
    background: tCritico ? "#FEE2E2" : tBajo ? "#FFF8E5" : "#E1F5EE",
    color: tCritico ? "#991B1B" : tBajo ? "#854F0B" : "#0F6E56",
    border: `1px solid ${tCritico ? "#FCA5A5" : tBajo ? "#F2D58A" : "#9FE1CB"}`,
  };

  return (
    <>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Pregunta {actual + 1} de {preguntas.length}</h2>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
            Tema {p.tema} {p.tituloTema ? `· ${p.tituloTema}` : ""}
          </p>
        </div>
        <div style={cronoStyle}>{fmtTime(time)}</div>
      </div>
      <div style={S.body}>
        <div style={S.preguntaCard}>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "#1A1A1A", margin: "0 0 16px" }}>
            {p.pregunta}
          </p>
          {p.opciones.map((op, i) => {
            const sel = resp[actual] === i;
            return (
              <div key={i}
                   style={{ ...S.opcion, ...(sel ? S.opcionSel : {}) }}
                   onClick={() => elegir(i)}>
                <div style={{ ...S.letra, ...(sel ? S.letraSel : {}) }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "#1A1A1A" }}>{op}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button style={{ ...S.btn, ...S.btnSecondary, fontSize: 13 }}
                    onClick={() => elegir(-1)}>
              Dejar en blanco
            </button>
            <button style={{
              ...S.btn, ...S.btnSecondary, fontSize: 13,
              background: marc.has(actual) ? "#FFF8E5" : "#fff",
              borderColor: marc.has(actual) ? "#F2D58A" : "#D1D5DB",
            }} onClick={marcarRevision}>
              {marc.has(actual) ? "✓ Marcada para revisar" : "Marcar para revisar"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 22 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
            Navegador de preguntas
          </p>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B7280", marginBottom: 8 }}>
            <Leyenda c="#0F6E56" t="Contestada" />
            <Leyenda c="#F2D58A" t="Para revisar" />
            <Leyenda c="#D1D5DB" t="Sin contestar" />
          </div>
          <div style={S.navGrid}>
            {preguntas.map((_, i) => {
              const r = resp[i];
              const respondida = r !== undefined && r !== -1;
              const enRevision = marc.has(i);
              const esActual = i === actual;
              let bg = "#fff", color = "#374151", bd = "#D1D5DB";
              if (respondida) { bg = "#E1F5EE"; color = "#0F6E56"; bd = "#9FE1CB"; }
              if (enRevision) { bg = "#FFF8E5"; color = "#854F0B"; bd = "#F2D58A"; }
              if (esActual) { bd = "#0F6E56"; }
              return (
                <button key={i}
                        onClick={() => setActual(i)}
                        style={{
                          ...S.navCell,
                          background: bg, color, borderColor: bd,
                          borderWidth: esActual ? 2 : 1,
                          fontWeight: esActual ? 700 : 500,
                        }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={S.footer}>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn, ...S.btnSecondary }}
                  onClick={() => setActual(Math.max(0, actual - 1))}
                  disabled={actual === 0}>
            ← Anterior
          </button>
          <button style={{ ...S.btn, ...S.btnSecondary }}
                  onClick={() => setActual(Math.min(preguntas.length - 1, actual + 1))}
                  disabled={actual === preguntas.length - 1}>
            Siguiente →
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>
            Abandonar
          </button>
          <button style={{ ...S.btn, ...S.btnDanger }}
                  onClick={() => {
                    const sinResp = preguntas.filter((_, i) => resp[i] === undefined || resp[i] === -1).length;
                    const msg = sinResp > 0
                      ? `Tienes ${sinResp} preguntas sin contestar (contarán como blancos). ¿Finalizar?`
                      : "¿Finalizar y ver resultados?";
                    if (confirm(msg)) finalizar();
                  }}>
            Finalizar
          </button>
        </div>
      </div>
    </>
  );
}

function Leyenda({ c, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: c, border: "1px solid #00000010" }} />
      {t}
    </div>
  );
}

function Resultado({ resultado, preguntas, resp, reiniciar, onClose }) {
  const { ok, err, blanco, sobre10, aprobado, porTema } = resultado;
  const [verSolo, setVerSolo] = useState("fallos");

  const fallosArr = preguntas
    .map((p, i) => ({ p, i, r: resp[i] }))
    .filter(x => x.r !== undefined && x.r !== -1 && x.r !== x.p.correcta);

  const blancosArr = preguntas
    .map((p, i) => ({ p, i, r: resp[i] }))
    .filter(x => x.r === undefined || x.r === -1);

  const debiles = Object.entries(porTema)
    .map(([tema, c]) => ({
      tema,
      total: c.ok + c.err + c.blanco,
      pct: c.ok / Math.max(1, c.ok + c.err + c.blanco) * 100,
    }))
    .filter(t => t.total >= 2)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  return (
    <>
      <div style={S.header}>
        <h2 style={S.title}>Resultado del simulacro</h2>
        <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Cerrar</button>
      </div>
      <div style={S.body}>
        <div style={{
          padding: 24, borderRadius: 14, textAlign: "center", marginBottom: 22,
          background: aprobado ? "#E1F5EE" : "#FEE2E2",
          border: `1px solid ${aprobado ? "#9FE1CB" : "#FCA5A5"}`,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
                       color: aprobado ? "#0F6E56" : "#991B1B", margin: "0 0 6px" }}>
            {aprobado ? "APROBADO" : "SUSPENSO"}
          </p>
          <p style={{ fontSize: 48, fontWeight: 700, color: "#1A1A1A", margin: "0 0 4px",
                       fontVariantNumeric: "tabular-nums" }}>
            {sobre10.toFixed(2)}
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>sobre 10</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
          <Stat n={ok}     l="Aciertos"  c="#0F6E56" />
          <Stat n={err}    l="Errores"   c="#991B1B" />
          <Stat n={blanco} l="En blanco" c="#6B7280" />
        </div>
        <div style={{
          padding: 12, borderRadius: 10, background: "#FAFAF7",
          border: "1px solid #E5E7EB", fontSize: 12, color: "#374151", marginBottom: 22,
        }}>
          Cálculo: {ok} aciertos − ({err} errores × 1/3) = <strong>{(ok - err * PENALIZACION).toFixed(2)} puntos</strong> sobre {preguntas.length} → {sobre10.toFixed(2)}/10
        </div>
        {debiles.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
              Tus puntos débiles
            </p>
            {debiles.map(d => (
              <div key={d.tema} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: 8, background: "#FFF8E5",
                border: "1px solid #F2D58A", marginBottom: 6, fontSize: 13,
              }}>
                <span style={{ color: "#1A1A1A", fontWeight: 500 }}>Tema {d.tema}</span>
                <span style={{ color: "#854F0B", fontWeight: 600 }}>
                  {d.pct.toFixed(0)}% de acierto
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button style={{ ...S.btn, ...(verSolo==="fallos" ? S.btnPrimary : S.btnSecondary), fontSize: 13 }}
                  onClick={() => setVerSolo("fallos")}>
            Solo fallos ({fallosArr.length})
          </button>
          <button style={{ ...S.btn, ...(verSolo==="blancos" ? S.btnPrimary : S.btnSecondary), fontSize: 13 }}
                  onClick={() => setVerSolo("blancos")}>
            En blanco ({blancosArr.length})
          </button>
          <button style={{ ...S.btn, ...(verSolo==="todas" ? S.btnPrimary : S.btnSecondary), fontSize: 13 }}
                  onClick={() => setVerSolo("todas")}>
            Todas
          </button>
        </div>
        <div>
          {(verSolo === "fallos" ? fallosArr
            : verSolo === "blancos" ? blancosArr
            : preguntas.map((p, i) => ({ p, i, r: resp[i] }))
          ).map(({ p, i, r }) => {
            const acertada = r === p.correcta;
            const enBlanco = r === undefined || r === -1;
            return (
              <div key={i} style={{
                padding: 14, borderRadius: 10, marginBottom: 10,
                background: enBlanco ? "#FAFAF7" : acertada ? "#F0FAF6" : "#FEF2F2",
                border: `1px solid ${enBlanco ? "#E5E7EB" : acertada ? "#C7E9D8" : "#FECACA"}`,
              }}>
                <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 4px" }}>
                  #{i+1} · Tema {p.tema}
                </p>
                <p style={{ fontSize: 14, color: "#1A1A1A", margin: "0 0 8px", fontWeight: 500 }}>
                  {p.pregunta}
                </p>
                {!enBlanco && !acertada && (
                  <p style={{ fontSize: 13, color: "#991B1B", margin: "0 0 4px" }}>
                    Tu respuesta: {String.fromCharCode(65 + r)}. {p.opciones[r]}
                  </p>
                )}
                <p style={{ fontSize: 13, color: "#0F6E56", margin: "0 0 6px" }}>
                  Correcta: {String.fromCharCode(65 + p.correcta)}. {p.opciones[p.correcta]}
                </p>
                {p.explicacion && (
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, margin: 0,
                              fontStyle: "italic" }}>
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
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={reiniciar}>
          Hacer otro simulacro
        </button>
      </div>
    </>
  );
}

function Stat({ n, l, c }) {
  return (
    <div style={{
      padding: 14, borderRadius: 10, background: "#fff",
      border: "1px solid #E5E7EB", textAlign: "center",
    }}>
      <p style={{ fontSize: 28, fontWeight: 700, color: c, margin: 0,
                   fontVariantNumeric: "tabular-nums" }}>{n}</p>
      <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>{l}</p>
    </div>
  );
}

export default function Simulacro({ temas, onClose }) {
  const [fase, setFase]           = useState("inicio");
  const [progreso, setProgreso]   = useState(0);
  const [error, setError]         = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [resp, setResp]           = useState({});
  const [marc, setMarc]           = useState(new Set());
  const [actual, setActual]       = useState(0);
  const [time, setTime]           = useState(DURACION_SEG);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const timerRef = useRef(null);
  const finalizarRef = useRef(null);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("simulacros") || "[]");
      setHistorico(h);
    } catch {}
  }, []);

  useEffect(() => {
    if (fase !== "examen") return;
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          finalizarRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [fase]);

  async function iniciar() {
    if (!temas || temas.length === 0) {
      setError("No hay temas en el repositorio para generar preguntas.");
      return;
    }
    setFase("cargando");
    setError(null);
    setProgreso(0);

    try {
      const buckets = Array.from({ length: NUM_LOTES }, () => []);
      shuffle(temas).forEach((t, i) => buckets[i % NUM_LOTES].push(t));

      let done = 0;
      const lotes = await Promise.all(
        buckets.map(async (b) => {
          const arr = b.length > 0 ? await generarLote(b, POR_LOTE) : [];
          done += arr.length;
          setProgreso(done);
          return arr;
        })
      );

      const todas = shuffle(lotes.flat()).slice(0, TOTAL_PREGUNTAS);
      if (todas.length < 50) {
        throw new Error(`Solo se han podido generar ${todas.length} preguntas. Revisa la conexión y vuelve a intentarlo.`);
      }

      setPreguntas(todas);
      setResp({});
      setMarc(new Set());
      setActual(0);
      setTime(DURACION_SEG);
      setFase("examen");
    } catch (e) {
      setError(e.message || "Error generando preguntas.");
      setFase("inicio");
    }
  }

  function elegir(i) {
    setResp(p => ({ ...p, [actual]: i }));
  }

  function marcarRevision() {
    setMarc(m => {
      const n = new Set(m);
      if (n.has(actual)) n.delete(actual); else n.add(actual);
      return n;
    });
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
    const puntos    = ok - err * PENALIZACION;
    const sobre10   = Math.max(0, (puntos / preguntas.length) * 10);
    const aprobado  = sobre10 >= NOTA_APROBADO;

    const porTema = {};
    preguntas.forEach((p, i) => {
      const t = p.tema || "?";
      if (!porTema[t]) porTema[t] = { ok: 0, err: 0, blanco: 0 };
      const r = resp[i];
      if (r === undefined || r === -1) porTema[t].blanco++;
      else if (r === p.correcta) porTema[t].ok++;
      else porTema[t].err++;
    });

    setResultado({ ok, err, blanco, puntos, sobre10, aprobado, porTema });
    setFase("resultado");

    try {
      const h = JSON.parse(localStorage.getItem("simulacros") || "[]");
      h.push({
        fecha: Date.now(),
        ok, err, blanco, sobre10, aprobado,
        tiempoUsado: DURACION_SEG - time,
        porTema,
      });
      localStorage.setItem("simulacros", JSON.stringify(h.slice(-30)));
      setHistorico(h.slice(-30));
    } catch {}
  }
  finalizarRef.current = finalizar;

  function reiniciar() {
    setFase("inicio");
    setResultado(null);
    setPreguntas([]);
    setResp({});
    setMarc(new Set());
    setActual(0);
    setTime(DURACION_SEG);
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {fase === "inicio" && (
          <Inicio onIniciar={iniciar} onClose={onClose}
                  error={error} numTemas={temas.length} historico={historico} />
        )}
        {fase === "cargando" && <Cargando progreso={progreso} />}
        {fase === "examen" && (
          <Examen preguntas={preguntas} actual={actual} setActual={setActual}
                  resp={resp} elegir={elegir} marc={marc} marcarRevision={marcarRevision}
                  time={time} finalizar={finalizar} onClose={onClose} />
        )}
        {fase === "resultado" && (
          <Resultado resultado={resultado} preguntas={preguntas} resp={resp}
                     reiniciar={reiniciar} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

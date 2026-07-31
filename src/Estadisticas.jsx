import { useState, useEffect, useMemo } from "react";

const CAT_COLORS = {
  "Sistemas bibliotecarios": "#0F6E56",
  "Historia del libro":      "#854F0B",
  "Gestión de colecciones":  "#3B6D11",
  "Fuentes de información":  "#185FA5",
  "Marco legal":             "#534AB7",
  "Referencia":              "#5F5E5A",
};

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
    fontSize: 14, fontWeight: 500, cursor: "pointer",
  },
  btnPrimary:   { background: "#0F6E56", color: "#fff" },
  btnSecondary: { background: "#fff", color: "#1A1A1A", borderColor: "#D1D5DB" },
  btnDanger:    { background: "#fff", color: "#991B1B", borderColor: "#FCA5A5" },
  card: {
    background: "#FAFAF7", border: "1px solid #E5E7EB", borderRadius: 12,
    padding: 16, marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: "0 0 12px",
  },
};

function fmtFecha(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function Evolucion({ simulacros }) {
  if (simulacros.length < 2) {
    return (
      <div style={S.card}>
        <p style={S.sectionTitle}>Evolución de tus notas</p>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          Hazte al menos 2 simulacros completos para ver tu evolución.
        </p>
      </div>
    );
  }

  const W = 600, H = 200, PADL = 36, PADR = 12, PADT = 16, PADB = 26;
  const sorted = [...simulacros].sort((a, b) => a.fecha - b.fecha);
  const max = 10;

  const points = sorted.map((s, i) => {
    const x = PADL + (i / Math.max(1, sorted.length - 1)) * (W - PADL - PADR);
    const y = H - PADB - (s.sobre10 / max) * (H - PADT - PADB);
    return { x, y, sobre10: s.sobre10, fecha: s.fecha, aprobado: s.aprobado };
  });

  const path = "M " + points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");

  const yLine = (val) => H - PADB - (val / max) * (H - PADT - PADB);

  return (
    <div style={S.card}>
      <p style={S.sectionTitle}>Evolución de tus notas (sobre 10)</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 5, 10].map(v => (
          <g key={v}>
            <line x1={PADL} y1={yLine(v)} x2={W - PADR} y2={yLine(v)}
                  stroke={v === 5 ? "#FCA5A5" : "#E5E7EB"}
                  strokeDasharray={v === 5 ? "4 4" : "none"}
                  strokeWidth="1" />
            <text x={PADL - 6} y={yLine(v) + 4} textAnchor="end"
                  fontSize="11" fill="#6B7280" fontFamily="monospace">
              {v}
            </text>
          </g>
        ))}
        <text x={W - PADR - 4} y={yLine(5) - 4} textAnchor="end"
              fontSize="9" fill="#991B1B">aprobado</text>

        <path d={path} stroke="#0F6E56" strokeWidth="2" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4"
                    fill={p.aprobado ? "#0F6E56" : "#B91C1C"}
                    stroke="#fff" strokeWidth="2" />
          </g>
        ))}

        {[0, Math.floor(points.length / 2), points.length - 1].map(i => (
          <text key={i} x={points[i].x} y={H - 8} textAnchor="middle"
                fontSize="10" fill="#6B7280">
            {fmtFecha(points[i].fecha)}
          </text>
        ))}
      </svg>
      <p style={{ fontSize: 12, color: "#6B7280", margin: "10px 0 0", textAlign: "center" }}>
        {sorted.length} simulacros · primera: {sorted[0].sobre10.toFixed(1)} · última: {sorted[sorted.length-1].sobre10.toFixed(1)}
      </p>
    </div>
  );
}

function PorCategoria({ categorias }) {
  if (categorias.length === 0) {
    return (
      <div style={S.card}>
        <p style={S.sectionTitle}>Acierto por categoría</p>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          Sin datos suficientes todavía.
        </p>
      </div>
    );
  }

  return (
    <div style={S.card}>
      <p style={S.sectionTitle}>Acierto por categoría</p>
      {categorias.map(c => {
        const color = CAT_COLORS[c.cat] || "#6B7280";
        const danger = c.pct < 50;
        return (
          <div key={c.cat} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{c.cat}</span>
              <span style={{ color: danger ? "#991B1B" : color, fontWeight: 600,
                              fontVariantNumeric: "tabular-nums" }}>
                {c.pct.toFixed(0)}% · {c.total} preguntas
              </span>
            </div>
            <div style={{ height: 10, background: "#F1EFE8", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${c.pct}%`,
                background: danger ? "#B91C1C" : color,
                transition: "width .4s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TemasDebiles({ temas, onRepasar }) {
  if (temas.length === 0) {
    return (
      <div style={S.card}>
        <p style={S.sectionTitle}>Tus puntos débiles</p>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          Necesitas al menos 3 preguntas respondidas por tema para detectar puntos débiles.
        </p>
      </div>
    );
  }

  return (
    <div style={S.card}>
      <p style={S.sectionTitle}>Tus puntos débiles · estos son los temas a los que dedicar más tiempo</p>
      {temas.map(t => {
        const color = CAT_COLORS[t.categoria] || "#6B7280";
        return (
          <div key={t.num} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: 12, background: "#fff", border: "1px solid #FCA5A5",
            borderRadius: 10, marginBottom: 8, gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 99,
                  background: "#FEE2E2", color: "#991B1B", fontWeight: 600,
                }}>
                  {t.pct.toFixed(0)}% · {t.total} preguntas
                </span>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 99,
                  background: "#fff", color, border: `1px solid ${color}33`,
                }}>
                  {t.categoria}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#1A1A1A", margin: 0, fontWeight: 500,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Tema {t.num} · {t.titulo}
              </p>
            </div>
            <button
              onClick={() => onRepasar(t.num)}
              style={{
                ...S.btn, ...S.btnPrimary, fontSize: 12, padding: "8px 14px",
                flexShrink: 0,
              }}>
              Repasar →
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Estadisticas({ temas, onClose, onRepasarTema }) {
  const [simulacros, setSimulacros] = useState([]);
  const [practicas, setPracticas]   = useState([]);

  useEffect(() => {
    try {
      setSimulacros(JSON.parse(localStorage.getItem("simulacros") || "[]"));
      setPracticas(JSON.parse(localStorage.getItem("practicas") || "[]"));
    } catch {}
  }, []);

  const stats = useMemo(() => {
    const numSim  = simulacros.length;
    const numPrac = practicas.length;
    if (numSim === 0 && numPrac === 0) return null;

    const notaMedia = numSim > 0
      ? simulacros.reduce((a, s) => a + s.sobre10, 0) / numSim
      : 0;
    const aprobados = simulacros.filter(s => s.aprobado).length;

    let tendencia = null;
    if (numSim >= 4) {
      const recent = simulacros.slice(-3);
      const previous = simulacros.slice(-Math.min(6, numSim), -3);
      if (previous.length > 0) {
        const avgR = recent.reduce((a, s) => a + s.sobre10, 0) / recent.length;
        const avgP = previous.reduce((a, s) => a + s.sobre10, 0) / previous.length;
        tendencia = avgR - avgP;
      }
    }

    const cats = {};
    simulacros.forEach(s => {
      if (!s.porTema) return;
      Object.entries(s.porTema).forEach(([numTema, c]) => {
        const tema = temas.find(t => t.n === numTema);
        if (!tema) return;
        const cat = tema.cat;
        if (!cats[cat]) cats[cat] = { ok: 0, total: 0 };
        cats[cat].ok += c.ok;
        cats[cat].total += c.ok + c.err + c.blanco;
      });
    });
    practicas.forEach(p => {
      const cat = p.categoria;
      if (!cat) return;
      if (!cats[cat]) cats[cat] = { ok: 0, total: 0 };
      cats[cat].ok += p.aciertos;
      cats[cat].total += p.total;
    });
    const catsArr = Object.entries(cats)
      .map(([cat, c]) => ({
        cat, total: c.total,
        pct: c.total > 0 ? c.ok / c.total * 100 : 0,
      }))
      .sort((a, b) => a.pct - b.pct);

    const temasMap = {};
    simulacros.forEach(s => {
      if (!s.porTema) return;
      Object.entries(s.porTema).forEach(([numTema, c]) => {
        if (!temasMap[numTema]) temasMap[numTema] = { ok: 0, total: 0 };
        temasMap[numTema].ok += c.ok;
        temasMap[numTema].total += c.ok + c.err + c.blanco;
      });
    });
    practicas.forEach(p => {
      const num = p.numeroTema;
      if (!num) return;
      if (!temasMap[num]) temasMap[num] = { ok: 0, total: 0 };
      temasMap[num].ok += p.aciertos;
      temasMap[num].total += p.total;
    });

    const temasArr = Object.entries(temasMap)
      .map(([num, c]) => {
        const tema = temas.find(t => t.n === num);
        if (!tema) return null;
        return {
          num,
          titulo: tema.titulo,
          categoria: tema.cat,
          total: c.total,
          pct: c.total > 0 ? c.ok / c.total * 100 : 0,
        };
      })
      .filter(t => t && t.total >= 3)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);

    return { numSim, numPrac, notaMedia, aprobados, tendencia, catsArr, temasArr };
  }, [simulacros, practicas, temas]);

  function borrarHistorial() {
    if (!confirm("¿Borrar todo el historial de simulacros y prácticas? Esta acción no se puede deshacer.")) return;
    localStorage.removeItem("simulacros");
    localStorage.removeItem("practicas");
    setSimulacros([]);
    setPracticas([]);
  }

  function handleRepasar(numTema) {
    onRepasarTema(numTema);
    onClose();
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <h2 style={S.title}>📊 Mi progreso</h2>
          <button style={{ ...S.btn, ...S.btnSecondary }} onClick={onClose}>Cerrar</button>
        </div>

        <div style={S.body}>
          {!stats ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 15, color: "#1A1A1A", fontWeight: 500, margin: "0 0 6px" }}>
                Aún no tienes resultados guardados.
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                Haz un simulacro completo o practica algún tema desde la app
                <br />y aquí verás tu evolución, debilidades por categoría y los temas a reforzar.
              </p>
            </div>
          ) : (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10, marginBottom: 16,
              }}>
                <Card v={stats.numSim} l="Simulacros" sub={`${stats.aprobados} aprobados`} />
                <Card v={stats.numPrac} l="Prácticas" sub="por tema" />
                <Card v={stats.notaMedia.toFixed(2)} l="Nota media" sub="sobre 10"
                       danger={stats.numSim > 0 && stats.notaMedia < 5} />
                {stats.tendencia !== null && (
                  <Card
                    v={(stats.tendencia >= 0 ? "+" : "") + stats.tendencia.toFixed(2)}
                    l="Tendencia"
                    sub="últimos 3 vs anteriores"
                    color={stats.tendencia >= 0 ? "#0F6E56" : "#991B1B"}
                  />
                )}
              </div>

              {stats.numSim >= 2 && stats.notaMedia < 5 && (
                <div style={{
                  padding: 14, marginBottom: 16, borderRadius: 10,
                  background: "#FEE2E2", border: "1px solid #FCA5A5",
                  fontSize: 13, color: "#7F1D1D", lineHeight: 1.5,
                }}>
                  <strong>Por debajo de aprobado.</strong> Concentra tu estudio en los puntos débiles
                  de abajo: practicar específicamente esos temas es lo que más sube la nota a corto plazo.
                </div>
              )}

              <Evolucion simulacros={simulacros} />
              <PorCategoria categorias={stats.catsArr} />
              <TemasDebiles temas={stats.temasArr} onRepasar={handleRepasar} />
            </>
          )}
        </div>

        <div style={S.footer}>
          {stats ? (
            <button style={{ ...S.btn, ...S.btnDanger, fontSize: 13 }} onClick={borrarHistorial}>
              Borrar historial
            </button>
          ) : <span />}
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function Card({ v, l, sub, color, danger }) {
  const c = danger ? "#991B1B" : (color || "#1A1A1A");
  return (
    <div style={{
      padding: 14, borderRadius: 10, background: "#fff",
      border: "1px solid #E5E7EB", textAlign: "center",
    }}>
      <p style={{ fontSize: 24, fontWeight: 700, color: c, margin: 0,
                   fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{v}</p>
      <p style={{ fontSize: 12, color: "#374151", margin: "4px 0 0", fontWeight: 500 }}>{l}</p>
      {sub && <p style={{ fontSize: 11, color: "#6B7280", margin: "1px 0 0" }}>{sub}</p>}
    </div>
  );
}

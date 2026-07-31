import { useState, useMemo } from "react";
import Simulacro from "./Simulacro";
import Estadisticas from "./Estadisticas";
const API_URL = "/.netlify/functions/claude";

const DOC_META = {
  desarrollo:   { label:"Desarrollo",   bg:"#E1F5EE", text:"#0F6E56", border:"#9FE1CB" },
  epigrafe:     { label:"Epígrafe",     bg:"#E6F1FB", text:"#185FA5", border:"#B5D4F4" },
  preguntas:    { label:"Preguntas",    bg:"#FAEEDA", text:"#854F0B", border:"#FAC775" },
  cuestionario: { label:"Cuestionario", bg:"#EEEDFE", text:"#534AB7", border:"#CECBF6" },
};

const CAT_COLORS = {
  "Sistemas bibliotecarios": { bg:"#E1F5EE", text:"#0F6E56",  border:"#9FE1CB" },
  "Historia del libro":       { bg:"#FAEEDA", text:"#854F0B",  border:"#FAC775" },
  "Gestión de colecciones":   { bg:"#EAF3DE", text:"#3B6D11",  border:"#C0DD97" },
  "Fuentes de información":   { bg:"#E6F1FB", text:"#185FA5",  border:"#B5D4F4" },
  "Marco legal":              { bg:"#EEEDFE", text:"#534AB7",  border:"#CECBF6" },
  "Referencia":               { bg:"#F1EFE8", text:"#5F5E5A",  border:"#D3D1C7" },
};
const CATS = ["Todas","Sistemas bibliotecarios","Historia del libro","Gestión de colecciones","Fuentes de información","Marco legal"];

const TEMAS = [
  { id:"t0",  n:"0",  cat:"Gestión de colecciones",   titulo:"ISOs y normas internacionales en bibliotecas",
    docs:{ desarrollo:  "1upy9QwfytzKW58oEbwJqnhd3E78nMT5V" }},
  { id:"t1",  n:"1",  cat:"Sistemas bibliotecarios",   titulo:"Biblioteca Nacional de España (BNE)",
    docs:{ desarrollo:  "1Q4bG91ftdFIJcoi9AbpOsRQSe4oSDBAi",
           epigrafe:    "1UocxgAeKtCd8H7twOKRl8Mm3tpevmFUX",
           preguntas:   "1AnRyAfJ0-xDjktpinSrhnING2CaQCWP6" }},
  { id:"t4",  n:"4",  cat:"Sistemas bibliotecarios",   titulo:"Catálogo Colectivo de la Biblioteca (CCB)",
    docs:{ desarrollo:  "1_TwzP4HbzNPS53I0-SvTKGFuiUwtfSxm" }},
  { id:"t5",  n:"5",  cat:"Sistemas bibliotecarios",   titulo:"Bibliotecas Públicas del Estado. Bibliotecas especializadas",
    docs:{ desarrollo:  "1zSM0T3FYxmocJhR2-FOgngjEFnDKi72m",
           epigrafe:    "1IgdQwIdcpHpX317ixSkzE5q10iZ1K-d7" }},
  { id:"t12", n:"12", cat:"Gestión de colecciones",   titulo:"Selección y adquisición de fondos bibliográficos",
    docs:{ cuestionario:"1-_PxuD4cpfJU8G3LA39iruECFg3z68je" }},
  { id:"t14", n:"14", cat:"Gestión de colecciones",   titulo:"Proceso técnico: registro, sellado, tejuelas y signaturación",
    docs:{ cuestionario:"1vgbuMKm-L5Y3WdkRlMknDNGr8Fmnw4k7" }},
  { id:"t15", n:"15", cat:"Gestión de colecciones",   titulo:"Proceso técnico de ordenación de fondos y gestión de los depósitos. Recuentos",
    docs:{ cuestionario:"1ZRz5hFT4Mu7v0XQlbfryWtWd_qGfCvui" }},
  { id:"t16", n:"16", cat:"Sistemas bibliotecarios",  titulo:"Concepto, función y tipología de las bibliotecas",
    docs:{ desarrollo:  "11-hw1WGHeAQDWZv-a4hTbn-vGVfNWZDF" }},
  { id:"t17", n:"17", cat:"Sistemas bibliotecarios",  titulo:"Bibliotecas Nacionales. Premios literarios",
    docs:{ epigrafe:    "1pCqmeNuHJUw-nsnV7PxpxBG_zbjFNRYU" }},
  { id:"t18", n:"18", cat:"Sistemas bibliotecarios",  titulo:"Ministerio de Cultura. Bibliotecas Públicas",
    docs:{ desarrollo:  "18kCN_4UqQ-UvKZ4ZW_qou4GpPMw4yYmT" }},
  { id:"t23", n:"23", cat:"Fuentes de información",   titulo:"Bibliografías. Bibliografías nacionales",
    docs:{ desarrollo:  "1CXp08r90oY0jCfNNQ5KBvmWdmFxS1xSC",
           epigrafe:    "14Zyjf9DErncRfBQQsqsvhc_oDVvKqCfg",
           preguntas:   "19olaxBrxzm_YH9h1sib5eKElxAztYmlp",
           cuestionario:"18Cp0wbAe_-Br1CU4IUnzMYdIXJ_dPzrM" }},
  { id:"t25", n:"25", cat:"Gestión de colecciones",   titulo:"Preservación y conservación del fondo bibliográfico y documental",
    docs:{ desarrollo:  "1OTMIsOjDZt8qqbBAsN9Qs2N7uBdchcbs",
           epigrafe:    "1_uIe8aeo6uUHR2n-R9RC8epnpRHBlEns",
           preguntas:   "129U581Fcl1yCEWPv8qXGQOnKjF5NURxo",
           cuestionario:"1P14O9DN85g1brzkHtwc8sAxGDWXA0ZZ-" }},
  { id:"t30", n:"30", cat:"Gestión de colecciones",   titulo:"Proceso técnico de ordenación de fondos y gestión de los depósitos. Recuentos",
    docs:{ desarrollo:  "1s5gohls8mT9qnF70WAgfcnBasoqHVOi0",
           epigrafe:    "1gcjPQzfeq8JXNmyQEO95cyl8l05HwIt0",
           preguntas:   "159i32Nb2EyyvAul-iDAyyPCN6EmE9-SD",
           cuestionario:"1ZRz5hFT4Mu7v0XQlbfryWtWd_qGfCvui" }},
  { id:"t42", n:"42", cat:"Sistemas bibliotecarios",  titulo:"Cooperación bibliotecaria: organismos y proyectos",
    docs:{ desarrollo:  "18w0oaWh9g_zhbB15kMrvT318TOse_Iee",
           epigrafe:    "1dHoxfFaO2-GSJFkjelxdgpnPSTAQ3gOs",
           preguntas:   "1faSxPC9KxUdsoD3DeP_a9mkARlfWw0E1" }},
  { id:"t48", n:"48", cat:"Historia del libro",        titulo:"El libro hasta la invención de la imprenta",
    docs:{ desarrollo:  "1-mlWWKi6UzfhOa7kTf9OCVlZ2TikG23_" }},
  { id:"t49", n:"49", cat:"Historia del libro",        titulo:"La invención de la imprenta",
    docs:{ desarrollo:  "1dn1RdPjZUyMFyjZ7VkFQJK7SPUGqyb9D" }},
  { id:"t55", n:"55", cat:"Historia del libro",        titulo:"El libro en los siglos XVIII, XIX y XX",
    docs:{ desarrollo:  "1wpP0KpZCkHYnBycJI8SzOaDQK8mBgkss" }},
];

const REFS = [
  { g:"Exámenes",     id:"1-wQR721vd2RaxFhE3o0QjsYTWRbZhe8R", t:"Examen oficial — Modelo A (Turno libre)" },
  { g:"Exámenes",     id:"17GIID8MlXsl1LDXpi0719JOT6rKDrrTd", t:"Examen oficial — Modelo B (Turno libre)" },
  { g:"Exámenes",     id:"1TdR5KvuWP3CRNCdHRTEL7GfWi4I8NmDd", t:"Simulacros — Preguntas + Respuestas" },
  { g:"Exámenes",     id:"1ymBjNC5Yw2W2T8fVSmuNeGe7PHPtyvbh", t:"Plantilla test auténtica de oposiciones" },
  { g:"Instituciones",id:"1zUK7pMd-Nc6wBdohZJghRteFAcNLsG-o", t:"Documento general: Ministerio y organismos" },
  { g:"Instituciones",id:"1GZMXNmJgIQzi8CR1dwaq6kLTfw9u8ywc", t:"Organigrama Ministerio de Cultura" },
  { g:"Marco legal",  id:"1-3KLdMOCrPnKb08etlQuZsNXHmcJgRAz", t:"BOE-A-2007-6115 · Ley 10/2007 Lectura, Libro y Bibliotecas" },
  { g:"Marco legal",  id:"1R74cdo-hkBds7tS26rRkkCCu8ibtLdZg", t:"BOE-A-2015-3178" },
  { g:"Marco legal",  id:"14iHrcepESyt-SCr33c0Zke6JlIA8vQYx", t:"Ley de Propiedad Intelectual 2025" },
  { g:"Marco legal",  id:"13g-ruNyLeqtkyjZCzslYxAfcTLn_bWvd", t:"¿Qué sabemos de propiedad intelectual?" },
  { g:"Marco legal",  id:"1WGUIWK7buqpgFjlkRdpEacyLeh33rxdl", t:"Ley Orgánica Violencia de Género" },
  { g:"Marco legal",  id:"1bW3A82ZhKf9yTzkEXDIOpdAc5DImuumm", t:"Ley de Dependencia" },
  { g:"Marco legal",  id:"15lOTAl-KhYs6VB0QtkP_tla_G61zAi6T", t:"Políticas de discapacidad" },
  { g:"Marco legal",  id:"1AjwjTih7Y85FeqkcCFSJrhkz0Sbm4sBT", t:"Ley Trans 2023" },
  { g:"Marco legal",  id:"1G3yZKETqwaTnNlQd9ClUF4I6nkpduu2M", t:"Unidades de Igualdad" },
  { g:"Bibliografía", id:"1sE_TChuLCutzmYd6ccF_40FTl9VuT1Cs", t:"Partes del libro" },
  { g:"Bibliografía", id:"1TH77nNK2q-10fDbJWyOXT-gAL6ihAluR", t:"Ejemplo orden CDU" },
  { g:"Bibliografía", id:"1Ns9TgqtW5Bp7ZGmUU3Q_3Ibkov1sqqcy", t:"Historia del libro — Svend Dahl" },
  { g:"Bibliografía", id:"12ufFrX9fu7OVfTb9knhD22jltUYUCpJ_", t:"De la arcilla al E-book — Novelle López" },
  { g:"Bibliografía", id:"1jxUMperii5I2ZO7o4ObIKeQNliDtmuZ9", t:"Pautas para bibliotecas rurales de pequeño tamaño (IFLA)" },
  { g:"Bibliografía", id:"1pJMH7QE3_9l4T_1x9x8rC3t7V6-U2t6G", t:"Guía: Proyectos de digitalización del patrimonio" },
  { g:"Estadísticas", id:"1qg3VGKuV90Rix8sBsfZzH83iJmV0kPx7", t:"Síntesis de resultados 2024-2025" },
  { g:"Estadísticas", id:"1Pv6gsR1RidFEHXbr9oVKdieIFlyanT6d", t:"Resumen ejecutivo Plan DDCC" },
];

async function askClaude(prompt) {
  const headers = {
    "Content-Type": "application/json",
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("API " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
}

function tryJSON(txt) {
  const c = txt.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try { return JSON.parse(c); } catch {}
  const m = c.match(/\[[\s\S]*\]/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return null;
}

function driveUrl(id) { return `https://drive.google.com/file/d/${id}/view`; }

function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: "2px solid #E1F5EE", borderTopColor: "#0F6E56",
      borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0
    }} />
  );
}

function PracticaMode({ tema, onClose }) {
  const [fase, setFase] = useState("loading");
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);

  useState(() => {
    generarPreguntas();
  }, []);

  async function generarPreguntas() {
    setFase("loading");
    try {
      const txt = await askClaude(
        `Eres un experto en oposiciones a Auxiliar de Biblioteca del Estado (Ministerio de Cultura, España).
Genera 5 preguntas tipo test sobre el tema: "${tema.titulo}".
Cada pregunta debe tener 4 opciones (A, B, C, D) con solo una correcta.
Basa las preguntas en contenido real de las oposiciones españolas de bibliotecas.
Responde SOLO con un array JSON con este formato exacto:
[
  {
    "pregunta": "texto de la pregunta",
    "opciones": ["opción A", "opción B", "opción C", "opción D"],
    "correcta": 0,
    "explicacion": "breve explicación de por qué es correcta"
  }
]
El campo "correcta" es el índice (0-3) de la opción correcta. Sin markdown, sin explicación extra.`
      );
      const parsed = tryJSON(txt);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPreguntas(parsed);
        setFase("test");
      } else {
        throw new Error("No se pudieron generar preguntas");
      }
    } catch (e) {
      setFase("error");
    }
  }

  function seleccionar(pregIdx, opcionIdx) {
    if (resultado !== null) return;
    setRespuestas(p => ({ ...p, [pregIdx]: opcionIdx }));
  }

  function corregir() {
    const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length;
    setResultado(aciertos);
    setFase("resultado");
    try {
      const h = JSON.parse(localStorage.getItem("practicas") || "[]");
      h.push({
        fecha: Date.now(),
        numeroTema: tema.n,
        tituloTema: tema.titulo,
        categoria: tema.cat,
        aciertos,
        total: preguntas.length,
      });
      localStorage.setItem("practicas", JSON.stringify(h.slice(-100)));
    } catch {}
  }

  const todasRespondidas = preguntas.length > 0 && Object.keys(respuestas).length === preguntas.length;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:"var(--border-radius-lg)", width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding:"16px 20px", borderBottom:"0.5px solid var(--color-border-tertiary)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"var(--color-background-primary)", zIndex:1 }}>
          <div>
            <p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:"0 0 2px" }}>Modo práctica · Tema {tema.n}</p>
            <p style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", margin:0, lineHeight:1.3 }}>{tema.titulo}</p>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>×</button>
        </div>

        <div style={{ padding:"20px" }}>
          {fase === "loading" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"32px 0" }}>
              <Spinner size={28} />
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:0 }}>Generando preguntas de examen...</p>
            </div>
          )}

          {fase === "error" && (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 14px" }}>No se pudieron generar las preguntas.</p>
              <button onClick={generarPreguntas} style={{ padding:"8px 18px", background:"#0F6E56", color:"white", border:"none", borderRadius:"var(--border-radius-md)", fontSize:13, cursor:"pointer" }}>Reintentar</button>
            </div>
          )}

          {fase === "resultado" && (
            <div style={{ marginBottom:20 }}>
              <div style={{
                padding:"16px 20px", borderRadius:"var(--border-radius-lg)", marginBottom:20, textAlign:"center",
                background: resultado >= 4 ? "#E1F5EE" : resultado >= 3 ? "#FAEEDA" : "#FCEBEB",
                border: `0.5px solid ${resultado >= 4 ? "#9FE1CB" : resultado >= 3 ? "#FAC775" : "#F5AAAA"}`
              }}>
                <p style={{ fontSize:28, fontWeight:600, margin:"0 0 4px", color: resultado >= 4 ? "#0F6E56" : resultado >= 3 ? "#854F0B" : "#D63939" }}>
                  {resultado}/5
                </p>
                <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:0 }}>
                  {resultado === 5 ? "¡Perfecto! Dominas este tema" : resultado >= 4 ? "¡Muy bien!" : resultado >= 3 ? "Bien, pero repasa algunos puntos" : "Necesitas repasar este tema"}
                </p>
              </div>
            </div>
          )}

          {(fase === "test" || fase === "resultado") && preguntas.map((p, i) => {
            const respuesta = respuestas[i];
            const esCorrecta = respuesta === p.correcta;
            const mostrarResultado = fase === "resultado";
            return (
              <div key={i} style={{ marginBottom:20, padding:"14px 16px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)" }}>
                <p style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", margin:"0 0 12px", lineHeight:1.4 }}>
                  <span style={{ color:"#0F6E56", marginRight:6 }}>{i+1}.</span>{p.pregunta}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {p.opciones.map((op, j) => {
                    let bg = "var(--color-background-primary)";
                    let border = "0.5px solid var(--color-border-tertiary)";
                    let color = "var(--color-text-primary)";
                    if (mostrarResultado) {
                      if (j === p.correcta) { bg="#E1F5EE"; border="0.5px solid #9FE1CB"; color="#0F6E56"; }
                      else if (j === respuesta && !esCorrecta) { bg="#FCEBEB"; border="0.5px solid #F5AAAA"; color="#D63939"; }
                    } else if (respuesta === j) {
                      bg="var(--color-background-tertiary)"; border="0.5px solid #0F6E56";
                    }
                    return (
                      <div key={j} onClick={() => seleccionar(i, j)} style={{
                        padding:"8px 12px", borderRadius:"var(--border-radius-md)", cursor: mostrarResultado ? "default" : "pointer",
                        background:bg, border, color, fontSize:12, lineHeight:1.4,
                        display:"flex", alignItems:"center", gap:8,
                      }}>
                        <span style={{ flexShrink:0, width:18, height:18, borderRadius:"50%", border:"1px solid currentColor", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:500 }}>
                          {String.fromCharCode(65+j)}
                        </span>
                        {op}
                      </div>
                    );
                  })}
                </div>
                {mostrarResultado && (
                  <p style={{ fontSize:11, color:"var(--color-text-secondary)", margin:"10px 0 0", padding:"8px 10px", background:"var(--color-background-primary)", borderRadius:"var(--border-radius-md)", lineHeight:1.5 }}>
                    💡 {p.explicacion}
                  </p>
                )}
              </div>
            );
          })}

          {fase === "test" && (
            <button onClick={corregir} disabled={!todasRespondidas} style={{
              width:"100%", padding:"10px 14px", background: todasRespondidas ? "#0F6E56" : "var(--color-background-secondary)",
              color: todasRespondidas ? "white" : "var(--color-text-tertiary)",
              border: todasRespondidas ? "none" : "0.5px solid var(--color-border-tertiary)",
              borderRadius:"var(--border-radius-md)", fontSize:13, fontWeight:500, cursor: todasRespondidas ? "pointer" : "default"
            }}>
              {todasRespondidas ? "Ver resultados" : `Responde todas las preguntas (${Object.keys(respuestas).length}/5)`}
            </button>
          )}

          {fase === "resultado" && (
            <div style={{ display:"flex", gap:9 }}>
              <button onClick={() => { setRespuestas({}); setResultado(null); generarPreguntas(); }} style={{ flex:1, padding:"9px 14px", background:"#0F6E56", color:"white", border:"none", borderRadius:"var(--border-radius-md)", fontSize:13, fontWeight:500, cursor:"pointer" }}>
                Nuevo test
              </button>
              <button onClick={onClose} style={{ padding:"9px 14px", fontSize:13, borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [sel, setSel]        = useState({ type:"tema", item: TEMAS[10] });
  const [dt,  setDt]         = useState("desarrollo");
  const [q,   setQ]          = useState("");
  const [cat, setCat]        = useState("Todas");
  const [tab, setTab]        = useState("temas");
  const [kpCache, setKp]     = useState({});
  const [busy, setBusy]      = useState({});
  const [practica, setPractica] = useState(null);
  const [showSimulacro, setShowSimulacro] = useState(false);
  const [showStats, setShowStats] = useState(false);

  function selectTema(t) {
    const first = Object.keys(t.docs)[0];
    setSel({ type:"tema", item:t }); setDt(first);
  }
  function selectRef(r) { setSel({ type:"ref", item:r }); }
  function switchDt(d)  { setDt(d); }

  function handleRepasarTema(numTema) {
    const t = TEMAS.find(x => x.n === numTema);
    if (t) {
      setTab("temas");
      setCat("Todas");
      setQ("");
      selectTema(t);
    }
  }

  async function genKP() {
    const isRef  = sel.type === "ref";
    const titulo = isRef ? sel.item.t : sel.item.titulo;
    const tipo   = isRef ? "documento de referencia" : `apunte — ${DOC_META[dt]?.label || dt}`;
    const key    = isRef ? `kp_r_${sel.item.id}` : `kp_${sel.item.id}_${dt}`;
    if (kpCache[key] || busy[key]) return;
    setBusy(p => ({ ...p, [key]: true }));
    try {
      const txt = await askClaude(
        `Eres experto en oposiciones a Auxiliar de Biblioteca del Estado (Ministerio de Cultura, España).
Documento: "${titulo}" (${tipo}).
Extrae 7 puntos clave de estudio en español, máximo 140 caracteres cada uno.
Prioriza: definiciones exactas, leyes/normas con número y año, datos concretos (fechas, temperaturas, %, lux), organismos, procedimientos.
Responde SOLO con un array JSON: ["punto1","punto2",...]. Sin markdown, sin explicación.`
      );
      const pts = tryJSON(txt);
      setKp(p => ({ ...p, [key]: Array.isArray(pts) ? pts : [txt] }));
    } catch(e) {
      setKp(p => ({ ...p, [key]: ["Error: " + e.message] }));
    } finally { setBusy(p => ({ ...p, [key]: false })); }
  }

  const fTemas = useMemo(() => TEMAS.filter(t => {
    const bq = q.toLowerCase();
    return (!bq || t.titulo.toLowerCase().includes(bq) || t.n.includes(bq))
      && (cat === "Todas" || t.cat === cat);
  }), [q, cat]);

  const fRefs = useMemo(() => {
    const bq = q.toLowerCase();
    const filtered = !bq ? REFS : REFS.filter(r => r.t.toLowerCase().includes(bq));
    const groups = {};
    filtered.forEach(r => { (groups[r.g] = groups[r.g] || []).push(r); });
    return groups;
  }, [q]);

  const isRef  = sel?.type === "ref";
  const cc     = isRef ? CAT_COLORS["Referencia"] : (CAT_COLORS[sel?.item?.cat] || CAT_COLORS["Gestión de colecciones"]);
  const kpKey  = isRef ? `kp_r_${sel?.item?.id}` : `kp_${sel?.item?.id}_${dt}`;
  const kp     = kpCache[kpKey] || [];
  const isKpL  = !!busy[kpKey];
  const fileId = isRef ? sel?.item?.id : sel?.item?.docs?.[dt];

  const temasParaSimulacro = TEMAS.map(t => ({ numero: t.n, titulo: t.titulo }));

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .sr-only { position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0); }
      `}</style>

      {practica && <PracticaMode tema={practica} onClose={() => setPractica(null)} />}
      {showSimulacro && <Simulacro temas={temasParaSimulacro} onClose={() => setShowSimulacro(false)} />}
      {showStats && <Estadisticas temas={TEMAS} onClose={() => setShowStats(false)} onRepasarTema={handleRepasarTema} />}

      <div style={{ fontFamily:"var(--font-sans)", background:"var(--color-background-tertiary)", minHeight:"100vh" }}>

        <div style={{ background:"var(--color-background-primary)", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"10px 16px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:28, borderRadius:6, background:"#0F6E56", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="12" rx="1" fill="white" opacity=".9"/>
              <rect x="9" y="2" width="5" height="12" rx="1" fill="white" opacity=".6"/>
            </svg>
          </div>
          <span style={{ fontWeight:500, fontSize:14, color:"var(--color-text-primary)", flexShrink:0 }}>MisOpos</span>
          <span style={{ fontSize:11, color:"var(--color-text-secondary)", background:"var(--color-background-secondary)", padding:"2px 8px", borderRadius:20, border:"0.5px solid var(--color-border-tertiary)", flexShrink:0 }}>
            Bibliotecas del Estado
          </span>
          <div style={{ flex:1, position:"relative" }}>
            <svg style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", opacity:.4, pointerEvents:"none" }} width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Buscar tema o documento..." value={q} onChange={e => setQ(e.target.value)}
              style={{ width:"100%", paddingLeft:30, fontSize:13 }}/>
          </div>
          <span style={{ fontSize:12, color:"var(--color-text-secondary)", flexShrink:0 }}>{fTemas.length} temas</span>
          <button
            onClick={() => setShowStats(true)}
            style={{ flexShrink:0, padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:500, background:"#fff", color:"#0F6E56", border:"1px solid #9FE1CB", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            📊 Mi progreso
          </button>
          <button
            onClick={() => setShowSimulacro(true)}
            style={{ flexShrink:0, padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500, background:"#0F6E56", color:"white", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            🎯 Simulacro
          </button>
        </div>

        <div style={{ background:"var(--color-background-primary)", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"7px 16px", display:"flex", gap:6, overflowX:"auto" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ flexShrink:0, padding:"3px 11px", borderRadius:20, fontSize:11,
              background: cat===c ? "#0F6E56" : "var(--color-background-secondary)",
              color:       cat===c ? "white"   : "var(--color-text-secondary)",
              border:      cat===c ? "0.5px solid #0F6E56" : "0.5px solid var(--color-border-tertiary)" }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"264px minmax(0,1fr)", minHeight:"calc(100vh - 97px)" }}>

          <div style={{ borderRight:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", overflowY:"auto" }}>
            <div style={{ display:"flex", borderBottom:"0.5px solid var(--color-border-tertiary)", position:"sticky", top:0, background:"var(--color-background-primary)", zIndex:1 }}>
              {[["temas","Temas ("+TEMAS.length+")"],["ref","Documentos"]].map(([s,lbl]) => (
                <button key={s} onClick={() => setTab(s)} style={{ flex:1, padding:"8px 0", fontSize:12, cursor:"pointer", background:"transparent", border:"none",
                  borderBottom: tab===s ? "2px solid #0F6E56" : "2px solid transparent",
                  color:        tab===s ? "#0F6E56"           : "var(--color-text-secondary)",
                  fontWeight:   tab===s ? 500 : 400 }}>
                  {lbl}
                </button>
              ))}
            </div>

            {tab === "temas" && (fTemas.length === 0
              ? <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--color-text-tertiary)", fontSize:13 }}>Sin resultados</div>
              : fTemas.map(t => {
                const cc2   = CAT_COLORS[t.cat] || CAT_COLORS["Gestión de colecciones"];
                const active = sel?.type === "tema" && sel.item.id === t.id;
                return (
                  <div key={t.id} onClick={() => selectTema(t)} style={{ padding:"10px 13px", cursor:"pointer",
                    borderBottom:"0.5px solid var(--color-border-tertiary)",
                    borderLeft: active ? "3px solid #0F6E56" : "3px solid transparent",
                    background: active ? "var(--color-background-secondary)" : "transparent",
                    display:"flex", gap:9, alignItems:"flex-start" }}>
                    <span style={{ flexShrink:0, width:26, height:26, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:500,
                      background: active ? "#0F6E56" : "var(--color-background-secondary)",
                      color:       active ? "white"   : "var(--color-text-secondary)",
                      border:      active ? "none"    : "0.5px solid var(--color-border-tertiary)" }}>
                      {t.n}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:"0 0 5px", fontSize:12, fontWeight:active?500:400, color:"var(--color-text-primary)", lineHeight:1.35,
                        overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                        {t.titulo}
                      </p>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, padding:"1px 6px", borderRadius:8, background:cc2.bg, color:cc2.text, border:`0.5px solid ${cc2.border}` }}>{t.cat}</span>
                        {Object.keys(t.docs).map(d => {
                          const m = DOC_META[d];
                          return <span key={d} style={{ fontSize:10, padding:"1px 6px", borderRadius:8, background:m?.bg, color:m?.text, border:`0.5px solid ${m?.border}` }}>{m?.label}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {tab === "ref" && (Object.keys(fRefs).length === 0
              ? <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--color-text-tertiary)", fontSize:13 }}>Sin resultados</div>
              : Object.entries(fRefs).map(([g, items]) => (
                <div key={g}>
                  <div style={{ padding:"6px 13px 4px", fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:".05em", background:"var(--color-background-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                    {g}
                  </div>
                  {items.map(r => {
                    const active = sel?.type === "ref" && sel.item.id === r.id;
                    return (
                      <div key={r.id} onClick={() => selectRef(r)} style={{ padding:"9px 13px", cursor:"pointer",
                        borderBottom:"0.5px solid var(--color-border-tertiary)",
                        borderLeft: active ? "3px solid #0F6E56" : "3px solid transparent",
                        background: active ? "var(--color-background-secondary)" : "transparent",
                        display:"flex", gap:8, alignItems:"center" }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0 }}>
                          <rect x="1" y="1" width="10" height="10" rx="1" stroke={active?"#0F6E56":"var(--color-text-tertiary)"} strokeWidth="1.2"/>
                          <line x1="3" y1="4" x2="9" y2="4" stroke={active?"#0F6E56":"var(--color-text-tertiary)"} strokeWidth="1.2"/>
                          <line x1="3" y1="6" x2="9" y2="6" stroke={active?"#0F6E56":"var(--color-text-tertiary)"} strokeWidth="1.2"/>
                          <line x1="3" y1="8" x2="7" y2="8" stroke={active?"#0F6E56":"var(--color-text-tertiary)"} strokeWidth="1.2"/>
                        </svg>
                        <p style={{ margin:0, fontSize:12, fontWeight:active?500:400, color:"var(--color-text-primary)", lineHeight:1.35,
                          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                          {r.t}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div style={{ overflowY:"auto", padding:18 }}>
            {!sel ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, color:"var(--color-text-tertiary)", fontSize:13 }}>
                Selecciona un tema de la lista
              </div>
            ) : (
              <>
                <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px 18px", marginBottom:12 }}>
                  <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                    {!isRef && <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, background:cc.bg, color:cc.text, border:`0.5px solid ${cc.border}` }}>Tema {sel.item.n}</span>}
                    <span style={{ fontSize:11, padding:"2px 9px", borderRadius:20, background:cc.bg, color:cc.text, border:`0.5px solid ${cc.border}` }}>
                      {isRef ? "Referencia" : sel.item.cat}
                    </span>
                  </div>
                  <p style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)", lineHeight:1.3, margin:0 }}>
                    {isRef ? sel.item.t : sel.item.titulo}
                  </p>
                </div>

                {!isRef && (
                  <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                    {Object.keys(sel.item.docs).map(d => {
                      const m = DOC_META[d];
                      const active = d === dt;
                      return (
                        <button key={d} onClick={() => switchDt(d)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12,
                          background: active ? m?.text : m?.bg, color: active ? "white" : m?.text,
                          border: active ? `0.5px solid ${m?.text}` : `0.5px solid ${m?.border}`,
                          fontWeight: active ? 500 : 400 }}>
                          {m?.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#0F6E56", display:"inline-block" }}/>
                    <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>Puntos clave</span>
                    <span style={{ marginLeft:"auto", fontSize:10, color:"var(--color-text-tertiary)", background:"var(--color-background-secondary)", padding:"2px 7px", borderRadius:10, border:"0.5px solid var(--color-border-tertiary)" }}>
                      Generados por IA
                    </span>
                  </div>

                  {isKpL ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", justifyContent:"center" }}>
                      <Spinner/><span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>Generando…</span>
                    </div>
                  ) : kp.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"16px 0" }}>
                      <p style={{ fontSize:12, color:"var(--color-text-tertiary)", margin:"0 0 12px", lineHeight:1.6 }}>
                        Claude generará los puntos clave de estudio para este tema.
                      </p>
                      <button onClick={genKP} style={{ padding:"8px 20px", background:"#0F6E56", color:"white", border:"none", borderRadius:"var(--border-radius-md)", fontSize:13, cursor:"pointer", fontWeight:500 }}>
                        Generar puntos clave
                      </button>
                    </div>
                  ) : (
                    <>
                      {kp.map((p, i) => (
                        <div key={i} style={{ display:"flex", gap:9, alignItems:"flex-start", padding:"8px 11px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", marginBottom:7 }}>
                          <span style={{ flexShrink:0, width:18, height:18, borderRadius:"50%", background:"#E1F5EE", color:"#0F6E56", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:500, border:"0.5px solid #9FE1CB" }}>{i+1}</span>
                          <span style={{ fontSize:12, color:"var(--color-text-primary)", lineHeight:1.55 }}>{p}</span>
                        </div>
                      ))}
                      <div style={{ marginTop:14, display:"flex", gap:9 }}>
                        <a href={driveUrl(fileId)} target="_blank" rel="noreferrer"
                          style={{ flex:1, padding:"9px 14px", background:"#0F6E56", color:"white", border:"none", borderRadius:"var(--border-radius-md)", fontSize:13, fontWeight:500, textAlign:"center", textDecoration:"none", display:"block" }}>
                          Abrir en Drive ↗
                        </a>
                        {!isRef && (
                          <button
                            onClick={() => setPractica(sel.item)}
                            style={{ padding:"9px 14px", fontSize:13, borderRadius:"var(--border-radius-md)", cursor:"pointer", background:"#FAEEDA", color:"#854F0B", border:"0.5px solid #FAC775", fontWeight:500 }}>
                            ✏️ Practicar
                          </button>
                        )}
                        <button onClick={() => { setKp(p => { const n={...p}; delete n[kpKey]; return n; }); genKP(); }}
                          style={{ padding:"9px 14px", fontSize:13, borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>
                          ↻
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

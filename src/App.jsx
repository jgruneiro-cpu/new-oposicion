import { useState, useMemo, useRef, useCallback } from "react";
import Simulacro from "./Simulacro";
import Estadisticas from "./Estadisticas";

const API_URL = "/.netlify/functions/claude";

// ═══════════════════════════════════════════════════════════════
// DATOS
// ═══════════════════════════════════════════════════════════════

const DOC_META = {
  desarrollo:   { label:"Desarrollo" },
  epigrafe:     { label:"Epígrafe" },
  preguntas:    { label:"Preguntas" },
  cuestionario: { label:"Cuestionario" },
};

const CATS = [
  "Sistemas bibliotecarios",
  "Historia del libro",
  "Gestión de colecciones",
  "Fuentes de información",
  "Marco legal",
];

const TEMAS = [
  { id:"t0",  n:"0",  cat:"Gestión de colecciones",  titulo:"ISOs y normas internacionales en bibliotecas",
    docs:{ desarrollo:"1upy9QwfytzKW58oEbwJqnhd3E78nMT5V" }},
  { id:"t1",  n:"1",  cat:"Sistemas bibliotecarios", titulo:"Biblioteca Nacional de España (BNE)",
    docs:{ desarrollo:"1Q4bG91ftdFIJcoi9AbpOsRQSe4oSDBAi",
           epigrafe:"1UocxgAeKtCd8H7twOKRl8Mm3tpevmFUX",
           preguntas:"1AnRyAfJ0-xDjktpinSrhnING2CaQCWP6" }},
  { id:"t4",  n:"4",  cat:"Sistemas bibliotecarios", titulo:"Catálogo Colectivo de la Biblioteca (CCB)",
    docs:{ desarrollo:"1_TwzP4HbzNPS53I0-SvTKGFuiUwtfSxm" }},
  { id:"t5",  n:"5",  cat:"Sistemas bibliotecarios", titulo:"Bibliotecas Públicas del Estado. Bibliotecas especializadas",
    docs:{ desarrollo:"1zSM0T3FYxmocJhR2-FOgngjEFnDKi72m",
           epigrafe:"1IgdQwIdcpHpX317ixSkzE5q10iZ1K-d7" }},
  { id:"t12", n:"12", cat:"Gestión de colecciones",  titulo:"Selección y adquisición de fondos bibliográficos",
    docs:{ cuestionario:"1-_PxuD4cpfJU8G3LA39iruECFg3z68je" }},
  { id:"t14", n:"14", cat:"Gestión de colecciones",  titulo:"Proceso técnico: registro, sellado, tejuelas y signaturación",
    docs:{ cuestionario:"1vgbuMKm-L5Y3WdkRlMknDNGr8Fmnw4k7" }},
  { id:"t15", n:"15", cat:"Gestión de colecciones",  titulo:"Proceso técnico de ordenación de fondos y gestión de los depósitos. Recuentos",
    docs:{ cuestionario:"1ZRz5hFT4Mu7v0XQlbfryWtWd_qGfCvui" }},
  { id:"t16", n:"16", cat:"Sistemas bibliotecarios", titulo:"Concepto, función y tipología de las bibliotecas",
    docs:{ desarrollo:"11-hw1WGHeAQDWZv-a4hTbn-vGVfNWZDF" }},
  { id:"t17", n:"17", cat:"Sistemas bibliotecarios", titulo:"Bibliotecas Nacionales. Premios literarios",
    docs:{ epigrafe:"1pCqmeNuHJUw-nsnV7PxpxBG_zbjFNRYU" }},
  { id:"t18", n:"18", cat:"Sistemas bibliotecarios", titulo:"Ministerio de Cultura. Bibliotecas Públicas",
    docs:{ desarrollo:"18kCN_4UqQ-UvKZ4ZW_qou4GpPMw4yYmT" }},
  { id:"t23", n:"23", cat:"Fuentes de información",  titulo:"Bibliografías. Bibliografías nacionales",
    docs:{ desarrollo:"1CXp08r90oY0jCfNNQ5KBvmWdmFxS1xSC",
           epigrafe:"14Zyjf9DErncRfBQQsqsvhc_oDVvKqCfg",
           preguntas:"19olaxBrxzm_YH9h1sib5eKElxAztYmlp",
           cuestionario:"18Cp0wbAe_-Br1CU4IUnzMYdIXJ_dPzrM" }},
  { id:"t25", n:"25", cat:"Gestión de colecciones",  titulo:"Preservación y conservación del fondo bibliográfico y documental",
    docs:{ desarrollo:"1OTMIsOjDZt8qqbBAsN9Qs2N7uBdchcbs",
           epigrafe:"1_uIe8aeo6uUHR2n-R9RC8epnpRHBlEns",
           preguntas:"129U581Fcl1yCEWPv8qXGQOnKjF5NURxo",
           cuestionario:"1P14O9DN85g1brzkHtwc8sAxGDWXA0ZZ-" }},
  { id:"t30", n:"30", cat:"Gestión de colecciones",  titulo:"Proceso técnico de ordenación de fondos y gestión de los depósitos. Recuentos",
    docs:{ desarrollo:"1s5gohls8mT9qnF70WAgfcnBasoqHVOi0",
           epigrafe:"1gcjPQzfeq8JXNmyQEO95cyl8l05HwIt0",
           preguntas:"159i32Nb2EyyvAul-iDAyyPCN6EmE9-SD",
           cuestionario:"1ZRz5hFT4Mu7v0XQlbfryWtWd_qGfCvui" }},
  { id:"t42", n:"42", cat:"Sistemas bibliotecarios", titulo:"Cooperación bibliotecaria: organismos y proyectos",
    docs:{ desarrollo:"18w0oaWh9g_zhbB15kMrvT318TOse_Iee",
           epigrafe:"1dHoxfFaO2-GSJFkjelxdgpnPSTAQ3gOs",
           preguntas:"1faSxPC9KxUdsoD3DeP_a9mkARlfWw0E1" }},
  { id:"t48", n:"48", cat:"Historia del libro",       titulo:"El libro hasta la invención de la imprenta",
    docs:{ desarrollo:"1-mlWWKi6UzfhOa7kTf9OCVlZ2TikG23_" }},
  { id:"t49", n:"49", cat:"Historia del libro",       titulo:"La invención de la imprenta",
    docs:{ desarrollo:"1dn1RdPjZUyMFyjZ7VkFQJK7SPUGqyb9D" }},
  { id:"t55", n:"55", cat:"Historia del libro",       titulo:"El libro en los siglos XVIII, XIX y XX",
    docs:{ desarrollo:"1wpP0KpZCkHYnBycJI8SzOaDQK8mBgkss" }},
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

const GLOSARIO = [
  { t:"ABIES", d:"Aplicación de gestión bibliotecaria desarrollada por el Ministerio de Educación para bibliotecas escolares. Usada especialmente en centros educativos públicos." },
  { t:"BECREA", d:"Biblioteca Escolar y Centro de Recursos para la Enseñanza y el Aprendizaje. Modelo andaluz de biblioteca escolar integrada en el proyecto educativo." },
  { t:"CDU", d:"Clasificación Decimal Universal. Sistema jerárquico de clasificación del conocimiento basado en el sistema Dewey, dividido en 10 clases principales del 0 al 9." },
  { t:"CBU / UBC", d:"Control Bibliográfico Universal (Universal Bibliographic Control). Programa de la IFLA para que cada país catalogue sus propias publicaciones según normas comunes." },
  { t:"DSI", d:"Difusión Selectiva de la Información. Servicio bibliotecario que envía a cada usuario información nueva ajustada a su perfil de intereses." },
  { t:"Depósito Legal", d:"Obligación de entregar ejemplares de toda publicación a las bibliotecas designadas por ley (en España, la BNE y las autonómicas). Regulado por la Ley 23/2011." },
  { t:"Expurgo", d:"Proceso técnico de retirada definitiva de fondos obsoletos, deteriorados o poco usados de la colección de una biblioteca." },
  { t:"Herramientas de descubrimiento", d:"Software que unifica la búsqueda en catálogos, bases de datos y recursos electrónicos desde un único punto de acceso. Ejemplos: Summon, Primo, EBSCO DS, VuFind." },
  { t:"IBH", d:"Índices Bibliográficos Hispánicos. Repertorios bibliográficos específicos del ámbito español." },
  { t:"ICABS", d:"IFLA-CDNL Alliance for Bibliographic Standards. Alianza entre la IFLA y la Conferencia de Directores de Bibliotecas Nacionales para normas bibliográficas." },
  { t:"ICADS", d:"IFLA-CDNL Alliance for Digital Strategies. Alianza para el desarrollo de estrategias digitales en bibliotecas nacionales." },
  { t:"IFLA", d:"International Federation of Library Associations and Institutions. Organización internacional que representa los intereses de las bibliotecas y sus usuarios." },
  { t:"IBERMARC", d:"Formato español para la catalogación automatizada, adaptación del formato MARC (Machine-Readable Cataloging) a las particularidades hispánicas." },
  { t:"ISBD", d:"International Standard Bibliographic Description. Norma internacional que unifica la descripción bibliográfica en catálogos." },
  { t:"Koha", d:"Sistema Integrado de Gestión Bibliotecaria (SIGB) de código abierto, ampliamente usado en bibliotecas de todo el mundo." },
  { t:"MARC", d:"Machine-Readable Cataloging. Formato estándar para el intercambio de registros bibliográficos legibles por máquina." },
  { t:"Metabúsqueda", d:"Técnica que permite lanzar una búsqueda simultánea en múltiples catálogos o bases de datos y unificar los resultados." },
  { t:"MOPAC", d:"Mobile OPAC. Versión del catálogo público accesible desde dispositivos móviles." },
  { t:"OPAC", d:"Online Public Access Catalog. Catálogo público de la biblioteca accesible en línea para los usuarios." },
  { t:"RDA", d:"Resource Description and Access. Norma actual de catalogación que sustituye progresivamente a las AACR2, más adaptada al entorno digital." },
  { t:"SaaS", d:"Software as a Service. Modelo de distribución de software en el que la aplicación se aloja en la nube y se accede vía web mediante suscripción." },
  { t:"SIGB", d:"Sistema Integrado de Gestión Bibliotecaria. Software que integra todas las funciones de la biblioteca: catalogación, préstamo, adquisiciones, OPAC y estadísticas." },
  { t:"UAP", d:"Universal Availability of Publications. Programa de la IFLA que promueve el acceso universal a las publicaciones a través del préstamo interbibliotecario." },
  { t:"UBCIM", d:"Universal Bibliographic Control and International MARC. Programa fusionado de la IFLA que integra el control bibliográfico universal y el uso internacional del formato MARC." },
  { t:"UNE", d:"Una Norma Española. Normas técnicas elaboradas por AENOR y usadas ampliamente en el ámbito bibliotecario y documental." },
];

// ═══════════════════════════════════════════════════════════════
// UTILIDADES API + JSON
// ═══════════════════════════════════════════════════════════════

async function askClaude(prompt, maxTokens = 1000) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [{ role:"user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("API " + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
}


async function askClaudeConDoc(messages) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 4000, messages }),
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

// ═══════════════════════════════════════════════════════════════
// COMPONENTES BÁSICOS
// ═══════════════════════════════════════════════════════════════

function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: "2px solid var(--color-accent-soft)",
      borderTopColor: "var(--color-accent)",
      borderRadius: "50%",
      animation: "spin .7s linear infinite",
      flexShrink: 0
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════
// MODO PRÁCTICA (5 preguntas por tema)
// ═══════════════════════════════════════════════════════════════

function PracticaMode({ tema, onClose }) {
  const [fase, setFase] = useState("loading");
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultado, setResultado] = useState(null);

  useState(() => { generarPreguntas(); }, []);

  async function generarPreguntas() {
    setFase("loading");
    try {
      const txt = await askClaude(
        `Eres un experto en oposiciones a Auxiliar de Biblioteca del Estado (Ministerio de Cultura, España).
Genera 5 preguntas tipo test sobre el tema: "${tema.titulo}".
Cada pregunta con 4 opciones (A, B, C, D), solo una correcta.
Responde SOLO con un array JSON:
[{"pregunta":"...","opciones":["A","B","C","D"],"correcta":0,"explicacion":"..."}]
El campo "correcta" es el índice 0-3. Sin markdown, sin explicación extra.`
      );
      const parsed = tryJSON(txt);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPreguntas(parsed);
        setFase("test");
      } else throw new Error("parse");
    } catch (e) { setFase("error"); }
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

  const todasResp = preguntas.length > 0 && Object.keys(respuestas).length === preguntas.length;

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 620 }}>
        <div style={modalHeader}>
          <div>
            <p style={{ fontSize:11, color:"var(--color-text-mute)", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:.5, fontWeight:600 }}>Modo práctica · Tema {tema.n}</p>
            <p style={{ fontSize:15, fontWeight:600, color:"var(--color-text)", margin:0, lineHeight:1.3 }}>{tema.titulo}</p>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <div style={modalBody}>
          {fase === "loading" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"40px 0" }}>
              <Spinner size={30} />
              <p style={{ fontSize:13, color:"var(--color-text-soft)", margin:0 }}>Generando preguntas de examen...</p>
            </div>
          )}

          {fase === "error" && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <p style={{ fontSize:13, color:"var(--color-text-soft)", margin:"0 0 14px" }}>No se pudieron generar las preguntas.</p>
              <button onClick={generarPreguntas} style={primaryBtn}>Reintentar</button>
            </div>
          )}

          {fase === "resultado" && (
            <div style={{
              padding:"20px 24px", borderRadius:"var(--radius-lg)", marginBottom:22, textAlign:"center",
              background: resultado >= 4 ? "var(--color-success-soft)" : resultado >= 3 ? "var(--color-accent-soft)" : "var(--color-danger-soft)",
              border: `1px solid ${resultado >= 4 ? "#9FE1CB" : resultado >= 3 ? "var(--color-accent-border)" : "#FCA5A5"}`
            }}>
              <p style={{ fontSize:36, fontWeight:700, margin:"0 0 6px",
                color: resultado >= 4 ? "var(--color-success)" : resultado >= 3 ? "var(--color-accent)" : "var(--color-danger)" }}>
                {resultado}/5
              </p>
              <p style={{ fontSize:13, color:"var(--color-text-soft)", margin:0 }}>
                {resultado === 5 ? "¡Perfecto! Dominas este tema" : resultado >= 4 ? "¡Muy bien!" : resultado >= 3 ? "Bien, pero repasa algunos puntos" : "Necesitas repasar este tema"}
              </p>
            </div>
          )}

          {(fase === "test" || fase === "resultado") && preguntas.map((p, i) => {
            const respuesta = respuestas[i];
            const esCorrecta = respuesta === p.correcta;
            const mostrarR = fase === "resultado";
            return (
              <div key={i} style={{ marginBottom:18, padding:"16px 18px", background:"var(--color-bg-soft)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)" }}>
                <p style={{ fontSize:14, fontWeight:500, color:"var(--color-text)", margin:"0 0 12px", lineHeight:1.4 }}>
                  <span style={{ color:"var(--color-accent)", marginRight:6, fontWeight:700 }}>{i+1}.</span>{p.pregunta}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {p.opciones.map((op, j) => {
                    let bg = "var(--color-bg)", border = "1px solid var(--color-border)", color = "var(--color-text)";
                    if (mostrarR) {
                      if (j === p.correcta) { bg="var(--color-success-soft)"; border="1px solid #9FE1CB"; color="var(--color-success)"; }
                      else if (j === respuesta && !esCorrecta) { bg="var(--color-danger-soft)"; border="1px solid #FCA5A5"; color="var(--color-danger)"; }
                    } else if (respuesta === j) {
                      bg="var(--color-accent-soft)"; border="1px solid var(--color-accent)"; color:"var(--color-text)";
                    }
                    return (
                      <div key={j} onClick={() => seleccionar(i, j)} style={{
                        padding:"10px 14px", borderRadius:"var(--radius-md)", cursor: mostrarR ? "default" : "pointer",
                        background:bg, border, color, fontSize:13, lineHeight:1.4,
                        display:"flex", alignItems:"center", gap:10, transition:"all .12s",
                      }}>
                        <span style={{ flexShrink:0, width:20, height:20, borderRadius:"50%", border:"1px solid currentColor", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600 }}>
                          {String.fromCharCode(65+j)}
                        </span>
                        {op}
                      </div>
                    );
                  })}
                </div>
                {mostrarR && (
                  <p style={{ fontSize:12, color:"var(--color-text-soft)", margin:"10px 0 0", padding:"10px 12px", background:"var(--color-bg)", borderRadius:"var(--radius-md)", lineHeight:1.5, border:"1px solid var(--color-border-soft)" }}>
                    💡 {p.explicacion}
                  </p>
                )}
              </div>
            );
          })}

          {fase === "test" && (
            <button onClick={corregir} disabled={!todasResp} style={{
              width:"100%", padding:"12px", background: todasResp ? "var(--color-accent)" : "var(--color-bg-soft)",
              color: todasResp ? "white" : "var(--color-text-mute)",
              border: todasResp ? "none" : "1px solid var(--color-border)",
              borderRadius:"var(--radius-md)", fontSize:14, fontWeight:600, cursor: todasResp ? "pointer" : "default",
              marginTop: 8,
            }}>
              {todasResp ? "Ver resultados" : `Responde todas las preguntas (${Object.keys(respuestas).length}/5)`}
            </button>
          )}

          {fase === "resultado" && (
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={() => { setRespuestas({}); setResultado(null); generarPreguntas(); }}
                style={{ ...primaryBtn, flex:1 }}>Nuevo test</button>
              <button onClick={onClose} style={secondaryBtn}>Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ESTILOS COMPARTIDOS (para los modales)
// ═══════════════════════════════════════════════════════════════

const overlay = {
  position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100,
  display:"flex", alignItems:"center", justifyContent:"center", padding:16
};
const modal = {
  background:"var(--color-bg)", borderRadius:"var(--radius-lg)", width:"100%",
  maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column",
  boxShadow:"0 20px 60px rgba(0,0,0,0.25)"
};
const modalHeader = {
  padding:"18px 22px", borderBottom:"1px solid var(--color-border)",
  display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
  background:"var(--color-bg-soft)"
};
const modalBody = { padding:22, overflowY:"auto", flex:1 };
const closeBtn = {
  width:32, height:32, borderRadius:"50%", display:"flex",
  alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0,
  border:"1px solid var(--color-border)", background:"var(--color-bg)"
};
const primaryBtn = {
  padding:"10px 20px", background:"var(--color-accent)", color:"white",
  border:"none", borderRadius:"var(--radius-md)", fontSize:14,
  fontWeight:600, cursor:"pointer"
};
const secondaryBtn = {
  padding:"10px 20px", background:"var(--color-bg)", color:"var(--color-text)",
  border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
  fontSize:14, fontWeight:500, cursor:"pointer"
};

// ═══════════════════════════════════════════════════════════════
// MÓDULO: EXAMEN → TEST
// ═══════════════════════════════════════════════════════════════

const PROMPT_EXAMEN = `Eres un experto en oposiciones de Auxiliares de Archivos, Bibliotecas y Museos de la Comunidad de Madrid.
Analiza el examen y genera EXACTAMENTE 5 preguntas tipo test en español.
REGLAS ESTRICTAS:
- 4 opciones por pregunta, maximo 8 palabras cada opcion
- 1 sola correcta
- Si hay CDU, MARC21 o catalogacion: pregunta sobre eso
- explanation: maximo 1 frase corta
- Devuelve SOLO el array JSON, sin texto antes ni despues, sin backticks:
[{"question":"...","type":"CDU|MARC21|Catalogacion|Servicios","options":["A","B","C","D"],"correct":0,"explanation":"..."}]`;

function ExamenATest() {
  const [phase, setPhase] = useState("idle");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExp, setShowExp] = useState({});
  const [error, setError] = useState("");
  const fileRef = useRef();

  // ── Repositorio de examenes (localStorage) ──────────────────────────────
  const [repo, setRepo] = useState(() => {
    try { return JSON.parse(localStorage.getItem("examRepo") || "[]"); } catch { return []; }
  });

  function saveToRepo(name, text) {
    const id = Date.now().toString();
    const entry = { id, name, text, date: new Date().toLocaleDateString("es-ES") };
    const updated = [entry, ...repo].slice(0, 20); // max 20 examenes
    setRepo(updated);
    try { localStorage.setItem("examRepo", JSON.stringify(updated)); } catch {}
  }

  function deleteFromRepo(id) {
    const updated = repo.filter(e => e.id !== id);
    setRepo(updated);
    try { localStorage.setItem("examRepo", JSON.stringify(updated)); } catch {}
  }

  function loadFromRepo(entry) {
    setFileName(entry.name);
    setFileData({ type: "text", data: entry.text });
    setError("");
    setPhase("ready");
  }

  // Extrae texto de un PDF usando PDF.js via CDN
  async function extractPdfText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
          }
          resolve(text.trim());
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  const loadFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setError("Por favor sube un PDF, un archivo de texto (.txt) o un markdown (.md) con el examen.");
      return;
    }
    setError("");
    setFileName(file.name);
    if (file.type === "application/pdf") {
      setPhase("extracting");
      try {
        const text = await extractPdfText(file);
        setFileData({ type: "text", data: text });
        saveToRepo(file.name, text);
        setPhase("ready");
      } catch {
        // Fallback si PDF.js falla
        const r = new FileReader();
        r.onload = (e) => { setFileData({ type: "text", data: e.target.result }); saveToRepo(file.name, e.target.result); setPhase("ready"); };
        r.readAsText(file);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { setFileData({ type: "text", data: e.target.result }); saveToRepo(file.name, e.target.result); setPhase("ready"); };
      reader.readAsText(file);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const generate = useCallback(async () => {
    if (!fileData) return;
    setPhase("generating");
    try {
      // Texto plano truncado a 4000 chars para no saturar el contexto
      const textoExamen = fileData.data.slice(0, 4000);
      const raw = await askClaude(PROMPT_EXAMEN + "\n\nEXAMEN:\n" + textoExamen, 2000);
      const clean = raw.replace(/```json/gi,"").replace(/```/g,"").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No se pudo extraer el JSON de preguntas.");
      const qs = JSON.parse(match[0]);
      if (!Array.isArray(qs) || qs.length === 0) throw new Error("No se generaron preguntas.");
      setQuestions(qs);
      setAnswers({});
      setShowExp({});
      setCurrent(0);
      setPhase("quiz");
    } catch (err) {
      setError("Error generando las preguntas: " + err.message);
      setPhase("ready");
    }
  }, [fileData]);

  const answerQ = useCallback((qIdx, optIdx) => {
    if (answers[qIdx] !== undefined) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  }, [answers]);

  const totalAnswered = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(([i, a]) => a === questions[i]?.correct).length;
  const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const isAnswered = (idx) => answers[idx] !== undefined;

  const getOptState = (qIdx, optIdx) => {
    if (!isAnswered(qIdx)) return "idle";
    if (optIdx === questions[qIdx]?.correct) return "correct";
    if (optIdx === answers[qIdx]) return "wrong";
    return "idle";
  };

  const reset = () => {
    setPhase("idle"); setFileName(""); setFileData(null);
    setQuestions([]); setAnswers({}); setShowExp({}); setError(""); setCurrent(0);
  };

  return (
    <div style={{ maxWidth:820, margin:"0 auto", padding:"40px 32px" }}>
      <p style={sectionEyebrow}>Practica con examenes reales</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <h1 style={{ ...sectionH1, margin:0 }}>Examen &rarr; Test</h1>
        {phase !== "idle" && phase !== "generating" && (
          <button onClick={reset} style={secondaryBtn}>&larr; Nuevo examen</button>
        )}
      </div>

      {(phase === "idle" || phase === "ready") && (
        <>
          <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"24px", marginBottom:16 }}>
            <p style={{ fontSize:13, color:"var(--color-text-soft)", margin:"0 0 16px", lineHeight:1.6 }}>
              Sube un examen real de oposicion (PDF o texto) y la IA lo convierte en preguntas tipo test para que puedas evaluarte.
            </p>
            <div
              style={{ border:"2px dashed " + (dragOver ? "var(--color-accent)" : "var(--color-border)"), borderRadius:"var(--radius-lg)", padding:"36px 24px", textAlign:"center", cursor:"pointer", background: dragOver ? "var(--color-accent-soft)" : "var(--color-bg-soft)", transition:"all .2s" }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current.click()}
            >
              <div style={{ fontSize:32, marginBottom:10 }}>{fileName ? "✅" : "📂"}</div>
              {fileName ? (
                <>
                  <p style={{ fontSize:14, fontWeight:600, color:"var(--color-text)", margin:"0 0 4px" }}>{fileName}</p>
                  <p style={{ fontSize:12, color:"var(--color-text-mute)", margin:0 }}>Archivo listo · haz clic para cambiar</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:14, fontWeight:600, color:"var(--color-text)", margin:"0 0 4px" }}>Arrastra el PDF aqui o haz clic para seleccionar</p>
                  <p style={{ fontSize:12, color:"var(--color-text-mute)", margin:0 }}>PDF, .txt o .md</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.txt,.md" style={{ display:"none" }} onChange={(e) => loadFile(e.target.files[0])} />
            </div>
            {error && (
              <div style={{ color:"var(--color-danger)", fontSize:13, marginTop:12, padding:"10px 14px", background:"var(--color-danger-soft)", borderRadius:"var(--radius-md)", border:"1px solid #FCA5A5" }}>
                &#9888; {error}
              </div>
            )}
          </div>

          {repo.length > 0 && (
            <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"20px 24px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <p style={{ fontSize:11, fontWeight:600, color:"var(--color-text-mute)", textTransform:"uppercase", letterSpacing:.6, margin:0 }}>Mis examenes guardados</p>
                <span style={{ fontSize:11, color:"var(--color-text-mute)" }}>{repo.length}/20</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {repo.map(entry => (
                  <div key={entry.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--color-bg-soft)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>📋</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.name}</p>
                      <p style={{ fontSize:11, color:"var(--color-text-mute)", margin:0 }}>{entry.date}</p>
                    </div>
                    <button onClick={() => loadFromRepo(entry)} style={{ ...primaryBtn, padding:"6px 14px", fontSize:12, flexShrink:0 }}>
                      Hacer test
                    </button>
                    <button onClick={() => deleteFromRepo(entry.id)} style={{ flexShrink:0, width:28, height:28, borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", background:"var(--color-bg)", cursor:"pointer", fontSize:14, color:"var(--color-text-mute)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

                    <div style={{ background:"var(--color-bg-soft)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"20px 24px", marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:600, color:"var(--color-text-mute)", textTransform:"uppercase", letterSpacing:.6, margin:"0 0 12px" }}>Como funciona?</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {[
                { icon:"📤", t:"Sube el examen", d:"PDF o texto de examenes reales de oposicion, ya sean teoricos o practicos." },
                { icon:"🤖", t:"La IA lo analiza", d:"Extrae conceptos clave, datos y procedimientos del examen para construir el test." },
                { icon:"❓", t:"Responde el test", d:"5 preguntas tipo test con cuatro opciones y una unica respuesta correcta." },
                { icon:"📊", t:"Ve tu puntuacion", d:"Resultado con porcentaje, explicacion de cada respuesta y revision completa." },
              ].map(item => (
                <div key={item.t} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:20, marginTop:2 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", margin:"0 0 3px" }}>{item.t}</p>
                    <p style={{ fontSize:12, color:"var(--color-text-soft)", margin:0, lineHeight:1.5 }}>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {phase === "ready" && (
            <button style={{ ...primaryBtn, width:"100%", padding:"13px", fontSize:15 }} onClick={generate}>
              Generar test a partir de este examen
            </button>
          )}
        </>
      )}

      {phase === "extracting" && (
        <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"40px 32px", textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:14 }}>📄</div>
          <h2 style={{ fontSize:18, fontWeight:600, color:"var(--color-text)", margin:"0 0 8px" }}>Leyendo el PDF...</h2>
          <p style={{ fontSize:13, color:"var(--color-text-soft)", margin:0 }}>Extrayendo texto del examen, un momento.</p>
        </div>
      )}

      {phase === "generating" && (
        <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"60px 32px", textAlign:"center" }}>
          <div style={{ fontSize:44, marginBottom:18 }}>&#9881;&#65039;</div>
          <h2 style={{ fontSize:20, fontWeight:600, color:"var(--color-text)", margin:"0 0 10px" }}>Analizando el examen...</h2>
          <p style={{ fontSize:13, color:"var(--color-text-soft)", margin:"0 0 24px" }}>Esto puede tardar unos segundos.</p>
          <div style={{ background:"var(--color-bg-soft)", borderRadius:6, height:6, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"var(--color-accent)", borderRadius:6, animation:"pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      )}

      {phase === "quiz" && questions.length > 0 && (() => {
        const q = questions[current];
        return (
          <>
            <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"14px 20px", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--color-text-soft)", marginBottom:8 }}>
                <span>Pregunta <strong>{current+1}</strong> de <strong>{questions.length}</strong></span>
                <span>Respondidas: <strong>{totalAnswered}</strong>/{questions.length}</span>
              </div>
              <div style={{ background:"var(--color-bg-soft)", borderRadius:6, height:5, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", width:((current+1)/questions.length*100) + "%", background:"var(--color-accent)", borderRadius:6, transition:"width .3s" }} />
              </div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} style={{
                    width:26, height:26, borderRadius:6, border:"none", cursor:"pointer", fontSize:10, fontWeight:700,
                    background: i === current ? "var(--color-accent)" : isAnswered(i) ? (answers[i] === questions[i].correct ? "var(--color-success)" : "var(--color-danger)") : "var(--color-bg-soft)",
                    color: i === current || isAnswered(i) ? "white" : "var(--color-text-mute)",
                  }}>{i+1}</button>
                ))}
              </div>
            </div>

            <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"24px" }}>
              {q.type && <span style={{ ...pill, marginBottom:12, display:"inline-flex" }}>{q.type}</span>}
              <p style={{ fontSize:16, fontWeight:600, color:"var(--color-text)", lineHeight:1.5, margin:"0 0 18px" }}>
                {current+1}. {q.question}
              </p>

              {q.options.map((opt, oi) => {
                const answered = isAnswered(current);
                const st = getOptState(current, oi);
                const isSel = !answered && answers[current] === oi;
                const borderColor = st === "correct" ? "#9FE1CB" : st === "wrong" ? "#FCA5A5" : isSel ? "var(--color-accent)" : "var(--color-border)";
                const bgColor = st === "correct" ? "var(--color-success-soft)" : st === "wrong" ? "var(--color-danger-soft)" : isSel ? "var(--color-accent-soft)" : "var(--color-bg)";
                const letterBg = st === "correct" ? "var(--color-success)" : st === "wrong" ? "var(--color-danger)" : isSel ? "var(--color-accent)" : "var(--color-bg-soft)";
                const letterColor = (st !== "idle" || isSel) ? "white" : "var(--color-text-soft)";
                return (
                  <div key={oi}
                    style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"11px 14px", borderRadius:"var(--radius-md)", marginBottom:7, cursor: !answered ? "pointer" : "default", border:"1.5px solid " + borderColor, background:bgColor, transition:"all .15s" }}
                    onClick={() => { if (!answered) answerQ(current, oi); }}
                  >
                    <span style={{ flexShrink:0, width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background:letterBg, color:letterColor, border: (st === "idle" && !isSel) ? "1px solid var(--color-border)" : "none" }}>
                      {String.fromCharCode(65+oi)}
                    </span>
                    <span style={{ fontSize:13, color:"var(--color-text)", lineHeight:1.5, paddingTop:2 }}>{opt}</span>
                    {st === "correct" && <span style={{ marginLeft:"auto", color:"var(--color-success)", fontWeight:700 }}>&#10003;</span>}
                    {st === "wrong" && <span style={{ marginLeft:"auto", color:"var(--color-danger)", fontWeight:700 }}>&#10007;</span>}
                  </div>
                );
              })}

              {isAnswered(current) && q.explanation && (
                <div style={{ marginTop:10 }}>
                  <button onClick={() => setShowExp(p => ({ ...p, [current]: !p[current] }))} style={{ ...secondaryBtn, fontSize:12, padding:"6px 14px" }}>
                    {showExp[current] ? "Ocultar" : "Ver"} explicacion
                  </button>
                  {showExp[current] && (
                    <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:"var(--radius-md)", padding:"12px 16px", marginTop:8, fontSize:13, color:"#1E40AF", lineHeight:1.6 }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
                <button style={{ ...secondaryBtn, opacity: current === 0 ? .4 : 1 }} disabled={current === 0} onClick={() => setCurrent(current-1)}>
                  &larr; Anterior
                </button>
                {current < questions.length-1 ? (
                  <button style={primaryBtn} onClick={() => setCurrent(current+1)}>Siguiente &rarr;</button>
                ) : (
                  <button
                    style={{ ...primaryBtn, opacity: totalAnswered < questions.length ? .4 : 1 }}
                    disabled={totalAnswered < questions.length}
                    onClick={() => setPhase("results")}>
                    Ver resultado &rarr;
                  </button>
                )}
              </div>
              {current === questions.length-1 && totalAnswered < questions.length && (
                <p style={{ fontSize:11, color:"var(--color-text-mute)", textAlign:"right", marginTop:6 }}>
                  Responde todas las preguntas para ver el resultado
                </p>
              )}
            </div>
          </>
        );
      })()}

      {phase === "results" && (
        <>
          <div style={{ background: pct >= 50 ? "var(--color-success)" : "var(--color-danger)", borderRadius:"var(--radius-lg)", padding:"32px", textAlign:"center", marginBottom:16 }}>
            <p style={{ fontSize:56, fontWeight:800, color:"white", margin:"0 0 4px", lineHeight:1 }}>{pct}%</p>
            <p style={{ fontSize:17, fontWeight:600, color:"white", margin:"0 0 6px" }}>
              {pct >= 70 ? "Muy bien! Dominas el tema." : pct >= 50 ? "Aprobado, pero con margen de mejora." : "No has llegado al aprobado. Sigue practicando!"}
            </p>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.8)", margin:0 }}>
              {correctCount} correctas &middot; {totalAnswered-correctCount} incorrectas
            </p>
          </div>

          <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"22px", marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:600, color:"var(--color-text-mute)", textTransform:"uppercase", letterSpacing:.6, margin:"0 0 16px" }}>Revision completa</p>
            {questions.map((q, i) => {
              const isC = answers[i] === q.correct;
              return (
                <div key={i} style={{ borderBottom:"1px solid var(--color-border-soft)", padding:"14px 0" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{isC ? "✅" : "❌"}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"var(--color-text)", margin:"0 0 6px" }}>{i+1}. {q.question}</p>
                      <p style={{ fontSize:12, color: isC ? "var(--color-success)" : "var(--color-danger)", margin:"0 0 3px" }}>
                        Tu respuesta: {q.options[answers[i]]}
                      </p>
                      {!isC && (
                        <p style={{ fontSize:12, color:"var(--color-success)", margin:"0 0 4px" }}>
                          Correcta: {q.options[q.correct]}
                        </p>
                      )}
                      {q.explanation && (
                        <p style={{ fontSize:12, color:"var(--color-text-soft)", margin:"6px 0 0", padding:"8px 12px", background:"var(--color-bg-soft)", borderRadius:"var(--radius-md)", lineHeight:1.5 }}>
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button style={{ ...primaryBtn, flex:1 }} onClick={() => { setAnswers({}); setShowExp({}); setCurrent(0); setPhase("quiz"); }}>
              Repetir test
            </button>
            <button style={secondaryBtn} onClick={reset}>Subir otro examen</button>
          </div>
        </>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// SECCIÓN: PORTADA
// ═══════════════════════════════════════════════════════════════

function Portada({ onGoTo, onSimulacro, onStats }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px" }}>
      <div style={{ textAlign:"center", marginBottom: 56 }}>
        <div style={{
          display:"inline-block", padding:"6px 16px", background:"var(--color-accent-soft)",
          border:"1px solid var(--color-accent-border)", borderRadius:99, marginBottom:24,
          fontSize:12, fontWeight:600, color:"var(--color-accent)", letterSpacing:.5, textTransform:"uppercase",
        }}>
          Bibliotecas del Estado · Ministerio de Cultura
        </div>
        <h1 style={{ fontSize:52, fontWeight:700, color:"var(--color-text)", margin:"0 0 20px", lineHeight:1.1, letterSpacing:-0.5 }}>
          Prepara tu oposición<br/>con <span style={{ color:"var(--color-accent)" }}>método</span>.
        </h1>
        <p style={{ fontSize:18, color:"var(--color-text-soft)", margin:"0 auto", maxWidth:600, lineHeight:1.6 }}>
          Simulacros con condiciones reales de examen, seguimiento de tu evolución y un temario
          organizado para que cada minuto de estudio sea útil.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14, marginBottom: 48 }}>
        <CardAccion
          titulo="🎯 Simulacro completo"
          desc="100 preguntas · 90 min · penalización real"
          onClick={onSimulacro}
          destacado
        />
        <CardAccion
          titulo="📊 Mi progreso"
          desc="Evolución, categorías y puntos débiles"
          onClick={onStats}
        />
        <CardAccion titulo="📚 Estudiar un tema" desc="16 temas del programa oficial" onClick={() => onGoTo("temario")} />
        <CardAccion titulo="📄 Examen → Test" desc="Sube un examen real y conviértelo en test" onClick={() => onGoTo("examen")} />
      </div>

      <div style={{
        padding:"24px 28px", background:"var(--color-bg-soft)", borderRadius:"var(--radius-lg)",
        border:"1px solid var(--color-border)",
      }}>
        <h3 style={{ fontSize:14, fontWeight:600, color:"var(--color-text-mute)", margin:"0 0 16px", textTransform:"uppercase", letterSpacing:.5 }}>
          En cifras
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:20 }}>
          <Cifra n={TEMAS.length} l="Temas" />
          <Cifra n={CATS.length} l="Categorías" />
          <Cifra n={REFS.length} l="Documentos de apoyo" />
          <Cifra n={GLOSARIO.length} l="Términos en glosario" />
        </div>
      </div>
    </div>
  );
}

function CardAccion({ titulo, desc, onClick, destacado }) {
  return (
    <button onClick={onClick} style={{
      padding:"22px 20px", textAlign:"left", cursor:"pointer",
      background: destacado ? "var(--color-accent)" : "var(--color-bg)",
      color: destacado ? "white" : "var(--color-text)",
      border: destacado ? "none" : "1px solid var(--color-border)",
      borderRadius:"var(--radius-lg)", transition:"transform .15s",
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <p style={{ fontSize:16, fontWeight:600, margin:"0 0 6px" }}>{titulo}</p>
      <p style={{ fontSize:12, margin:0, opacity: destacado ? .9 : .7 }}>{desc}</p>
    </button>
  );
}

function Cifra({ n, l }) {
  return (
    <div>
      <p style={{ fontSize:32, fontWeight:700, color:"var(--color-accent)", margin:0, lineHeight:1 }}>{n}</p>
      <p style={{ fontSize:12, color:"var(--color-text-soft)", margin:"4px 0 0", fontWeight:500 }}>{l}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: INTRODUCCIÓN
// ═══════════════════════════════════════════════════════════════

function Introduccion() {
  return (
    <div style={{ maxWidth: 780, margin:"0 auto", padding:"40px 32px" }}>
      <p style={sectionEyebrow}>Cómo usar esta web</p>
      <h1 style={sectionH1}>Introducción</h1>

      <Bloque titulo="¿Qué es MisOpos?">
        Una plataforma de estudio pensada específicamente para las oposiciones a
        <strong> Auxiliar y Ayudante de Bibliotecas del Estado</strong> (Ministerio de Cultura).
        Combina material teórico, práctica activa y un simulacro fiel a las condiciones del examen real.
      </Bloque>

      <Bloque titulo="¿Cómo está organizada?">
        El contenido se estructura en <strong>16 temas</strong> distribuidos en <strong>5 categorías</strong>:
        Sistemas bibliotecarios, Historia del libro, Gestión de colecciones, Fuentes de información y Marco legal.
        Cada tema puede tener hasta cuatro tipos de material: Desarrollo, Epígrafe, Preguntas y Cuestionario.
      </Bloque>

      <Bloque titulo="Recorrido recomendado">
        <ol style={{ paddingLeft: 24, margin:"12px 0 0", color:"var(--color-text-soft)", lineHeight:1.8 }}>
          <li><strong>Estudia el tema</strong> desde su ficha (puntos clave + apuntes en Drive).</li>
          <li><strong>Practica</strong> con 5 preguntas rápidas para consolidar.</li>
          <li>Cada semana, <strong>haz un simulacro completo</strong> (100 preguntas, 90 min).</li>
          <li>Revisa <strong>Mi progreso</strong> y ataca los temas débiles.</li>
          <li><strong>Sube exámenes reales</strong> con Examen → Test para practicar con material oficial.</li>
        </ol>
      </Bloque>

      <Bloque titulo="Sobre el simulacro">
        El simulacro reproduce las condiciones oficiales:
        <ul style={{ paddingLeft: 22, margin:"10px 0 0", color:"var(--color-text-soft)", lineHeight:1.8 }}>
          <li>100 preguntas mezcladas de todos los temas</li>
          <li>90 minutos con cuenta atrás</li>
          <li>Cada 3 errores restan 1 acierto (penalización 1/3)</li>
          <li>Aprobado a partir de 5 sobre 10</li>
        </ul>
      </Bloque>

      <Bloque titulo="Sobre la generación con IA">
        Las preguntas se generan con inteligencia artificial cada vez que inicias un simulacro
        o una práctica. Esto garantiza <strong>variedad ilimitada</strong> y evita que memorices por repetición.
        El nivel de dificultad y estilo replican los exámenes oficiales.
      </Bloque>
    </div>
  );
}

const sectionEyebrow = {
  fontSize:12, fontWeight:600, color:"var(--color-accent)",
  letterSpacing:.8, textTransform:"uppercase", margin:"0 0 8px",
};
const sectionH1 = {
  fontSize:40, fontWeight:700, color:"var(--color-text)",
  margin:"0 0 32px", lineHeight:1.15, letterSpacing:-0.3,
};

function Bloque({ titulo, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize:19, fontWeight:600, color:"var(--color-text)", margin:"0 0 10px" }}>{titulo}</h2>
      <p style={{ fontSize:15, color:"var(--color-text-soft)", lineHeight:1.7, margin:0 }}>{children}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: MAPA VISUAL
// ═══════════════════════════════════════════════════════════════

function MapaVisual({ onSelectTema }) {
  const porCat = useMemo(() => {
    const m = {};
    CATS.forEach(c => { m[c] = TEMAS.filter(t => t.cat === c); });
    return m;
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin:"0 auto", padding:"40px 32px" }}>
      <p style={sectionEyebrow}>Panorama del temario</p>
      <h1 style={sectionH1}>Mapa visual</h1>
      <p style={{ fontSize:15, color:"var(--color-text-soft)", lineHeight:1.6, margin:"0 0 40px", maxWidth: 620 }}>
        Los <strong>{TEMAS.length} temas disponibles</strong> agrupados por categoría. Haz clic en cualquier tema para acceder a su ficha.
      </p>

      <div style={{ display:"grid", gap: 28 }}>
        {CATS.map(cat => {
          const temas = porCat[cat];
          if (temas.length === 0) return null;
          return (
            <div key={cat}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width: 4, height: 22, background:"var(--color-accent)", borderRadius: 2 }} />
                <h2 style={{ fontSize:18, fontWeight:600, color:"var(--color-text)", margin:0 }}>{cat}</h2>
                <span style={{ fontSize:12, color:"var(--color-text-mute)", background:"var(--color-bg-soft)", padding:"3px 10px", borderRadius:99, border:"1px solid var(--color-border)" }}>
                  {temas.length} temas
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {temas.map(t => (
                  <button key={t.id} onClick={() => onSelectTema(t)} style={{
                    padding:"12px 14px", textAlign:"left", background:"var(--color-bg)",
                    border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
                    cursor:"pointer", transition:"all .15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.background = "var(--color-accent-soft)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background = "var(--color-bg)";
                  }}
                  >
                    <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{
                        flexShrink:0, minWidth:28, height:24, padding:"0 6px", borderRadius:6,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        background:"var(--color-accent)", color:"white", fontSize:11, fontWeight:700,
                      }}>{t.n}</span>
                      <p style={{ margin:0, fontSize:13, color:"var(--color-text)", lineHeight:1.35, fontWeight:500 }}>
                        {t.titulo}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: GLOSARIO
// ═══════════════════════════════════════════════════════════════

function Glosario() {
  const [q, setQ] = useState("");
  const filtrado = useMemo(() => {
    if (!q.trim()) return GLOSARIO;
    const bq = q.toLowerCase();
    return GLOSARIO.filter(g => g.t.toLowerCase().includes(bq) || g.d.toLowerCase().includes(bq));
  }, [q]);

  return (
    <div style={{ maxWidth: 820, margin:"0 auto", padding:"40px 32px" }}>
      <p style={sectionEyebrow}>Términos clave del temario</p>
      <h1 style={sectionH1}>Glosario</h1>

      <input
        type="text"
        placeholder="Buscar término..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ width:"100%", padding:"12px 16px", fontSize:14, marginBottom:24 }}
      />

      {filtrado.length === 0 ? (
        <p style={{ color:"var(--color-text-mute)", fontSize:14 }}>Sin resultados.</p>
      ) : (
        <div>
          {filtrado.map(g => (
            <div key={g.t} style={{
              padding:"18px 20px", marginBottom: 10, background:"var(--color-bg-soft)",
              borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)",
            }}>
              <p style={{ fontSize:15, fontWeight:600, color:"var(--color-accent)", margin:"0 0 6px", letterSpacing:.2 }}>
                {g.t}
              </p>
              <p style={{ fontSize:13, color:"var(--color-text-soft)", lineHeight:1.6, margin:0 }}>
                {g.d}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: TEMARIO (lista + ficha del tema seleccionado)
// ═══════════════════════════════════════════════════════════════

function Temario({ subCat, setSubCat, sel, setSel, dt, setDt, kpCache, setKp, busy, setBusy, setPractica }) {
  const temasFiltrados = useMemo(() => {
    if (subCat === "Todas") return TEMAS;
    return TEMAS.filter(t => t.cat === subCat);
  }, [subCat]);

  async function genKP() {
    if (!sel || sel.type !== "tema") return;
    const titulo = sel.item.titulo;
    const tipo = `apunte — ${DOC_META[dt]?.label || dt}`;
    const key = `kp_${sel.item.id}_${dt}`;
    if (kpCache[key] || busy[key]) return;
    setBusy(p => ({ ...p, [key]: true }));
    try {
      const txt = await askClaude(
        `Eres experto en oposiciones a Auxiliar de Biblioteca del Estado (Ministerio de Cultura, España).
Documento: "${titulo}" (${tipo}).
Extrae 7 puntos clave de estudio en español, máximo 140 caracteres cada uno.
Prioriza: definiciones exactas, leyes/normas con número y año, datos concretos.
Responde SOLO con array JSON: ["punto1","punto2",...]. Sin markdown.`
      );
      const pts = tryJSON(txt);
      setKp(p => ({ ...p, [key]: Array.isArray(pts) ? pts : [txt] }));
    } catch(e) {
      setKp(p => ({ ...p, [key]: ["Error: " + e.message] }));
    } finally { setBusy(p => ({ ...p, [key]: false })); }
  }

  const kpKey = sel?.type === "tema" ? `kp_${sel.item.id}_${dt}` : null;
  const kp = kpKey ? (kpCache[kpKey] || []) : [];
  const isKpL = kpKey ? !!busy[kpKey] : false;
  const fileId = sel?.type === "tema" ? sel.item.docs?.[dt] : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", minHeight:"100%" }}>
      <div style={{ borderRight:"1px solid var(--color-border)", background:"var(--color-bg)", overflowY:"auto" }}>
        {temasFiltrados.map(t => {
          const active = sel?.type === "tema" && sel.item.id === t.id;
          return (
            <div key={t.id} onClick={() => {
              const first = Object.keys(t.docs)[0];
              setSel({ type:"tema", item:t });
              setDt(first);
            }} style={{
              padding:"14px 16px", cursor:"pointer",
              borderBottom:"1px solid var(--color-border-soft)",
              borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
              background: active ? "var(--color-accent-soft)" : "transparent",
              display:"flex", gap:10, alignItems:"flex-start",
              transition:"all .12s",
            }}>
              <span style={{
                flexShrink:0, minWidth:28, height:24, padding:"0 6px", borderRadius:6,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                background: active ? "var(--color-accent)" : "var(--color-bg-soft)",
                color: active ? "white" : "var(--color-text-soft)",
                border: active ? "none" : "1px solid var(--color-border)",
              }}>{t.n}</span>
              <p style={{ margin:0, fontSize:13, color:"var(--color-text)", lineHeight:1.4, fontWeight: active ? 500 : 400 }}>
                {t.titulo}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ overflowY:"auto", padding:"32px 40px", background:"var(--color-bg-soft)" }}>
        {!sel || sel.type !== "tema" ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, color:"var(--color-text-mute)", fontSize:14 }}>
            Selecciona un tema de la lista
          </div>
        ) : (
          <>
            <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"22px 26px", marginBottom:14 }}>
              <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                <span style={pill}>Tema {sel.item.n}</span>
                <span style={pill}>{sel.item.cat}</span>
              </div>
              <h2 style={{ fontSize:22, fontWeight:600, color:"var(--color-text)", lineHeight:1.3, margin:0 }}>
                {sel.item.titulo}
              </h2>
            </div>

            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {Object.keys(sel.item.docs).map(d => {
                const m = DOC_META[d];
                const active = d === dt;
                return (
                  <button key={d} onClick={() => setDt(d)} style={{
                    padding:"7px 16px", borderRadius:99, fontSize:12,
                    background: active ? "var(--color-accent)" : "var(--color-bg)",
                    color: active ? "white" : "var(--color-text-soft)",
                    border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    fontWeight: active ? 600 : 500,
                  }}>{m?.label}</button>
                );
              })}
            </div>

            <div style={{ background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"22px 26px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-accent)" }}/>
                <span style={{ fontSize:14, fontWeight:600, color:"var(--color-text)" }}>Puntos clave</span>
                <span style={{ marginLeft:"auto", fontSize:10, color:"var(--color-text-mute)", background:"var(--color-bg-soft)", padding:"3px 9px", borderRadius:99, border:"1px solid var(--color-border)", fontWeight:500 }}>
                  Generados por IA
                </span>
              </div>

              {isKpL ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"24px 0", justifyContent:"center" }}>
                  <Spinner/><span style={{ fontSize:13, color:"var(--color-text-soft)" }}>Generando…</span>
                </div>
              ) : kp.length === 0 ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <p style={{ fontSize:13, color:"var(--color-text-mute)", margin:"0 0 14px", lineHeight:1.6 }}>
                    La IA generará los puntos clave de estudio para este tema.
                  </p>
                  <button onClick={genKP} style={primaryBtn}>Generar puntos clave</button>
                </div>
              ) : (
                <>
                  {kp.map((p, i) => (
                    <div key={i} style={{
                      display:"flex", gap:12, alignItems:"flex-start",
                      padding:"12px 14px", background:"var(--color-bg-soft)",
                      borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)",
                      marginBottom:8,
                    }}>
                      <span style={{
                        flexShrink:0, width:22, height:22, borderRadius:"50%",
                        background:"var(--color-accent-soft)", color:"var(--color-accent)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, fontWeight:700, border:"1px solid var(--color-accent-border)",
                      }}>{i+1}</span>
                      <span style={{ fontSize:13, color:"var(--color-text)", lineHeight:1.6 }}>{p}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:18, display:"flex", gap:10, flexWrap:"wrap" }}>
                    <a href={driveUrl(fileId)} target="_blank" rel="noreferrer"
                      style={{ ...primaryBtn, flex:1, textAlign:"center", textDecoration:"none", display:"block", minWidth:180 }}>
                      Abrir en Drive ↗
                    </a>
                    <button onClick={() => setPractica(sel.item)} style={secondaryBtn}>
                      ✏️ Practicar
                    </button>
                    <button onClick={() => { setKp(p => { const n={...p}; delete n[kpKey]; return n; }); genKP(); }}
                      style={secondaryBtn}>↻</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const pill = {
  fontSize:11, padding:"4px 12px", borderRadius:99,
  background:"var(--color-accent-soft)", color:"var(--color-accent)",
  border:"1px solid var(--color-accent-border)", fontWeight:600,
};

// ═══════════════════════════════════════════════════════════════
// SECCIÓN: DOCUMENTOS
// ═══════════════════════════════════════════════════════════════

function Documentos({ subGrupo }) {
  const grupos = useMemo(() => {
    const g = {};
    REFS.forEach(r => { (g[r.g] = g[r.g] || []).push(r); });
    return g;
  }, []);
  const items = subGrupo === "Todos" ? REFS : (grupos[subGrupo] || []);

  return (
    <div style={{ maxWidth: 920, margin:"0 auto", padding:"40px 32px" }}>
      <p style={sectionEyebrow}>Material de apoyo</p>
      <h1 style={sectionH1}>Documentos</h1>

      <div style={{ display:"grid", gap:10 }}>
        {items.map(r => (
          <a key={r.id} href={driveUrl(r.id)} target="_blank" rel="noreferrer" style={{
            display:"flex", alignItems:"center", gap:14, padding:"16px 20px",
            background:"var(--color-bg-soft)", border:"1px solid var(--color-border)",
            borderRadius:"var(--radius-md)", textDecoration:"none", color:"var(--color-text)",
            transition:"all .12s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.background = "var(--color-bg)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.background = "var(--color-bg-soft)";
          }}>
            <div style={{
              flexShrink:0, width:36, height:36, borderRadius:8,
              background:"var(--color-accent-soft)", color:"var(--color-accent)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
            }}>📄</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11, color:"var(--color-text-mute)", margin:"0 0 3px", fontWeight:600, textTransform:"uppercase", letterSpacing:.4 }}>{r.g}</p>
              <p style={{ fontSize:14, margin:0, fontWeight:500, lineHeight:1.4 }}>{r.t}</p>
            </div>
            <span style={{ fontSize:16, color:"var(--color-text-mute)" }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const MENU = [
  { id:"portada",       icon:"🏠", label:"Portada" },
  { id:"introduccion",  icon:"📖", label:"Introducción" },
  { id:"mapa",          icon:"🗺️", label:"Mapa visual" },
  { id:"temario",       icon:"📚", label:"Temario",
    subs: ["Todas", ...CATS] },
  { id:"documentos",    icon:"📄", label:"Documentos",
    subs: ["Todos","Exámenes","Marco legal","Bibliografía","Instituciones","Estadísticas"] },
  { id:"glosario",      icon:"📓", label:"Glosario" },
  { id:"examen",        icon:"🧪", label:"Examen → Test" },
];

export default function App() {
  const [seccion, setSeccion] = useState("portada");
  const [subCat, setSubCat]   = useState("Todas");
  const [subGrupo, setSubGrupo] = useState("Todos");
  const [expanded, setExpanded] = useState({ temario: true, documentos: false });

  const [sel, setSel] = useState(null);
  const [dt, setDt]   = useState("desarrollo");
  const [kpCache, setKp] = useState({});
  const [busy, setBusy]  = useState({});

  const [practica, setPractica] = useState(null);
  const [showSimulacro, setShowSimulacro] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const temasParaSimulacro = TEMAS.map(t => ({ numero: t.n, titulo: t.titulo }));

  function irATema(t) {
    setSeccion("temario");
    setSubCat("Todas");
    const first = Object.keys(t.docs)[0];
    setSel({ type:"tema", item:t });
    setDt(first);
  }

  function handleRepasarTema(numTema) {
    const t = TEMAS.find(x => x.n === numTema);
    if (t) irATema(t);
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.5;width:30%} 50%{opacity:1;width:80%} }
        * { box-sizing: border-box; }
      `}</style>

      {practica && <PracticaMode tema={practica} onClose={() => setPractica(null)} />}
      {showSimulacro && <Simulacro temas={temasParaSimulacro} onClose={() => setShowSimulacro(false)} />}
      {showStats && <Estadisticas temas={TEMAS} onClose={() => setShowStats(false)} onRepasarTema={handleRepasarTema} />}

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", minHeight:"100vh" }}>

        {/* ═══════════════ MENÚ LATERAL ═══════════════ */}
        <aside style={{
          background:"var(--color-bg)", borderRight:"1px solid var(--color-border)",
          display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflow:"hidden",
        }}>
          {/* Logo */}
          <div style={{ padding:"22px 22px 18px", borderBottom:"1px solid var(--color-border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:"var(--color-accent)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="12" rx="1" fill="white" opacity=".95"/>
                  <rect x="9" y="2" width="5" height="12" rx="1" fill="white" opacity=".65"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:"var(--color-text)", margin:0, letterSpacing:-0.2 }}>MisOpos</p>
                <p style={{ fontSize:10, color:"var(--color-text-mute)", margin:0, fontWeight:500, textTransform:"uppercase", letterSpacing:.5 }}>Bibliotecas del Estado</p>
              </div>
            </div>
          </div>

          {/* Accesos destacados */}
          <div style={{ padding:"14px 14px 8px", display:"flex", flexDirection:"column", gap:6 }}>
            <button onClick={() => setShowSimulacro(true)} style={{
              padding:"11px 14px", background:"var(--color-accent)", color:"white",
              border:"none", borderRadius:"var(--radius-md)", fontSize:13, fontWeight:600,
              cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10,
            }}>
              <span>🎯</span> Simulacro completo
            </button>
            <button onClick={() => setShowStats(true)} style={{
              padding:"11px 14px", background:"var(--color-bg)",
              border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
              fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left",
              display:"flex", alignItems:"center", gap:10, color:"var(--color-text)",
            }}>
              <span>📊</span> Mi progreso
            </button>
          </div>

          {/* Navegación */}
          <nav style={{ padding:"8px 10px", overflowY:"auto", flex:1 }}>
            <p style={{ fontSize:10, color:"var(--color-text-mute)", margin:"14px 12px 8px", fontWeight:600, textTransform:"uppercase", letterSpacing:.6 }}>
              Contenido
            </p>
            {MENU.map(m => {
              const activa = seccion === m.id;
              const hasSubs = !!m.subs;
              const isOpen = expanded[m.id];
              return (
                <div key={m.id}>
                  <button onClick={() => {
                    setSeccion(m.id);
                    if (hasSubs) setExpanded(p => ({ ...p, [m.id]: !p[m.id] }));
                  }} style={{
                    width:"100%", padding:"9px 12px", background: activa ? "var(--color-accent-soft)" : "transparent",
                    border:"none", borderRadius:"var(--radius-md)", fontSize:13,
                    fontWeight: activa ? 600 : 500, color: activa ? "var(--color-accent)" : "var(--color-text)",
                    cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, marginBottom:2,
                  }}>
                    <span style={{ fontSize:14 }}>{m.icon}</span>
                    <span style={{ flex:1 }}>{m.label}</span>
                    {hasSubs && (
                      <span style={{ fontSize:10, color:"var(--color-text-mute)", transition:"transform .15s", transform: isOpen ? "rotate(90deg)" : "none" }}>▶</span>
                    )}
                  </button>
                  {hasSubs && isOpen && (
                    <div style={{ marginLeft: 22, marginBottom: 6 }}>
                      {m.subs.map(s => {
                        const currentSub = m.id === "temario" ? subCat : subGrupo;
                        const active = seccion === m.id && currentSub === s;
                        return (
                          <button key={s} onClick={() => {
                            setSeccion(m.id);
                            if (m.id === "temario") setSubCat(s);
                            else setSubGrupo(s);
                          }} style={{
                            width:"100%", padding:"6px 12px", background: active ? "var(--color-bg-soft)" : "transparent",
                            border:"none", borderLeft: active ? "2px solid var(--color-accent)" : "2px solid var(--color-border-soft)",
                            borderRadius: 0, fontSize:12, color: active ? "var(--color-accent)" : "var(--color-text-soft)",
                            fontWeight: active ? 600 : 400, cursor:"pointer", textAlign:"left", display:"block", marginBottom: 1,
                          }}>{s}</button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div style={{ padding:"12px 22px", borderTop:"1px solid var(--color-border)", fontSize:10, color:"var(--color-text-mute)" }}>
            v1.1 · {TEMAS.length} temas
          </div>
        </aside>

        {/* ═══════════════ CONTENIDO PRINCIPAL ═══════════════ */}
        <main style={{ background:"var(--color-bg)", overflowY:"auto" }}>
          {seccion === "portada" && (
            <Portada
              onGoTo={setSeccion}
              onSimulacro={() => setShowSimulacro(true)}
              onStats={() => setShowStats(true)}
            />
          )}
          {seccion === "introduccion" && <Introduccion />}
          {seccion === "mapa" && <MapaVisual onSelectTema={irATema} />}
          {seccion === "temario" && (
            <Temario
              subCat={subCat} setSubCat={setSubCat}
              sel={sel} setSel={setSel}
              dt={dt} setDt={setDt}
              kpCache={kpCache} setKp={setKp}
              busy={busy} setBusy={setBusy}
              setPractica={setPractica}
            />
          )}
          {seccion === "documentos" && <Documentos subGrupo={subGrupo} />}
          {seccion === "glosario" && <Glosario />}
          {seccion === "examen" && <ExamenATest />}
        </main>
      </div>
    </>
  );
}

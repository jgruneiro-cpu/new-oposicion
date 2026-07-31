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
  { g:"Exámenes",

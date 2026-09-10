// Netlify Function: proxy hacia la API de Anthropic.
// Todas las llamadas de la app pasan por aquí para que la ANTHROPIC_API_KEY
// no viaje al navegador. La clave se configura en Netlify → Site settings → Environment variables.

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: { message: "Falta la variable ANTHROPIC_API_KEY en Netlify" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: e.message || "Error de red" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// El límite de ejecución síncrona de Netlify es de 60 s y no es configurable,
// así que no se declara maxDuration (esa opción no existe y se ignoraba).
export const config = {
  path: "/.netlify/functions/claude",
};

const CATEGORY_CRITERIA = {
  controller: "Motor controller, ESC, speed controller, or control box.",
  charger: "Mains charger, charge lead, charging port, or charging equipment.",
  brakes: "Brake discs, pads, calipers, levers, hoses, or brake fittings.",
  throttle: "Throttle, display, dashboard, trigger, or handlebar control.",
  battery: "Battery pack, BMS, or battery-specific component.",
  wheel: "Motor, wheel, tyre, tube, rim, bearing, or axle component.",
  electrical: "Cable, wiring, connector, light, switch, fuse, or other electrical component.",
  body: "Deck, stem, suspension, frame, fender, stand, grip, bolt, or physical hardware.",
  other: "A scooter part that does not fit another listed category.",
};

const ASSEMBLY_CRITERIA = {
  Electrical: "Controllers, chargers, switches, cables, ports, trackers, and general electrical components.",
  Lights: "Headlights, LED lights, lighting strips, light brackets, and lighting-specific components.",
  Brakes: "Brake-specific components.",
  Battery: "Battery-specific components.",
  Motor: "Motor-specific components.",
  Wheel: "Wheel, tyre, rim, tube, axle, or bearing components.",
  Suspension: "Suspension-specific components.",
  Steering: "Handlebar, stem, hinge, or steering components.",
  Body: "Deck, frame, fender, stand, or body components.",
  "No assembly filter": "Use when the request is broad or does not name a specific assembly.",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function classifyWithJev(request, env) {
  if (!env.OPENROUTER_API_KEY) return json({ error: "JEV is not configured." }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Expected JSON." }, 400); }
  const text = typeof body?.query === "string" ? body.query.trim().slice(0, 500) : "";
  if (!text) return json({ error: "A part request is required." }, 400);

  const upstream = await fetch("https://openrouter.ai/api/alpha/decisions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "content-type": "application/json",
      "http-referer": new URL(request.url).origin,
      "x-title": "Dualtron Parts Finder",
    },
    body: JSON.stringify({
      model: "typesafe/jev-1.13",
      state: { description: "A customer's natural-language request for an electric scooter replacement part.", record: text },
      questions: {
        part_category: {
          type: "choice",
          instructions: "Classify the requested scooter part in record. Choose the most specific matching category. If the request is unclear, choose other.",
          criteria: CATEGORY_CRITERIA,
        },
        part_assembly: {
          type: "choice",
          instructions: "Choose the most specific scooter assembly explicitly requested in record. A request for lights, headlights, LEDs, or lighting must choose Lights. Do not choose Electrical merely because a light uses electricity. Choose No assembly filter when no assembly is clear.",
          criteria: ASSEMBLY_CRITERIA,
        },
      },
    }),
  });

  const data = await upstream.json().catch(() => null);
  if (!upstream.ok) return json({ error: "JEV decision request failed." }, 502);
  const answer = data?.answers?.part_category;
  const assemblyAnswer = data?.answers?.part_assembly;
  if (!answer?.choice || !CATEGORY_CRITERIA[answer.choice]) return json({ error: "JEV returned an invalid decision." }, 502);

  return json({
    category: answer.choice,
    assembly: ASSEMBLY_CRITERIA[assemblyAnswer?.choice] && assemblyAnswer.choice !== "No assembly filter" ? assemblyAnswer.choice : null,
    confidence: answer.confidence ?? answer.probabilities?.[answer.choice] ?? null,
    assemblyConfidence: assemblyAnswer?.confidence ?? assemblyAnswer?.probabilities?.[assemblyAnswer?.choice] ?? null,
    probabilities: answer.probabilities ?? null,
    assemblyProbabilities: assemblyAnswer?.probabilities ?? null,
    provider: "typesafe/jev-1.13",
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/jev-intent") {
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
      return classifyWithJev(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};

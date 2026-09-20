import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BatteryCharging,
  Check,
  ChevronDown,
  CircleAlert,
  Cpu,
  Disc3,
  Gauge,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { SHOPIFY_PRODUCTS } from "./shopify-catalog.js";

const CATEGORIES = [
  { id: "controller", label: "Controller", icon: Cpu, hint: "ESCs & control boxes" },
  { id: "charger", label: "Charger", icon: BatteryCharging, hint: "Power & charging" },
  { id: "brakes", label: "Brake parts", icon: Disc3, hint: "Pads, discs & levers" },
  { id: "throttle", label: "Throttle / display", icon: Gauge, hint: "Controls & screens" },
  { id: "battery", label: "Battery", icon: BatteryCharging, hint: "Battery packs & BMS" },
  { id: "wheel", label: "Wheel / motor", icon: Disc3, hint: "Wheels, tyres & motors" },
  { id: "electrical", label: "Electrical", icon: Zap, hint: "Cables, lights & switches" },
  { id: "body", label: "Body & hardware", icon: Wrench, hint: "Frame, suspension & fittings" },
  { id: "other", label: "Other parts", icon: Wrench, hint: "Additional catalogue parts" },
];

const ACCENTS = {
  controller: "sky",
  charger: "teal",
  brakes: "rose",
  throttle: "amber",
  battery: "violet",
  wheel: "indigo",
  electrical: "sky",
  body: "amber",
  other: "indigo",
};

function tagToSlug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatPrice(value, currency = "GBP") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price on request";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

function formatApiCost(value) {
  if (!Number.isFinite(value)) return "—";
  return `$${value < 0.001 ? value.toFixed(6) : value.toFixed(4)}`;
}

function stockLabel(inventory) {
  if (inventory > 0) return `${inventory} in stock`;
  if (inventory === 0) return "Out of stock";
  return "Check stock";
}

function titleTerms(value) {
  const ignored = new Set(["i", "need", "a", "an", "the", "for", "my", "dualtron", "mini", "part", "parts", "show", "me"]);
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !ignored.has(word)).map((word) => word.replace(/(ing|ers|er|es|s)$/i, "")) || [])];
}

function matchesTitleIntent(product, terms) {
  const searchable = product.title.toLowerCase();
  return terms.every((term) => searchable.includes(term));
}

const PRODUCTS = SHOPIFY_PRODUCTS.map((product) => ({
  ...product,
  // Compatibility is intentionally gated by Shopify's raw product tags.
  // The model metafield is descriptive metadata, not the inclusion rule.
  compatibilityTags: product.tags.map(tagToSlug),
  subtitle: [product.partsType || "Replacement part", product.assembly?.[0]].filter(Boolean).join(" · "),
  price: formatPrice(product.price, product.currency),
  stock: stockLabel(product.inventory),
  specs: [product.sku ? `SKU ${product.sku}` : null, product.variantTitle !== "Default Title" ? product.variantTitle : null, product.category].filter(Boolean),
  confidence: 0.98,
  accent: ACCENTS[product.category] || "indigo",
}));

const MODELS = [
  { name: "Dualtron Mini", slug: "dualtron-mini", voltage: "52V" },
  { name: "Dualtron Victor", slug: "dualtron-victor", voltage: "60V" },
  { name: "Dualtron Thunder", slug: "dualtron-thunder", voltage: "72V" },
].map((model) => ({
  ...model,
  count: PRODUCTS.filter((product) => product.compatibilityTags.includes(model.slug)).length,
}));

const INTENT_ALIASES = {
  controller: ["controller", "esc", "control box", "speed controller"],
  charger: ["charger", "charging", "charge", "power supply"],
  brakes: ["brake", "brakes", "disc", "rotor", "pads", "lever"],
  throttle: ["throttle", "display", "screen", "dashboard", "handlebar control"],
  battery: ["battery", "batteries", "bms", "battery pack"],
  wheel: ["wheel", "wheels", "motor", "motors", "tyre", "tire", "bearing", "rim"],
  electrical: ["electrical", "cable", "cables", "wiring", "wire", "switch", "light", "lights", "connector", "gps", "dc-dc"],
  body: ["body", "frame", "deck", "fender", "mudguard", "stem", "stand", "footrest", "grip", "suspension", "hinge", "hardware", "bolt", "washer"],
  other: ["other", "accessory", "accessories"],
};

function classifyRequest(value) {
  const query = value.toLowerCase();
  const category = Object.entries(INTENT_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => query.includes(alias)),
  )?.[0];

  if (!category) {
    return { category: null, confidence: 0.42, label: "a scooter part", review: true };
  }

  return {
    category,
    assembly: /\blights?|led|headlights?\b/.test(query) ? "Lights" : null,
    confidence: category === "controller" ? 0.98 : 0.94,
    label: CATEGORIES.find((item) => item.id === category)?.label ?? category,
    review: false,
  };
}

function IconForCategory({ category, size = 22 }) {
  const entry = CATEGORIES.find((item) => item.id === category);
  const Icon = entry?.icon ?? Wrench;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function PartCard({ product, selected, onSelect }) {
  const categoryLabel = CATEGORIES.find((item) => item.id === product.category)?.label ?? "Other part";
  const assemblyValue = product.assembly?.join(" · ") || "Unclassified assembly";
  const subassemblyValue = product.subassembly?.join(" · ") || "Subassembly not set";

  return (
    <article className={`part-card ${selected ? "is-selected" : ""}`}>
      <div className={`part-image part-image-${product.accent}`}>
        {product.imageUrl ? (
          <img className="part-thumb" src={product.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : <div className="part-image-fallback"><IconForCategory category={product.category} size={36} /></div>}
        <span className="image-category">{categoryLabel}</span>
        {product.category === "controller" && <Zap size={14} className="icon-spark" aria-hidden="true" />}
      </div>
      <div className="part-copy">
        <div className="tile-taxonomy">
          <span>{categoryLabel}</span>
          <span>{assemblyValue}</span>
        </div>
        <div className="part-title-row">
          <h3>{product.title}</h3>
          <span className="price">{product.price}</span>
        </div>
        <p>{product.subtitle}</p>
        <div className="tile-subassembly">
          <span>Subassembly</span>
          <strong>{subassemblyValue}</strong>
        </div>
        <div className="part-foot">
          <span className="stock"><span className="stock-dot" />{product.stock}</span>
          <span className="tag-match"><ShieldCheck size={13} aria-hidden="true" /> Tag matched</span>
        </div>
      </div>
      <button className={`select-part ${selected ? "selected" : ""}`} onClick={() => onSelect(product.id)} aria-label={`${selected ? "Remove" : "Pick"} ${product.title}`}>
        {selected ? <Check size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
        {selected ? "Picked" : "Pick"}
      </button>
    </article>
  );
}

function ResultPile({ catalogue, matches, picked, onPick }) {
  const preferred = [...matches, ...catalogue.filter((product) => !matches.some((match) => match.id === product.id))].slice(0, 54);
  const matchIds = new Set(matches.map((product) => product.id));
  return <section className="result-pile" aria-label="JEV sorted product pile">
    <div className="pile-caption"><strong>Compatible product pile</strong><span>{matches.length} raised by JEV</span></div>
    <div className="pile-stage">
      {preferred.map((product, index) => {
        const matchIndex = matches.findIndex((match) => match.id === product.id);
        const isMatch = matchIds.has(product.id);
        // The catalogue is intentionally a loose tabletop scatter. Matches move
        // onto a smaller, irregular "found" cluster rather than a rigid grid.
        const column = index % 12;
        const row = Math.floor(index / 12);
        const pileLeft = 3 + column * 8 + (row % 2 ? 3.8 : 0);
        const pileTop = 39 + row * 11;
        const alignedPositions = [
          [31, 10], [44, 2], [57, 11], [69, 5],
          [37, 30], [51, 24], [64, 31], [74, 26],
          [44, 49], [57, 45], [68, 51], [32, 50],
        ];
        const [alignedLeft, alignedTop] = alignedPositions[Math.max(matchIndex, 0) % alignedPositions.length];
        return <button key={product.id} className={`pile-item ${isMatch ? "is-match" : ""} ${picked.includes(product.id) ? "is-picked" : ""}`} onClick={() => onPick(product.id)} style={{ "--pile-left": `${pileLeft}%`, "--pile-top": `${pileTop}%`, "--aligned-left": `${alignedLeft}%`, "--aligned-top": `${alignedTop}%`, "--rotation": `${(index % 5 - 2) * 2}deg`, "--tile-index": index }} aria-label={`Pick ${product.title}`}>
          {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <IconForCategory category={product.category} size={22} />}
        </button>;
      })}
    </div>
    <p>JEV and title matching raise the most relevant parts; every other item stays in the compatible catalogue.</p>
  </section>;
}

function DecisionPills({ intent, matches }) {
  const assembly = intent.assembly || matches[0]?.assembly?.[0];
  const subassembly = matches[0]?.subassembly?.[0];
  if (!assembly && !subassembly) return null;

  return <div className="decision-pills" aria-label="Part classification">
    {assembly && <span>{assembly}</span>}
    {subassembly && <span>{subassembly}</span>}
  </div>;
}

export function App() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [query, setQuery] = useState("I need a controller for my Dualtron Mini");
  const [submittedQuery, setSubmittedQuery] = useState(query);
  const [picked, setPicked] = useState([]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [assemblyFilter, setAssemblyFilter] = useState("");
  const [subassemblyFilter, setSubassemblyFilter] = useState("");
  const [intent, setIntent] = useState(() => classifyRequest(query));
  const [jevStatus, setJevStatus] = useState("checking");
  const [showJevDetails, setShowJevDetails] = useState(false);
  const [sessionCost, setSessionCost] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [jevRun, setJevRun] = useState(() => ({
    query,
    state: "checking",
    endpoint: "/api/jev-intent",
    duration: null,
    provider: "typesafe/jev-1.13",
    confidence: null,
    probabilities: null,
    usage: null,
  }));

  useEffect(() => {
    let cancelled = false;
    if (!submittedQuery.trim()) {
      setIntent({ category: null, assembly: null, confidence: null, label: "all parts", review: false });
      setJevStatus("idle");
      setJevRun({ query: "", state: "idle", endpoint: "/api/jev-intent", duration: null, provider: "No JEV filter", confidence: null, probabilities: null, usage: null });
      return () => { cancelled = true; };
    }
    async function decide() {
      const startedAt = performance.now();
      setJevStatus("checking");
      setJevRun({ query: submittedQuery, state: "checking", endpoint: "/api/jev-intent", duration: null, provider: "typesafe/jev-1.13", confidence: null, probabilities: null, usage: null });
      try {
        const response = await fetch("/api/jev-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: submittedQuery }),
        });
        if (!response.ok) throw new Error("JEV unavailable");
        const decision = await response.json();
        if (!decision.category) throw new Error("Invalid JEV decision");
        if (!cancelled) {
          setIntent({ category: decision.category, assembly: decision.assembly ?? null, confidence: decision.confidence ?? 0, label: CATEGORIES.find((item) => item.id === decision.category)?.label ?? decision.category, review: false });
          setJevStatus("live");
          const requestCost = Number(decision.usage?.cost ?? 0);
          if (Number.isFinite(requestCost)) setSessionCost((current) => current + requestCost);
          setRequestCount((count) => count + 1);
          setJevRun({ query: submittedQuery, state: "complete", endpoint: "/api/jev-intent", duration: Math.round(performance.now() - startedAt), provider: decision.provider ?? "typesafe/jev-1.13", confidence: decision.confidence ?? null, probabilities: decision.probabilities ?? null, usage: decision.usage ?? null });
        }
      } catch {
        if (!cancelled) {
          setIntent(classifyRequest(submittedQuery));
          setJevStatus("offline");
          setJevRun({ query: submittedQuery, state: "fallback", endpoint: "/api/jev-intent", duration: Math.round(performance.now() - startedAt), provider: "local fallback", confidence: null, probabilities: null, usage: null });
        }
      }
    }
    decide();
    return () => { cancelled = true; };
  }, [submittedQuery]);

  // Wait for a short pause rather than spending one JEV call per keystroke.
  useEffect(() => {
    const nextQuery = query.trim();
    if (!nextQuery || nextQuery === submittedQuery) return undefined;
    const timer = window.setTimeout(() => setSubmittedQuery(nextQuery), 450);
    return () => window.clearTimeout(timer);
  }, [query, submittedQuery]);

  const categoryMatches = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const modelMatch = product.compatibilityTags.includes(selectedModel.slug);
      const categoryMatch = !intent.category || product.category === intent.category;
      return modelMatch && categoryMatch;
    });
  }, [intent.category, selectedModel.slug]);

  const availableAssemblies = useMemo(() => [...new Set(categoryMatches.flatMap((product) => product.assembly || []))].sort(), [categoryMatches]);
  const assemblyMatches = useMemo(() => categoryMatches.filter((product) => !assemblyFilter || product.assembly?.includes(assemblyFilter)), [assemblyFilter, categoryMatches]);
  const availableSubassemblies = useMemo(() => [...new Set(assemblyMatches.flatMap((product) => product.subassembly || []))].sort(), [assemblyMatches]);
  const allMatches = useMemo(() => assemblyMatches.filter((product) => !subassemblyFilter || product.subassembly?.includes(subassemblyFilter)), [assemblyMatches, subassemblyFilter]);
  const specificTitleTerms = useMemo(() => titleTerms(submittedQuery), [submittedQuery]);
  const titleRefinedMatches = useMemo(() => {
    if (specificTitleTerms.length < 2) return allMatches;
    const refined = allMatches.filter((product) => matchesTitleIntent(product, specificTitleTerms));
    return refined.length ? refined : allMatches;
  }, [allMatches, specificTitleTerms]);
  const matches = titleRefinedMatches.slice(0, 24);
  const carouselMatches = submittedQuery.trim() ? titleRefinedMatches.slice(0, 10) : [];
  const usageTokens = jevRun.usage?.total_tokens ?? jevRun.usage?.totalTokens ?? null;
  const usageCost = jevRun.usage?.cost ?? null;

  useEffect(() => {
    setAssemblyFilter(intent.assembly || "");
    setSubassemblyFilter("");
  }, [intent.category, intent.assembly, selectedModel.slug]);

  function submitSearch(event) {
    event.preventDefault();
    setSubmittedQuery(query.trim() || "Show me parts for my scooter");
    setAssemblyFilter("");
    setSubassemblyFilter("");
    setPicked([]);
  }

  function clearSearch() {
    setQuery("");
    setSubmittedQuery("");
    setAssemblyFilter("");
    setSubassemblyFilter("");
    setPicked([]);
  }

  function useCategory(categoryId) {
    const category = CATEGORIES.find((item) => item.id === categoryId);
    const nextQuery = categoryId === "all"
      ? `Show me all parts for my ${selectedModel.name}`
      : `I need a ${category?.label.toLowerCase()} for my ${selectedModel.name}`;
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
    setAssemblyFilter("");
    setSubassemblyFilter("");
    setPicked([]);
  }

  function switchModel(model) {
    setSelectedModel(model);
    setShowModelMenu(false);
    const nextQuery = query.replace(/Dualtron (Mini|Victor|Thunder)/i, model.name);
    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
    setAssemblyFilter("");
    setSubassemblyFilter("");
    setPicked([]);
  }

  function togglePicked(productId) {
    setPicked((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  }

  const modelProductCount = PRODUCTS.filter((product) => product.compatibilityTags.includes(selectedModel.slug)).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Wrench size={17} strokeWidth={2.3} aria-hidden="true" /></div>
          <div>
            <span className="brand-name">PARTS FINDER</span>
            <span className="brand-subtitle">Shopify demo · {jevStatus === "live" ? "JEV decisions live" : "JEV connecting"}</span>
          </div>
        </div>
        <span className="tag-source"><span className="source-pulse" /> Shopify compatibility tags</span>
        <span className="cost-meter"><b>JEV</b><span>last {formatApiCost(Number(jevRun.usage?.cost))}</span><span>session {formatApiCost(sessionCost)} · {requestCount} calls</span></span>
      </header>

      <section className="search-stage">
        <div className="stage-intro">
          <h1>Find the part you need.</h1>
        </div>

        <form className="search-box" onSubmit={submitSearch}>
          <Search size={25} className="search-icon" aria-hidden="true" />
          <input
            aria-label="Describe the scooter part you need"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. I need a controller for my Dualtron Mini"
          />
          {query && <button className="clear-search" type="button" onClick={clearSearch} aria-label="Clear search and show all parts"><X size={18} /></button>}
          <button className="search-submit" type="submit" aria-label="Find parts"><ArrowUpRight size={22} /></button>
        </form>

        <DecisionPills intent={intent} matches={titleRefinedMatches} />

        <div className="context-row">
          <span className="fixed-model"><span className="model-dot" />Dualtron Mini</span>
        </div>

        <ResultPile catalogue={PRODUCTS.filter((product) => product.compatibilityTags.includes(selectedModel.slug))} matches={carouselMatches} picked={picked} onPick={togglePicked} />
      </section>

      <section className="results-section">
        <div className="catalog-filters" aria-label="Catalogue filters">
          <div className="filter-row">
            <span className="filter-label">Assembly</span>
            <div className="filter-chips">
              <button className={`filter-chip ${!assemblyFilter ? "active" : ""}`} onClick={() => { setAssemblyFilter(""); setSubassemblyFilter(""); }}>All assemblies</button>
              {availableAssemblies.map((assembly) => {
                const assemblyCount = categoryMatches.filter((product) => product.assembly?.includes(assembly)).length;
                return <button key={assembly} className={`filter-chip filter-chip-quiet ${assemblyFilter === assembly ? "active" : ""}`} onClick={() => { setAssemblyFilter(assembly); setSubassemblyFilter(""); }}>{assembly}<small>{assemblyCount}</small></button>;
              })}
            </div>
          </div>

          {assemblyFilter && availableSubassemblies.length > 0 && (
            <div className="filter-row subassembly-row">
              <span className="filter-label">Subassembly</span>
              <div className="filter-chips">
                <button className={`filter-chip filter-chip-small ${!subassemblyFilter ? "active" : ""}`} onClick={() => setSubassemblyFilter("")}>All subassemblies</button>
                {availableSubassemblies.map((subassembly) => {
                  const subassemblyCount = assemblyMatches.filter((product) => product.subassembly?.includes(subassembly)).length;
                  return <button key={subassembly} className={`filter-chip filter-chip-small ${subassemblyFilter === subassembly ? "active" : ""}`} onClick={() => setSubassemblyFilter(subassembly)}>{subassembly}<small>{subassemblyCount}</small></button>;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="results-heading">
          <div>
            <h2>{titleRefinedMatches.length} {intent.label} {titleRefinedMatches.length === 1 ? "option" : "options"}</h2>
          </div>
          <div className="result-summary">{selectedModel.name} tag gate · {modelProductCount} compatible parts</div>
        </div>

        <section className={`jev-console jev-console-${jevRun.state}`} aria-live="polite" aria-label="JEV decision console">
          <div className="jev-console-header">
            <div><span className="terminal-prompt">›_</span><strong>JEV decision console</strong><span className="jev-model">{jevRun.provider}</span></div>
            <span className="jev-status"><span />{jevRun.state === "complete" ? "Decision received" : jevRun.state === "checking" ? "Calling JEV…" : jevRun.state === "idle" ? "Showing all parts" : "Local preview fallback"}</span>
          </div>
          <div className="jev-console-body">
            <div className="console-line"><span>01</span><code>{jevRun.state === "idle" ? "No intent filter — full catalogue" : `POST ${jevRun.endpoint}`}</code></div>
            <div className="console-line"><span>02</span><code>{jevRun.state === "idle" ? "request cleared" : `record: “${jevRun.query}”`}</code></div>
            <div className="console-line"><span>03</span><code>category → <b>{intent.category ?? "all parts"}</b>{jevRun.confidence !== null ? ` (${Math.round(jevRun.confidence * 100)}%)` : ""} · assembly → <b>{intent.assembly ?? "all"}</b></code></div>
            <div className="console-line console-safe"><span>04</span><code>Shopify tag gate: <b>{selectedModel.name}</b> → {modelProductCount} compatible products</code></div>
            <div className="console-line"><span>05</span><code>Title refinement: <b>{specificTitleTerms.length > 1 ? specificTitleTerms.join(" + ") : "broad category"}</b> → {titleRefinedMatches.length} results</code></div>
          </div>
          <div className="jev-console-footer"><span>Server-side key stays in Cloudflare</span><span>{jevRun.duration === null ? "running" : `${jevRun.duration} ms`}</span></div>
          {jevRun.state === "complete" && (
            <>
              <button className="jev-details-toggle" onClick={() => setShowJevDetails((open) => !open)} aria-expanded={showJevDetails}>
                {showJevDetails ? "Hide" : "Show"} JEV confidence breakdown <ChevronDown size={14} />
              </button>
              {showJevDetails && (
                <div className="jev-details">
                  <p>JEV scores the fixed choices, then the catalogue applies the selected result.</p>
                  {(Object.entries(jevRun.probabilities || {}).sort(([, a], [, b]) => b - a).slice(0, 4)).map(([category, probability]) => (
                    <div className="jev-probability" key={category}><span>{category}</span><div><i style={{ width: `${Math.round(probability * 100)}%` }} /></div><b>{Math.round(probability * 100)}%</b></div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {picked.length > 0 && (
          <div className="picked-bar"><span><Check size={17} aria-hidden="true" /> {picked.length} part{picked.length === 1 ? "" : "s"} picked</span><button onClick={() => setPicked([])}>Clear selection</button></div>
        )}

        <section className="jev-workings" aria-label="How JEV works">
          <div className="workings-title"><span>How JEV produces these results</span><strong>Live decision trace</strong></div>
          <div className="workings-steps">
            <article><small>01 · INPUT</small><strong>Natural-language request</strong><p>{jevRun.query || "No request — all tagged parts"}</p></article>
            <article><small>02 · JEV</small><strong>Structured decisions</strong><p>Category: <b>{intent.category ?? "all parts"}</b><br />Assembly: <b>{intent.assembly ?? "all"}</b><br />Confidence: <b>{jevRun.confidence === null ? "—" : `${Math.round(jevRun.confidence * 100)}%`}</b></p></article>
            <article><small>03 · SAFETY GATE</small><strong>Shopify compatibility</strong><p>Exact product tag: <b>Dualtron Mini</b><br />Eligible products: <b>{modelProductCount}</b></p></article>
            <article><small>04 · RESULT</small><strong>Title-refined catalogue</strong><p>Title terms: <b>{specificTitleTerms.length > 1 ? specificTitleTerms.join(", ") : "broad category"}</b><br />Displayed: <b>{titleRefinedMatches.length}</b><br />Latency: <b>{jevRun.duration === null ? "—" : `${jevRun.duration} ms`}</b><br />Tokens: <b>{usageTokens ?? "not reported"}</b><br />Cost: <b>{usageCost ?? "not reported"}</b></p></article>
          </div>
          <p className="workings-note">JEV determines the intent; it never decides product compatibility. The Shopify model tag is always the final gate.</p>
        </section>
      </section>
    </main>
  );
}

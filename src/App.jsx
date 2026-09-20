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

function stockLabel(inventory) {
  if (inventory > 0) return `${inventory} in stock`;
  if (inventory === 0) return "Out of stock";
  return "Check stock";
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
  const [jevRun, setJevRun] = useState(() => ({
    query,
    state: "checking",
    endpoint: "/api/jev-intent",
    duration: null,
    provider: "typesafe/jev-1.13",
    confidence: null,
    probabilities: null,
  }));

  useEffect(() => {
    let cancelled = false;
    async function decide() {
      const startedAt = performance.now();
      setJevStatus("checking");
      setJevRun({ query: submittedQuery, state: "checking", endpoint: "/api/jev-intent", duration: null, provider: "typesafe/jev-1.13", confidence: null, probabilities: null });
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
          setJevRun({ query: submittedQuery, state: "complete", endpoint: "/api/jev-intent", duration: Math.round(performance.now() - startedAt), provider: decision.provider ?? "typesafe/jev-1.13", confidence: decision.confidence ?? null, probabilities: decision.probabilities ?? null });
        }
      } catch {
        if (!cancelled) {
          setIntent(classifyRequest(submittedQuery));
          setJevStatus("offline");
          setJevRun({ query: submittedQuery, state: "fallback", endpoint: "/api/jev-intent", duration: Math.round(performance.now() - startedAt), provider: "local fallback", confidence: null, probabilities: null });
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
  const matches = allMatches.slice(0, 24);

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
          {query && <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={18} /></button>}
          <button className="search-submit" type="submit" aria-label="Find parts"><ArrowUpRight size={22} /></button>
        </form>

        <div className="context-row">
          <div className="model-selector-wrap">
            <span className="context-label">Scooter context</span>
            <button className="model-selector" onClick={() => setShowModelMenu((open) => !open)} aria-expanded={showModelMenu}>
              <span className="model-dot" />
              <strong>{selectedModel.name}</strong>
              <span>{selectedModel.voltage}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            {showModelMenu && (
              <div className="model-menu">
                {MODELS.map((model) => (
                  <button key={model.slug} className={model.slug === selectedModel.slug ? "active" : ""} onClick={() => switchModel(model)}>
                    <span><strong>{model.name}</strong><small>{model.voltage} · {model.count} tagged parts</small></span>
                    {model.slug === selectedModel.slug && <Check size={15} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
            <h2>{allMatches.length} {intent.label} {allMatches.length === 1 ? "option" : "options"}</h2>
          </div>
          <div className="result-summary">{selectedModel.name} tag gate · {modelProductCount} compatible parts</div>
        </div>

        <section className={`jev-console jev-console-${jevRun.state}`} aria-live="polite" aria-label="JEV decision console">
          <div className="jev-console-header">
            <div><span className="terminal-prompt">›_</span><strong>JEV decision console</strong><span className="jev-model">{jevRun.provider}</span></div>
            <span className="jev-status"><span />{jevRun.state === "complete" ? "Decision received" : jevRun.state === "checking" ? "Calling JEV…" : "Local preview fallback"}</span>
          </div>
          <div className="jev-console-body">
            <div className="console-line"><span>01</span><code>POST {jevRun.endpoint}</code></div>
            <div className="console-line"><span>02</span><code>record: “{jevRun.query}”</code></div>
            <div className="console-line"><span>03</span><code>category → <b>{intent.category ?? "awaiting decision"}</b>{jevRun.confidence !== null ? ` (${Math.round(jevRun.confidence * 100)}%)` : ""} · assembly → <b>{intent.assembly ?? "all"}</b></code></div>
            <div className="console-line console-safe"><span>04</span><code>Shopify tag gate: <b>{selectedModel.name}</b> → {modelProductCount} compatible products</code></div>
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

        <div className="product-grid">
          {matches.length > 0 ? matches.map((product) => (
            <PartCard key={product.id} product={product} selected={picked.includes(product.id)} onSelect={togglePicked} />
          )) : (
            <div className="empty-state"><CircleAlert size={24} /><strong>No tagged matches yet</strong><span>Try another category, assembly, subassembly or scooter model.</span></div>
          )}
        </div>

        {allMatches.length > matches.length && (
          <div className="grid-more"><span>Showing {matches.length} of {allMatches.length} matching parts</span><span>Use the filters above to narrow the catalogue</span></div>
        )}

        {picked.length > 0 && (
          <div className="picked-bar"><span><Check size={17} aria-hidden="true" /> {picked.length} part{picked.length === 1 ? "" : "s"} picked</span><button onClick={() => setPicked([])}>Clear selection</button></div>
        )}
      </section>
    </main>
  );
}

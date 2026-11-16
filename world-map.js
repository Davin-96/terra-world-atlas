(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const D = window.WORLD_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  const bootEl = $("#boot");
  const bootLog = $("#boot-log");
  const bootFill = $("#boot-bar-fill");
  const bootPct = $("#boot-pct");
  const bootError = $("#boot-error");

  if (!D) {
    bootEl.classList.add("error");
    bootLog.textContent = "DATA CORE OFFLINE";
    bootError.textContent = "未找到 world-data.js，请确认数据文件与页面位于同一目录。";
    $("#boot-retry").addEventListener("click", () => location.reload());
    return;
  }

  const byA3 = new Map(D.countries.map((c) => [c.a3, c]));
  const byKey = new Map(D.countries.map((c) => [String(c.key).padStart(3, "0"), c]));
  const orgById = new Map(D.orgs.map((o) => [o.id, o]));
  const contById = new Map(D.continents.map((c) => [c.id, c]));
  const CAT_ORDER = ["全球治理", "合作倡议", "欧洲", "亚太", "中东", "美洲", "非洲", "能源与跨区域", "安全机制"];
  const CONT_CODE = {
    asia: "AS", europe: "EU", africa: "AF", "north-america": "NA",
    "south-america": "SA", oceania: "OC", antarctica: "AN"
  };
  const CONT_CENTER = {
    asia: [30, 90], europe: [52, 15], africa: [3, 20],
    "north-america": [45, -100], "south-america": [-15, -60],
    oceania: [-25, 145], antarctica: [-70, 20]
  };
  const OCEANS = [
    { zh: "太平洋", en: "PACIFIC OCEAN", lon: -150, lat: 0 },
    { zh: "大西洋", en: "ATLANTIC OCEAN", lon: -28, lat: 22 },
    { zh: "印度洋", en: "INDIAN OCEAN", lon: 78, lat: -24 },
    { zh: "北冰洋", en: "ARCTIC OCEAN", lon: 70, lat: 80 }
  ];
  const SEAS = [
    { zh: "地中海", en: "MEDITERRANEAN", lon: 17, lat: 34.5, major: true },
    { zh: "黑海", en: "BLACK SEA", lon: 34, lat: 43, major: true },
    { zh: "红海", en: "RED SEA", lon: 38, lat: 20, major: true },
    { zh: "波斯湾", en: "PERSIAN GULF", lon: 50.5, lat: 27, major: true },
    { zh: "阿拉伯海", en: "ARABIAN SEA", lon: 63, lat: 15, major: true },
    { zh: "孟加拉湾", en: "BAY OF BENGAL", lon: 88, lat: 15, major: true },
    { zh: "南海", en: "SOUTH CHINA SEA", lon: 113, lat: 14, major: true },
    { zh: "东海", en: "EAST CHINA SEA", lon: 125, lat: 28.5 },
    { zh: "黄海", en: "YELLOW SEA", lon: 123, lat: 35 },
    { zh: "日本海", en: "SEA OF JAPAN", lon: 134, lat: 40, major: true },
    { zh: "鄂霍次克海", en: "SEA OF OKHOTSK", lon: 150, lat: 54 },
    { zh: "白令海", en: "BERING SEA", lon: -178, lat: 58 },
    { zh: "北海", en: "NORTH SEA", lon: 3, lat: 56, major: true },
    { zh: "波罗的海", en: "BALTIC SEA", lon: 19, lat: 57.5 },
    { zh: "加勒比海", en: "CARIBBEAN SEA", lon: -75, lat: 15, major: true },
    { zh: "墨西哥湾", en: "GULF OF MEXICO", lon: -90, lat: 25, major: true },
    { zh: "珊瑚海", en: "CORAL SEA", lon: 155, lat: -17, major: true },
    { zh: "塔斯曼海", en: "TASMAN SEA", lon: 160, lat: -38 },
    { zh: "里海", en: "CASPIAN SEA", lon: 51, lat: 42 },
    { zh: "五大湖", en: "GREAT LAKES", lon: -85, lat: 44 },
    { zh: "贝加尔湖", en: "LAKE BAIKAL", lon: 107, lat: 53.5 },
    { zh: "维多利亚湖", en: "LAKE VICTORIA", lon: 33, lat: -1 },
    { zh: "亚丁湾", en: "GULF OF ADEN", lon: 46.5, lat: 12 },
    { zh: "阿曼湾", en: "GULF OF OMAN", lon: 58, lat: 24 },
    { zh: "泰国湾", en: "GULF OF THAILAND", lon: 101, lat: 8.5 },
    { zh: "几内亚湾", en: "GULF OF GUINEA", lon: 2, lat: 2 },
    { zh: "大澳大利亚湾", en: "GREAT AUSTRALIAN BIGHT", lon: 132, lat: -35 },
    { zh: "哈德逊湾", en: "HUDSON BAY", lon: -85, lat: 59 },
    { zh: "巴伦支海", en: "BARENTS SEA", lon: 40, lat: 74 },
    { zh: "挪威海", en: "NORWEGIAN SEA", lon: 4, lat: 66 }
  ];
  const SEA_ROUTES = [
    {
      zh: "亚欧航线", line: [[121.5, 31.2], [118, 22], [110, 10], [104, 2], [100.5, 4.5], [98, 7],
        [93, 6], [85, 6], [75, 8], [65, 12], [56, 13], [48, 12.5], [43.5, 13.5], [41, 17],
        [37, 23], [34, 28], [32.5, 30.5], [30, 32], [20, 34.5], [10, 37], [2, 37], [-5.5, 36], [-9, 37]]
    },
    {
      zh: "跨太平洋航线", line: [[121.5, 31.2], [132, 34], [145, 37], [160, 40], [175, 42],
        [-170, 42], [-150, 41], [-132, 38], [-122, 34.5], [-118.2, 33.7]]
    },
    {
      zh: "跨大西洋航线", line: [[-74, 40.5], [-62, 44], [-48, 48], [-30, 50], [-15, 50],
        [-6, 48.5], [-1.5, 50.3]]
    },
    {
      zh: "巴拿马航线", line: [[-76, 11], [-79, 9.4], [-79.7, 8.8], [-81.5, 7.5], [-86, 5.5], [-92, 4]]
    },
    {
      zh: "好望角航线", line: [[-9, 37], [-15, 30], [-17, 20], [-14, 8], [-5, 0], [3, -6],
        [8, -15], [13, -26], [18, -34.5], [24, -36], [32, -33], [42, -30], [52, -24], [60, -15],
        [68, -5], [75, 4], [82, 8], [90, 8], [97, 6], [100.5, 4.5]]
    },
    {
      zh: "北欧航线", line: [[-1.5, 50.3], [2, 51.3], [4, 52.5], [7, 54], [9, 57], [11, 58.5]]
    },
    {
      zh: "北极航道", arctic: true, line: [[170, 66], [155, 71], [130, 74], [100, 77], [70, 76],
        [45, 74], [25, 72], [10, 70], [5, 62]]
    }
  ];
  const CHOKEPOINTS = [
    { zh: "马六甲海峡", en: "MALACCA", lon: 103.8, lat: 1.6 },
    { zh: "苏伊士运河", en: "SUEZ", lon: 32.4, lat: 30.4 },
    { zh: "巴拿马运河", en: "PANAMA", lon: -79.6, lat: 9.1 },
    { zh: "霍尔木兹海峡", en: "HORMUZ", lon: 56.5, lat: 26.6 },
    { zh: "直布罗陀海峡", en: "GIBRALTAR", lon: -5.6, lat: 35.9 },
    { zh: "曼德海峡", en: "BAB-EL-MANDEB", lon: 43.3, lat: 12.6 },
    { zh: "好望角", en: "CAPE OF GOOD HOPE", lon: 18.5, lat: -34.4 },
    { zh: "英吉利海峡", en: "DOVER", lon: 1.4, lat: 51.0 }
  ];
  const ALIASES = {
    GBR: ["uk", "britain", "england"], USA: ["us", "america", "united states", "美国"],
    ARE: ["uae"], KOR: ["南韩", "南朝鲜"], PRK: ["北韩"], NLD: ["holland", "荷兰"],
    CIV: ["cote d'ivoire", "象牙海岸"], COD: ["drc", "congo kinshasa", "刚果金"],
    COG: ["congo brazzaville", "刚果布"], TWN: ["台湾"], HKG: ["香港"], MAC: ["澳门"],
    XKX: ["kosovo"], CZE: ["czech republic"], SWZ: ["swaziland"], TLS: ["east timor"],
    CPV: ["cape verde"], MKD: ["macedonia"], BHS: ["bahamas"], GMB: ["the gambia"]
  };

  const state = {
    mode: "globe",
    rotation: [-105, -18],
    globeScale: 1,
    flatZoom: { x: 0, y: 0, k: 1 },
    w: 0, h: 0, dpr: 1,
    canvas: null, ctx: null,
    globeProj: null,
    flatProj: null,
    prep110: null,
    prep50: null,
    loading50: null,
    hover: null,
    selected: null,
    activeOrg: null,
    activeCont: null,
    highlightSet: null,
    neighborSet: null,
    exitAnim: null,
    focusPending: null,
    focusTimer: 0,
    playing: !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
    animating: false,
    dragging: false,
    pointerDown: false,
    moved: false,
    pointers: new Map(),
    pinch: null,
    cursor: null,
    dirty: true,
    booted: false,
    raf: 0,
    rotRaf: 0,
    lastFrame: 0,
    lastHit: 0,
    lastHoverA3: null,
    stageMsgTimer: 0
  };

  const canvas = $("#map");
  const stage = $("#stage");
  const sidebar = $("#sidebar");
  const scrim = $("#scrim");
  const info = $("#info");
  const infoBody = $("#info-body");
  const infoEyebrow = $("#info-eyebrow");
  const tooltip = $("#tooltip");
  const ttZh = $(".tt-zh", tooltip);
  const ttEn = $(".tt-en", tooltip);
  const ttMeta = $(".tt-meta", tooltip);
  const breadcrumb = $("#breadcrumb");
  const searchInput = $("#search-input");
  const searchResults = $("#search-results");
  const sideLists = $("#side-lists");
  const aboutModal = $("#about-modal");
  const menuBtn = $("#menu-btn");
  const stageMsg = $("#stage-msg");
  const stageMsgText = $("#stage-msg-text");

  /* ------------------------------------------------------------------ *
   *  boot / CDN
   * ------------------------------------------------------------------ */

  function setBoot(pct, msg) {
    const p = clamp(pct, 0, 100);
    bootFill.style.width = p + "%";
    bootPct.textContent = String(Math.round(p)).padStart(3, "0") + "%";
    if (msg) bootLog.textContent = msg;
  }

  function bootFail(message) {
    bootEl.classList.add("error");
    bootLog.textContent = "CORE INITIALIZATION FAILED";
    bootError.textContent = message || "地图引擎加载失败，请检查网络连接后重试。";
  }

  $("#boot-retry").addEventListener("click", () => location.reload());

  // 加载来源标记：local = 本地 vendor 文件，cdn = 在线回退。用于侧栏离线徽章与自验。
  state.dataSource = "local";

  function markSource(src) {
    if (src === "cdn") state.dataSource = "cdn";
    const badge = $("#offline-badge");
    if (!badge) return;
    if (src === "cdn") {
      badge.textContent = "在线";
      badge.className = "offline-badge cdn";
      badge.title = "本地数据不可用，已回退在线 CDN";
    } else {
      badge.textContent = "离线可用";
      badge.className = "offline-badge local";
      badge.title = "已从本地加载引擎与国界数据，断网也能使用";
    }
  }

  function loadScript(urls, check) {
    // 若全局对象已由本地 <script> 注入，直接通过，不发网络请求。
    if (check && check()) { markSource("local"); return Promise.resolve(); }
    return new Promise((resolve, reject) => {
      let remaining = urls.length;
      let settled = false;
      const nodes = [];
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        nodes.forEach((n) => n.remove());
        reject(new Error("CDN script timeout"));
      }, 20000);
      for (const url of urls) {
        const s = document.createElement("script");
        s.src = url;
        s.async = true;
        nodes.push(s);
        s.onload = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          nodes.forEach((n) => { if (n !== s && n.parentNode) n.remove(); });
          markSource("cdn");
          resolve();
        };
        s.onerror = () => {
          s.remove();
          if (settled) return;
          if (--remaining === 0) {
            settled = true;
            clearTimeout(timer);
            reject(new Error("All CDN sources failed"));
          }
        };
        document.head.appendChild(s);
      }
    });
  }

  async function fetchOne(url, onProgress, controllers) {
    const controller = new AbortController();
    controllers.push(controller);
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, { mode: "cors", cache: "force-cache", signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const total = Number(res.headers.get("content-length")) || 0;
      if (!res.body || !total) {
        const data = await res.json();
        if (onProgress) onProgress(1);
        return data;
      }
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (onProgress) onProgress(clamp(received / total, 0, 1));
      }
      const buf = new Uint8Array(received);
      let off = 0;
      for (const chunk of chunks) { buf.set(chunk, off); off += chunk.length; }
      const text = new TextDecoder("utf-8").decode(buf);
      return JSON.parse(text);
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchJSON(urls, onProgress) {
    const controllers = [];
    let progress = 0;
    const report = (p) => {
      progress = Math.max(progress, p);
      if (onProgress) onProgress(progress);
    };
    try {
      const data = await Promise.any(urls.map((url) => fetchOne(url, report, controllers)));
      controllers.forEach((c) => c.abort());
      markSource("cdn");
      return data;
    } catch (err) {
      throw new Error("CDN 数据加载失败");
    }
  }

  // 国界数据：优先本地全局变量（<script> 注入，file:// 下不受 CORS 限制），否则回退 CDN。
  function loadGeo(kind, urls, onProgress) {
    const local = window.TERRA_GEO && window.TERRA_GEO[kind];
    if (local) {
      markSource("local");
      if (onProgress) { onProgress(0.6); onProgress(1); }
      return Promise.resolve(local);
    }
    return fetchJSON(urls, onProgress);
  }

  const D3_URLS = [
    "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js",
    "https://unpkg.com/d3@7.9.0/dist/d3.min.js"
  ];
  const TOPO_URLS = [
    "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js",
    "https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js"
  ];
  const GEO_110 = [
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    "https://unpkg.com/world-atlas@2/countries-110m.json"
  ];
  const GEO_50 = [
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
    "https://unpkg.com/world-atlas@2/countries-50m.json"
  ];

  /* ------------------------------------------------------------------ *
   *  data prep
   * ------------------------------------------------------------------ */

  const NAME_MAP = { Kosovo: "XKX", "N. Cyprus": "XNC", Somaliland: "XSO" };
  let graticule = null;
  const EQUATOR = { type: "LineString", coordinates: [] };
  const PRIME_MERIDIAN = { type: "LineString", coordinates: [] };

  function initGeoConstants() {
    graticule = d3.geoGraticule().step([15, 15])();
    const eq = [];
    for (let l = -180; l <= 180; l += 5) eq.push([l, 0]);
    EQUATOR.coordinates = eq;
    const pm = [];
    for (let p = -80; p <= 80; p += 5) pm.push([0, p]);
    PRIME_MERIDIAN.coordinates = pm;
  }

  // 海外飞地邻接剔除阈值（球面角）：若两国只在距某方主体领土极远的海外 polygon 上接触，
  // 视为飞地接触、不算陆上邻国。取 50°：法国→法属圭亚那（巴西/苏里南）约 64° 被剔除；
  // 俄罗斯→加里宁格勒（波兰/立陶宛）约 36° 保留。在 50m 数据集上实测仅剔除法国→巴西/苏里南。
  const OVERSEAS_CONTACT_RAD = 50 * RAD;

  function geomPolys(g) { return g.type === "Polygon" ? [g.arcs] : (g.arcs || []); }
  function polyArcSet(poly) {
    const s = new Set();
    for (const ring of poly) for (const a of ring) s.add(a < 0 ? ~a : a);
    return s;
  }
  // 预计算某 geometry 的多边形级信息：主体 polygon 索引、主体质心、每个 polygon 的 arc 集合与质心。
  function prepGeomMeta(topology, geoms) {
    return geoms.map((g) => {
      const polys = geomPolys(g);
      let mainIdx = 0, maxArcs = -1;
      polys.forEach((p, k) => {
        const n = p.reduce((s, r) => s + r.length, 0);
        if (n > maxArcs) { maxArcs = n; mainIdx = k; }
      });
      const f = topojson.feature(topology, { type: "GeometryCollection", geometries: [g] }).features[0];
      const geo = f.geometry;
      const centroidOf = (pi) => {
        const coords = geo.type === "Polygon" ? geo.coordinates : geo.coordinates[pi];
        return coords ? d3.geoCentroid({ type: "Polygon", coordinates: coords }) : null;
      };
      return {
        polys,
        mainIdx,
        mainCentroid: centroidOf(mainIdx),
        centroids: polys.map((_, pi) => centroidOf(pi)),
        arcSets: polys.map((p) => polyArcSet(p))
      };
    });
  }

  function prepTopology(topology) {
    const collection = topojson.feature(topology, topology.objects.countries);
    const feats = collection.features;
    const geoms = topology.objects.countries.geometries;
    const present = new Set();
    const gmeta = prepGeomMeta(topology, geoms);

    for (const f of feats) {
      const id = f.id == null ? null : String(f.id).padStart(3, "0");
      let a3 = null;
      if (id) {
        const c = byKey.get(id);
        if (c) {
          const n = String(f.properties && f.properties.name || "");
          if (!(id === "036" && /Ashmore/i.test(n))) a3 = c.a3;
        }
      }
      if (!a3 && f.properties) a3 = NAME_MAP[f.properties.name] || null;
      f.__a3 = a3;
      if (a3) {
        f.__name = byA3.get(a3) ? byA3.get(a3).zh : (f.properties.name || a3);
        f.__centroid = d3.geoCentroid(f);
        f.__area = d3.geoArea(f);
        present.add(a3);
      }
    }

    const hitFeats = feats.filter((f) => f.__a3).sort((a, b) => a.__area - b.__area);
    const neighborIdx = topojson.neighbors(geoms);
    const neighbors = new Map();
    // 通用海外领地规则：仅当两国完全没有主体对主体的边界接触，且所有接触都发生在
    // 距某方主体 >50° 的海外 polygon（如法属圭亚那）上时，才剔除这条邻接。
    // 这样俄罗斯的全部 14 个陆上邻国（含经加里宁格勒接触的波兰/立陶宛）都完整保留。
    function isOverseasOnly(i, j) {
      const mi = gmeta[i], mj = gmeta[j];
      if (!mi || !mj) return false;
      const jAllArcs = new Set();
      mj.arcSets.forEach((s) => s.forEach((a) => jAllArcs.add(a)));
      let touchesMain = false, minFarDist = Infinity;
      mi.polys.forEach((p, pi) => {
        let shares = false;
        for (const a of mi.arcSets[pi]) if (jAllArcs.has(a)) { shares = true; break; }
        if (!shares) return;
        if (pi === mi.mainIdx) { touchesMain = true; return; }
        const c = mi.centroids[pi];
        if (c && mi.mainCentroid) minFarDist = Math.min(minFarDist, d3.geoDistance(c, mi.mainCentroid));
      });
      if (touchesMain) return false;
      return minFarDist > OVERSEAS_CONTACT_RAD;
    }
    feats.forEach((f, i) => {
      if (!f.__a3) return;
      const arr = [];
      for (const j of neighborIdx[i] || []) {
        const other = feats[j] && feats[j].__a3;
        if (!other || other === f.__a3) continue;
        if (isOverseasOnly(i, j)) continue;
        arr.push(other);
      }
      neighbors.set(f.__a3, Array.from(new Set(arr)));
    });

    const markerMap = new Map();
    for (const m of D.markers) {
      const c = byA3.get(m.a3);
      markerMap.set(m.a3, { a3: m.a3, zh: c ? c.zh : m.zh, lat: m.lat, lon: m.lon });
    }
    for (const c of D.countries) {
      if (present.has(c.a3) || markerMap.has(c.a3) || c.a3 === "ATA") continue;
      if (c.lat == null || c.lon == null) continue;
      if (c.sovereign || ["TWN", "PSE", "ESH", "XKX", "XNC", "XSO", "HKG", "MAC", "GRL", "PRI", "NCL", "FLK", "ATF"].includes(c.a3)) {
        markerMap.set(c.a3, { a3: c.a3, zh: c.zh, lat: c.lat, lon: c.lon });
      }
    }

    const byA3Feature = new Map();
    for (const f of feats) if (f.__a3) byA3Feature.set(f.__a3, f);

    for (const [a3, arr] of neighbors) {
      const base = byA3Feature.get(a3);
      if (!base) continue;
      arr.sort((x, y) => {
        const fx = byA3Feature.get(x), fy = byA3Feature.get(y);
        if (!fx || !fy) return 0;
        return d3.geoDistance(base.__centroid, fx.__centroid) - d3.geoDistance(base.__centroid, fy.__centroid);
      });
    }

    return { feats, hitFeats, neighbors, markers: Array.from(markerMap.values()), byA3Feature };
  }

  function activePrep() {
    if (state.mode === "globe") return state.prep110;
    return state.prep50 || state.prep110;
  }

  function loadGeo50() {
    if (state.prep50) return Promise.resolve(state.prep50);
    if (state.loading50) return state.loading50;
    state.loading50 = loadGeo("50", GEO_50)
      .then((topo) => {
        state.prep50 = prepTopology(topo);
        refreshHighlight();
        if (state.mode === "flat") {
          hideStageMsg();
          state.dirty = true;
        }
        return state.prep50;
      })
      .catch((err) => {
        console.warn("50m boundary load failed, falling back to 110m", err);
        if (state.mode === "flat") {
          showStageMsg("高精度国界不可用，已使用标准精度", 3200);
        }
        return null;
      })
      .finally(() => { state.loading50 = null; });
    return state.loading50;
  }

  function showStageMsg(text, autoHide) {
    clearTimeout(state.stageMsgTimer);
    stageMsgText.textContent = text;
    stageMsg.hidden = false;
    if (autoHide) {
      state.stageMsgTimer = setTimeout(hideStageMsg, autoHide);
    }
  }
  function hideStageMsg() {
    clearTimeout(state.stageMsgTimer);
    stageMsg.hidden = true;
  }

  /* ------------------------------------------------------------------ *
   *  formatting
   * ------------------------------------------------------------------ */

  function fmtPop(n) {
    if (!n) return "—";
    if (n >= 1e8) return (n / 1e8).toFixed(2) + " 亿";
    if (n >= 1e4) return (n / 1e4).toFixed(1) + " 万";
    return String(n);
  }
  function fmtArea(n) {
    if (!n) return "—";
    if (n >= 1e4) return (n / 1e4).toFixed(1) + " 万 km²";
    return n.toFixed(n < 10 ? 2 : 0) + " km²";
  }
  function fmtCoord(lat, lon) {
    const la = Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S");
    const lo = Math.abs(lon).toFixed(1) + "°" + (lon >= 0 ? "E" : "W");
    return { la, lo };
  }
  function fmtLat(lat) { return Math.abs(lat).toFixed(1) + "°" + (lat >= 0 ? "N" : "S"); }
  function fmtLon(lon) { return Math.abs(lon).toFixed(1) + "°" + (lon >= 0 ? "E" : "W"); }
  function hemisphere(lat, lon) {
    return (lat >= 0 ? "北半球" : "南半球") + " · " + (lon >= 0 ? "东半球" : "西半球");
  }

  /* ------------------------------------------------------------------ *
   *  sidebar / search
   * ------------------------------------------------------------------ */

  function renderSidebar() {
    const cont = D.continents.map((c) => {
      const all = D.countries.filter((x) => x.continent === c.zh);
      const sovereign = all.filter((x) => x.sovereign).length;
      return `<button type="button" class="row" data-cont="${c.id}">
        <span class="row-ico">${CONT_CODE[c.id] || "—"}</span>
        <span class="row-main">
          <span class="row-name">${esc(c.zh)}</span>
          <span class="row-sub">${esc(c.en)}</span>
        </span>
        <span class="row-count">${sovereign || "—"}</span>
      </button>`;
    }).join("");

    const groups = CAT_ORDER.map((cat) => {
      const list = D.orgs.filter((o) => o.cat === cat);
      if (!list.length) return "";
      const rows = list.map((o) => `<button type="button" class="row" data-org="${o.id}">
        <span class="row-ico" title="${esc(o.abbr)}">${esc(o.abbr.slice(0, 4))}</span>
        <span class="row-main">
          <span class="row-name">${esc(o.zh)}</span>
          <span class="row-sub">${esc(o.en)}</span>
        </span>
        <span class="row-count">${o.count}</span>
      </button>`).join("");
      return `<details class="org-group" open>
        <summary>${esc(cat)}<span class="gcount">${list.length}</span></summary>
        <div class="group-body">${rows}</div>
      </details>`;
    }).join("");

    $("#continent-list").innerHTML = cont;
    $("#org-list").innerHTML = groups;
  }

  function normalize(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }

  function countryScore(c, q) {
    const qq = normalize(q);
    const values = [c.zh, c.en, c.a3, c.a2].concat(ALIASES[c.a3] || []).map(normalize);
    let score = 99;
    for (const v of values) {
      if (!v) continue;
      if (v === qq) score = Math.min(score, 0);
      else if (v.startsWith(qq)) score = Math.min(score, 1);
      else if (v.includes(qq)) score = Math.min(score, 2);
    }
    return score;
  }

  function renderSearchResults(query) {
    const q = normalize(query);
    if (!q) {
      sideLists.hidden = false;
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }
    const cs = D.countries
      .map((c) => ({ c, s: countryScore(c, q) }))
      .filter((x) => x.s < 99)
      .sort((a, b) => a.s - b.s || a.c.zh.localeCompare(b.c.zh, "zh-Hans-CN"))
      .slice(0, 8);
    const os = D.orgs
      .filter((o) => [o.zh, o.en, o.abbr, o.id].some((v) => normalize(v).includes(q)))
      .sort((a, b) => a.zh.localeCompare(b.zh, "zh-Hans-CN"))
      .slice(0, 6);

    let html = "";
    if (cs.length) {
      html += `<div class="result-label">国家 / COUNTRIES · ${cs.length}</div>`;
      html += cs.map(({ c }) => `<button type="button" class="row result-row" data-a3="${c.a3}">
        <span class="row-ico">${esc(c.a3)}</span>
        <span class="row-main">
          <span class="row-name">${esc(c.zh)}</span>
          <span class="row-sub">${esc(c.en)} · ${esc(c.continent)}</span>
        </span>
        <span class="tag">国家</span>
      </button>`).join("");
    }
    if (os.length) {
      html += `<div class="result-label">组织 / ORGANIZATIONS · ${os.length}</div>`;
      html += os.map((o) => `<button type="button" class="row result-row" data-org="${o.id}">
        <span class="row-ico">${esc(o.abbr.slice(0, 4))}</span>
        <span class="row-main">
          <span class="row-name">${esc(o.zh)}</span>
          <span class="row-sub">${esc(o.en)}</span>
        </span>
        <span class="tag">组织</span>
      </button>`).join("");
    }
    if (!html) {
      html = `<div class="result-empty">没有找到「${esc(query)}」<br>试试中文名、英文名或缩写</div>`;
    }
    sideLists.hidden = true;
    searchResults.hidden = false;
    searchResults.innerHTML = html;
  }

  function clearSearch() {
    searchInput.value = "";
    renderSearchResults("");
    updateCoord();
  }

  function focusSearch() {
    searchInput.focus();
    searchInput.select();
  }

  /* ------------------------------------------------------------------ *
   *  selection / state
   * ------------------------------------------------------------------ */

  function refreshHighlight() {
    let set = null;
    if (state.activeOrg) {
      const o = orgById.get(state.activeOrg);
      if (o) set = new Set(o.members);
    } else if (state.activeCont) {
      const c = contById.get(state.activeCont);
      if (c) set = new Set(D.countries.filter((x) => x.continent === c.zh).map((x) => x.a3));
    }
    state.highlightSet = set;

    let nbs = null;
    if (state.selected) {
      const prep = activePrep();
      const list = prep && prep.neighbors.get(state.selected);
      if (list && list.length) {
        nbs = new Set(list);
        nbs.delete(state.selected);
        if (!nbs.size) nbs = null;
      }
    }
    state.neighborSet = nbs;

    const count = set ? set.size : (state.selected ? 1 : null);
    $("#hl-count").textContent = count == null ? "—" : String(count);
  }

  function updateSidebarActive() {
    $$("[data-org]").forEach((el) => {
      el.classList.toggle("active", !!state.activeOrg && el.dataset.org === state.activeOrg);
    });
    $$("[data-cont]").forEach((el) => {
      el.classList.toggle("active", !!state.activeCont && el.dataset.cont === state.activeCont);
    });
  }

  function updateBreadcrumb() {
    const parts = [{ label: "全球", action: "global", current: false }];
    if (state.activeCont) {
      const c = contById.get(state.activeCont);
      if (c) parts.push({ label: c.zh, action: "cont:" + c.id, current: !state.selected });
    }
    if (state.activeOrg) {
      const o = orgById.get(state.activeOrg);
      if (o) parts.push({ label: o.zh, action: "org:" + o.id, current: !state.selected });
    }
    if (state.selected) {
      const c = byA3.get(state.selected);
      if (c) parts.push({ label: c.zh, action: "country:" + c.a3, current: true });
    }
    breadcrumb.innerHTML = parts.map((p, i) =>
      `${i ? '<span class="sep">/</span>' : ""}<button type="button" data-crumb="${p.action}" class="${p.current ? "current" : ""}">${esc(p.label)}</button>`
    ).join("");
  }

  function updateCoord() {
    let lat = null, lon = null, name = "GLOBAL VIEW";
    const hoverC = state.hover ? byA3.get(state.hover.a3) : null;
    const selC = state.selected ? byA3.get(state.selected) : null;
    if (hoverC) {
      lat = hoverC.lat; lon = hoverC.lon; name = hoverC.zh;
    } else if (selC) {
      lat = selC.lat; lon = selC.lon; name = selC.zh;
    } else if (state.cursor) {
      lat = state.cursor[1]; lon = state.cursor[0]; name = "CURSOR";
    }
    $("#coord-lat").textContent = lat == null ? "--" : fmtLat(lat);
    $("#coord-lon").textContent = lon == null ? "--" : fmtLon(lon);
    $("#coord-name").textContent = name;
  }

  function updateAll() {
    refreshHighlight();
    updateSidebarActive();
    updateBreadcrumb();
    updateCoord();
  }

  function openInfo() {
    info.classList.add("open");
    info.setAttribute("aria-hidden", "false");
    if (window.innerWidth <= 900) closeSidebar();
  }

  function closeInfo() {
    info.classList.remove("open");
    info.setAttribute("aria-hidden", "true");
  }

  function setEyebrow(html) { infoEyebrow.innerHTML = html; }

  function clearAll() {
    state.exitAnim = null;
    state.selected = null;
    state.activeOrg = null;
    state.activeCont = null;
    state.hover = null;
    state.focusPending = null;
    clearTimeout(state.focusTimer);
    hideTooltip();
    closeInfo();
    updateAll();
    state.dirty = true;
  }

  // 捕获退出前的焦点视觉状态，用于缓入缓出淡出，避免硬切换。
  function beginExitAnimation() {
    const a3 = state.selected;
    // 尊重系统"减少动态效果"设置：该场景直接切换。
    if (!a3 || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      state.exitAnim = null;
      return;
    }
    state.exitAnim = {
      a3,
      nbs: state.neighborSet ? new Set(state.neighborSet) : null,
      t0: performance.now(),
      duration: 560,
      progress: 1
    };
  }

  function clearCountry() {
    if (state.selected) beginExitAnimation();
    state.selected = null;
    state.hover = null;
    state.focusPending = null;
    clearTimeout(state.focusTimer);
    hideTooltip();
    if (state.activeOrg) renderOrg(state.activeOrg, false);
    else if (state.activeCont) renderContinent(state.activeCont, false);
    else closeInfo();
    updateAll();
    state.dirty = true;
  }

  function selectCountry(a3, opts = {}) {
    const c = byA3.get(a3);
    if (!c) return;
    state.exitAnim = null;
    const keepContext = opts.keepContext !== false;
    if (!keepContext) {
      state.activeOrg = null;
      state.activeCont = null;
    }
    state.selected = a3;
    state.hover = null;
    hideTooltip();
    refreshHighlight();
    renderCountry(c);
    openInfo();
    updateAll();
    if (opts.focus !== false) {
      if (state.mode === "globe") rotateTo(c.lat, c.lon);
      else if (opts.zoom !== false) focusFlatCountry(a3);
    }
    state.dirty = true;
    if (window.innerWidth <= 900) closeSidebar();
  }

  // 再次点击已选中的国家/地区则退出高亮，否则选中它。
  function selectCountryToggle(a3, opts = {}) {
    if (state.selected === a3) {
      clearCountry();
      return true;
    }
    selectCountry(a3, opts);
    return false;
  }

  function selectOrg(id) {
    const o = orgById.get(id);
    if (!o) return;
    state.exitAnim = null;
    state.activeOrg = id;
    state.activeCont = null;
    state.selected = null;
    state.hover = null;
    hideTooltip();
    refreshHighlight();
    renderOrg(id);
    openInfo();
    updateAll();
    if (state.mode === "globe") rotateToSet(o.members);
    state.dirty = true;
    clearSearch();
    if (window.innerWidth <= 900) closeSidebar();
  }

  function selectContinent(id) {
    const c = contById.get(id);
    if (!c) return;
    state.exitAnim = null;
    state.activeCont = id;
    state.activeOrg = null;
    state.selected = null;
    state.hover = null;
    hideTooltip();
    refreshHighlight();
    renderContinent(id);
    openInfo();
    updateAll();
    if (state.mode === "globe") {
      const center = CONT_CENTER[id] || [20, 0];
      rotateTo(center[0], center[1]);
    }
    state.dirty = true;
    clearSearch();
    if (window.innerWidth <= 900) closeSidebar();
  }

  /* ------------------------------------------------------------------ *
   *  views
   * ------------------------------------------------------------------ */

  // 统一缓动曲线：缓入缓出（ease-in-out cubic），旋转与高亮退场共用。
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function rotateTo(lat, lon, duration = 720) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    cancelAnimationFrame(state.rotRaf);
    const startLon = state.rotation[0];
    const startLat = state.rotation[1];
    let endLon = -lon;
    endLon = startLon + (((endLon - startLon + 540) % 360) - 180);
    const endLat = clamp(-lat, -74, 74);
    const t0 = performance.now();
    state.animating = true;
    const step = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      const e = easeInOut(t);
      state.rotation = [startLon + (endLon - startLon) * e, startLat + (endLat - startLat) * e];
      state.dirty = true;
      if (t < 1) state.rotRaf = requestAnimationFrame(step);
      else state.animating = false;
    };
    state.rotRaf = requestAnimationFrame(step);
  }

  function rotateToSet(a3s) {
    let x = 0, y = 0, z = 0, n = 0;
    for (const a3 of a3s) {
      const c = byA3.get(a3);
      if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
      const la = c.lat * RAD, lo = c.lon * RAD;
      x += Math.cos(la) * Math.cos(lo);
      y += Math.cos(la) * Math.sin(lo);
      z += Math.sin(la);
      n++;
    }
    if (!n) return;
    const lon = Math.atan2(y, x) * DEG;
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * DEG;
    rotateTo(lat, lon);
  }

  function zoomToCountry(c) {
    const prep = state.prep50 || state.prep110;
    let point = [c.lon, c.lat];
    let fitK = 3;
    const feature = prep && prep.byA3Feature.get(c.a3);
    if (feature) {
      point = feature.__centroid;
      const b = d3.geoPath(state.flatProj).bounds(feature);
      if (b && Number.isFinite(b[0][0])) {
        const bw = b[1][0] - b[0][0];
        const bh = b[1][1] - b[0][1];
        if (bw < state.w * 0.45 && bh < state.h * 0.45) {
          fitK = Math.min(state.w * 0.58 / Math.max(24, bw), state.h * 0.58 / Math.max(18, bh));
        }
      }
    }
    const p = state.flatProj(point);
    if (!p) return;
    const k = clamp(Math.max(state.flatZoom.k, fitK), 2.4, 16);
    state.flatZoom = {
      k,
      x: clamp(state.w / 2 - p[0] * k, state.w - state.w * k, 0),
      y: clamp(state.h / 2 - p[1] * k, state.h - state.h * k, 0)
    };
    state.dirty = true;
  }

  function focusFlatCountry(a3) {
    const c = byA3.get(a3);
    if (!c) return;
    state.focusPending = a3;
    zoomToCountry(c);
    clearTimeout(state.focusTimer);
    state.focusTimer = setTimeout(() => { state.focusPending = null; }, 900);
  }

  function zoomToSet(a3s) {
    const prep = state.prep50 || state.prep110;
    if (!prep || !state.flatProj) return;
    const path = d3.geoPath(state.flatProj);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const a3 of a3s) {
      const f = prep.byA3Feature.get(a3);
      if (!f) continue;
      const b = path.bounds(f);
      if (!b || !Number.isFinite(b[0][0])) continue;
      x0 = Math.min(x0, b[0][0]); y0 = Math.min(y0, b[0][1]);
      x1 = Math.max(x1, b[1][0]); y1 = Math.max(y1, b[1][1]);
    }
    if (!Number.isFinite(x0)) return;
    const bw = Math.max(60, x1 - x0), bh = Math.max(45, y1 - y0);
    const k = clamp(Math.min(state.w * 0.82 / bw, state.h * 0.82 / bh), 1.25, 14);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    state.flatZoom = {
      k,
      x: clamp(state.w / 2 - cx * k, state.w - state.w * k, 0),
      y: clamp(state.h / 2 - cy * k, state.h - state.h * k, 0)
    };
    state.dirty = true;
  }

  function zoomAt(px, py, factor) {
    const z = state.flatZoom;
    const k = clamp(z.k * factor, 1, 20);
    const x = px - (px - z.x) * (k / z.k);
    const y = py - (py - z.y) * (k / z.k);
    state.flatZoom = {
      k,
      x: clamp(x, state.w - state.w * k, 0),
      y: clamp(y, state.h - state.h * k, 0)
    };
    state.dirty = true;
  }

  function resetView() {
    cancelAnimationFrame(state.rotRaf);
    state.animating = false;
    state.rotation = [-105, -18];
    state.globeScale = 1;
    state.flatZoom = { x: 0, y: 0, k: 1 };
    state.cursor = null;
    clearAll();
    state.dirty = true;
  }

  /* ------------------------------------------------------------------ *
   *  canvas sizing / projections
   * ------------------------------------------------------------------ */

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    }
    state.w = w;
    state.h = h;
    state.dpr = dpr;
    state.globeProj = d3.geoOrthographic()
      .translate([w / 2, h / 2])
      .scale(Math.min(w, h) * 0.415 * state.globeScale)
      .rotate(state.rotation)
      .clipAngle(90)
      .precision(0.45);
    state.flatProj = d3.geoEquirectangular()
      .fitExtent([[w * 0.035, h * 0.075], [w * 0.965, h * 0.925]], { type: "Sphere" });
    if (state.focusPending && state.mode === "flat") {
      const a3 = state.focusPending;
      state.focusPending = null;
      clearTimeout(state.focusTimer);
      if (state.selected === a3) {
        const c = byA3.get(a3);
        if (c) zoomToCountry(c);
      }
    }
    state.dirty = true;
    // 面板开合会连续改变画布尺寸；同步重绘，避免画布被清空后出现一帧黑屏。
    if (state.booted) {
      state.dirty = false;
      render();
    }
  }

  function updateGlobeProjection() {
    if (!state.globeProj) return;
    const base = Math.min(state.w, state.h) * 0.415;
    state.globeProj
      .translate([state.w / 2, state.h / 2])
      .scale(base * state.globeScale)
      .rotate(state.rotation);
  }

  /* ------------------------------------------------------------------ *
   *  rendering
   * ------------------------------------------------------------------ */

  function render() {
    if (!state.ctx || !state.booted) return;
    const ctx = state.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (state.mode === "globe") drawGlobe(ctx);
    else drawFlat(ctx);
  }

  function drawGlobe(ctx) {
    updateGlobeProjection();
    const proj = state.globeProj;
    const prep = state.prep110;
    if (!proj || !prep) return;
    const w = state.w, h = state.h;
    const cx = w / 2, cy = h / 2;
    const R = proj.scale();

    drawOrbits(ctx, cx, cy, R);

    let g = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.38);
    g.addColorStop(0, "rgba(69,230,255,.16)");
    g.addColorStop(0.45, "rgba(39,150,190,.07)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.38, 0, TAU);
    ctx.fill();

    g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.32, R * 0.04, cx, cy, R * 1.02);
    g.addColorStop(0, "#12394c");
    g.addColorStop(0.48, "#0a2433");
    g.addColorStop(0.82, "#05141e");
    g.addColorStop(1, "#02080d");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.clip();

    const path = d3.geoPath(proj, ctx);
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(92,206,232,.09)";
    ctx.lineWidth = 0.65;
    ctx.stroke();

    ctx.beginPath();
    path(EQUATOR);
    ctx.strokeStyle = "rgba(69,230,255,.17)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    path(PRIME_MERIDIAN);
    ctx.strokeStyle = "rgba(69,230,255,.09)";
    ctx.lineWidth = 0.7;
    ctx.stroke();

    drawFeatures(ctx, path, prep, { flat: false });
    drawSeaRoutes(ctx, path, { flat: false });
    let boxes = drawOceanLabels(ctx, proj, { flat: false });
    boxes = drawSeaMarkers(ctx, proj, { flat: false }, boxes);
    drawSeaLabels(ctx, proj, { flat: false }, boxes);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.strokeStyle = "rgba(120,240,255,.42)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.012, 0, TAU);
    ctx.strokeStyle = "rgba(69,230,255,.12)";
    ctx.lineWidth = 0.7;
    ctx.setLineDash([2, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(180,245,255,.16)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.985, Math.PI * 1.08, Math.PI * 1.42);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const r1 = R * 1.045, r2 = R * 1.085;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.strokeStyle = "rgba(69,230,255,.3)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    drawMarkers(ctx, prep, { flat: false });
    drawSelectionHalo(ctx, { flat: false });
  }

  function drawFlat(ctx) {
    const prep = activePrep();
    if (!prep || !state.flatProj) return;
    const w = state.w, h = state.h;
    const z = state.flatZoom;
    const dpr = state.dpr;
    const path = d3.geoPath(state.flatProj, ctx);

    ctx.save();
    ctx.setTransform(dpr * z.k, 0, 0, dpr * z.k, dpr * z.x, dpr * z.y);

    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.fillStyle = "rgba(4,15,23,.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(96,214,245,.18)";
    ctx.lineWidth = 1 / z.k;
    ctx.stroke();

    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(92,206,232,.075)";
    ctx.lineWidth = 0.6 / z.k;
    ctx.stroke();

    ctx.beginPath();
    path(EQUATOR);
    ctx.strokeStyle = "rgba(69,230,255,.16)";
    ctx.lineWidth = 0.8 / z.k;
    ctx.stroke();

    ctx.beginPath();
    path(PRIME_MERIDIAN);
    ctx.strokeStyle = "rgba(69,230,255,.08)";
    ctx.lineWidth = 0.7 / z.k;
    ctx.stroke();

    drawFeatures(ctx, path, prep, { flat: true });
    drawSeaRoutes(ctx, path, { flat: true });
    ctx.restore();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const seaBoxes = drawOceanLabels(ctx, state.flatProj, { flat: true });
    const countryBoxes = drawFlatLabels(ctx, prep);
    let boxes = seaBoxes.concat(countryBoxes);
    boxes = drawSeaMarkers(ctx, state.flatProj, { flat: true }, boxes);
    drawSeaLabels(ctx, state.flatProj, { flat: true }, boxes);
    drawMarkers(ctx, prep, { flat: true });
    drawSelectionHalo(ctx, { flat: true });
  }

  function drawFeatures(ctx, path, prep, opts) {
    const hl = state.highlightSet;
    const nbs = state.neighborSet;
    const hasHL = !!hl;
    const selected = state.selected;
    const hover = state.hover ? state.hover.a3 : null;
    const many = hasHL && hl.size > 80;
    const k = opts.flat ? state.flatZoom.k : 1;
    const lw = (px) => px / k;

    for (const f of prep.feats) {
      if (!f.__a3) {
        ctx.beginPath();
        path(f);
        ctx.fillStyle = hasHL ? "rgba(6,16,22,.28)" : "rgba(9,25,34,.52)";
        ctx.fill();
        ctx.strokeStyle = "rgba(80,150,170,.08)";
        ctx.lineWidth = lw(0.5);
        ctx.stroke();
        continue;
      }
      const a3 = f.__a3;
      const isSel = a3 === selected;
      const isHov = a3 === hover;
      const isMem = !hasHL || hl.has(a3);
      const isNb = !!nbs && nbs.has(a3) && !isSel;
      let fill, stroke, width, halo = false, nbHalo = false;

      if (isSel) {
        fill = "rgba(255,199,107,.55)";
        stroke = "rgba(255,234,190,.98)";
        width = 1.6;
      } else if (isNb) {
        // 焦点国的陆上邻国：统一为最高次级亮度（亮青）。
        // 集团点亮后再点选集团内某国时，这些邻国要比"其余集团成员"更亮，
        // 形成 焦点(金) > 邻国(亮青) > 其余成员(中青) 的三级层次；
        // 所有邻国同色，不因个别邻国同属其他组织/大洲而亮度不一。
        fill = "rgba(104,228,248,.82)";
        stroke = "rgba(196,252,255,.98)";
        width = 1.2;
        nbHalo = true;
      } else if (isHov) {
        fill = isMem ? "rgba(72,180,200,.86)" : "rgba(55,95,110,.5)";
        stroke = "rgba(225,255,255,.95)";
        width = 1.3;
      } else if (hasHL && isMem) {
        // 其余集团成员：中青，明显暗于焦点国的邻国。
        fill = many ? "rgba(32,140,166,.40)" : "rgba(40,162,190,.52)";
        stroke = many ? "rgba(116,210,228,.78)" : "rgba(132,234,250,.84)";
        width = 1;
        halo = !many;
      } else if (!hasHL) {
        fill = "rgba(15,45,58,.84)";
        stroke = "rgba(84,186,208,.46)";
        width = 0.75;
      } else {
        fill = "rgba(24,58,72,.86)";
        stroke = "rgba(86,168,186,.42)";
        width = 0.75;
      }

      ctx.beginPath();
      path(f);
      ctx.fillStyle = fill;
      ctx.fill();

      if (isSel) {
        ctx.save();
        ctx.shadowColor = "rgba(255,199,107,.85)";
        ctx.shadowBlur = 16 / k;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw(width);
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
      } else if (halo || nbHalo) {
        ctx.strokeStyle = nbHalo ? "rgba(110,222,240,.14)" : "rgba(69,230,255,.16)";
        ctx.lineWidth = lw(nbHalo ? 2.8 : 3.4);
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw(width);
        ctx.stroke();
      } else {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw(width);
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    }

    // outlines on top (enclaves / tiny states)
    if (selected) {
      const f = prep.byA3Feature.get(selected);
      if (f) {
        ctx.save();
        ctx.beginPath();
        path(f);
        ctx.strokeStyle = "rgba(255,234,190,.95)";
        ctx.lineWidth = lw(1.7);
        ctx.shadowColor = "rgba(255,199,107,.9)";
        ctx.shadowBlur = 14 / k;
        ctx.stroke();
        ctx.restore();
      }
    }
    if (hover && hover !== selected) {
      const f = prep.byA3Feature.get(hover);
      if (f) {
        ctx.beginPath();
        path(f);
        ctx.strokeStyle = "rgba(225,255,255,.95)";
        ctx.lineWidth = lw(1.35);
        ctx.stroke();
      }
    }

    // 退出高亮的缓入缓出转场：把刚失去焦点的国家与邻国按 progress 从 1→0
    // 叠加淡出，露出底下已恢复的集团/普通配色，避免硬切换。
    const ex = state.exitAnim;
    if (ex && ex.progress > 0) {
      const p = ex.progress;
      const selF = prep.byA3Feature.get(ex.a3);
      if (selF) {
        ctx.save();
        ctx.beginPath();
        path(selF);
        ctx.fillStyle = "rgba(255,199,107," + (0.55 * p).toFixed(3) + ")";
        ctx.fill();
        ctx.shadowColor = "rgba(255,199,107," + (0.85 * p).toFixed(3) + ")";
        ctx.shadowBlur = 16 / k;
        ctx.strokeStyle = "rgba(255,234,190," + (0.98 * p).toFixed(3) + ")";
        ctx.lineWidth = lw(1.6);
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
      }
      if (ex.nbs) {
        for (const nb of ex.nbs) {
          const nf = prep.byA3Feature.get(nb);
          if (!nf) continue;
          ctx.save();
          ctx.beginPath();
          path(nf);
          ctx.fillStyle = "rgba(104,228,248," + (0.82 * p).toFixed(3) + ")";
          ctx.fill();
          ctx.strokeStyle = "rgba(110,222,240," + (0.5 * p).toFixed(3) + ")";
          ctx.lineWidth = lw(2.8);
          ctx.stroke();
          ctx.strokeStyle = "rgba(196,252,255," + (0.98 * p).toFixed(3) + ")";
          ctx.lineWidth = lw(1.2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function labelBoxesFree(boxes, x, y, halfW, halfH) {
    for (const b of boxes) {
      if (x - halfW < b.x1 + 4 && x + halfW > b.x0 - 4 &&
          y - halfH < b.y1 + 3 && y + halfH > b.y0 - 3) return false;
    }
    return true;
  }

  function pushLabelBox(boxes, x, y, halfW, halfH) {
    boxes.push({ x0: x - halfW, y0: y - halfH, x1: x + halfW, y1: y + halfH });
  }

  function drawSeaRoutes(ctx, path, opts) {
    const k = opts.flat ? state.flatZoom.k : 1;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const r of SEA_ROUTES) {
      const geo = { type: "LineString", coordinates: r.line };
      ctx.beginPath();
      path(geo);
      ctx.strokeStyle = r.arctic ? "rgba(255,199,107,.11)" : "rgba(69,230,255,.11)";
      ctx.lineWidth = 4.5 / k;
      ctx.setLineDash([]);
      ctx.stroke();

      ctx.beginPath();
      path(geo);
      ctx.strokeStyle = r.arctic ? "rgba(255,208,128,.5)" : "rgba(116,234,252,.52)";
      ctx.lineWidth = 1.4 / k;
      ctx.setLineDash(r.arctic ? [3 / k, 5 / k] : [7 / k, 6 / k]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawSeaMarkers(ctx, proj, opts, boxes) {
    if (!proj) return boxes;
    const z = state.flatZoom;
    const focused = !!(state.selected || state.highlightSet);
    const showText = opts.flat ? z.k >= 1.7 : true;
    const out = boxes || [];
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (const c of CHOKEPOINTS) {
      if (!opts.flat && !visibleOnGlobe(c.lon, c.lat, proj)) continue;
      const p = proj([c.lon, c.lat]);
      if (!p) continue;
      const x = opts.flat ? z.x + p[0] * z.k : p[0];
      const y = opts.flat ? z.y + p[1] * z.k : p[1];
      if (x < 12 || y < 12 || x > state.w - 12 || y > state.h - 12) continue;

      ctx.beginPath();
      ctx.moveTo(x, y - 3.4);
      ctx.lineTo(x + 3.4, y);
      ctx.lineTo(x, y + 3.4);
      ctx.lineTo(x - 3.4, y);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,214,138,.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,242,208,.9)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      if (!showText) continue;

      ctx.font = '9px "PingFang SC","Microsoft YaHei",sans-serif';
      const zhW = ctx.measureText(c.zh).width;
      ctx.font = '600 5.5px "SF Mono",ui-monospace,monospace';
      const enW = ctx.measureText(c.en).width;
      const halfW = Math.max(zhW, enW) / 2 + 6;
      if (!labelBoxesFree(out, x + 6 + halfW, y, halfW, 8)) continue;

      ctx.font = '9px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = "rgba(2,10,16,.8)";
      ctx.strokeText(c.zh, x + 7, y - 4);
      ctx.fillStyle = focused ? "rgba(255,226,176,.62)" : "rgba(255,231,188,.86)";
      ctx.fillText(c.zh, x + 7, y - 4);

      ctx.font = '600 5.5px "SF Mono",ui-monospace,monospace';
      ctx.lineWidth = 2;
      ctx.strokeText(c.en, x + 7, y + 5);
      ctx.fillStyle = focused ? "rgba(220,190,140,.34)" : "rgba(236,206,154,.52)";
      ctx.fillText(c.en, x + 7, y + 5);

      pushLabelBox(out, x + 6 + halfW, y, halfW, 8);
    }
    ctx.restore();
    return out;
  }

  function drawSeaLabels(ctx, proj, opts, boxes) {
    if (!proj) return;
    const z = state.flatZoom;
    const focused = !!(state.selected || state.highlightSet);
    const showAll = opts.flat ? z.k >= 1.8 : state.globeScale >= 1.45;
    const occupied = boxes || [];
    const zhAlpha = focused ? 0.34 : 0.5;
    const enAlpha = focused ? 0.2 : 0.3;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of SEAS) {
      if (!s.major && !showAll) continue;
      if (!opts.flat && !visibleOnGlobe(s.lon, s.lat, proj)) continue;
      const p = proj([s.lon, s.lat]);
      if (!p) continue;
      const x = opts.flat ? z.x + p[0] * z.k : p[0];
      const y = opts.flat ? z.y + p[1] * z.k : p[1];
      if (x < 32 || y < 20 || x > state.w - 32 || y > state.h - 20) continue;

      ctx.font = '9.5px "PingFang SC","Microsoft YaHei",sans-serif';
      const zhW = ctx.measureText(s.zh).width;
      ctx.font = '600 5.5px "SF Mono",ui-monospace,monospace';
      const enW = ctx.measureText(s.en).width;
      const halfW = Math.max(zhW, enW) / 2 + 3;
      if (!labelBoxesFree(occupied, x, y, halfW, 9)) continue;

      ctx.font = '9.5px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = "rgba(2,10,16,.7)";
      ctx.strokeText(s.zh, x, y - 3);
      ctx.fillStyle = `rgba(128,214,232,${zhAlpha})`;
      ctx.fillText(s.zh, x, y - 3);

      ctx.font = '600 5.5px "SF Mono",ui-monospace,monospace';
      ctx.lineWidth = 2;
      ctx.strokeText(s.en, x, y + 5);
      ctx.fillStyle = `rgba(106,188,208,${enAlpha})`;
      ctx.fillText(s.en, x, y + 5);

      pushLabelBox(occupied, x, y, halfW, 9);
    }
    ctx.restore();
  }

  function drawOceanLabels(ctx, proj, opts) {
    if (!proj) return [];
    const z = state.flatZoom;
    const boxes = [];
    if (opts.flat && z.k > 5) return boxes;
    const focused = !!(state.selected || state.highlightSet);
    const zhAlpha = focused ? 0.42 : 0.6;
    const enAlpha = focused ? 0.3 : 0.42;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const o of OCEANS) {
      if (!opts.flat && !visibleOnGlobe(o.lon, o.lat, proj)) continue;
      const p = proj([o.lon, o.lat]);
      if (!p) continue;
      const x = opts.flat ? z.x + p[0] * z.k : p[0];
      const y = opts.flat ? z.y + p[1] * z.k : p[1];
      if (x < 46 || y < 28 || x > state.w - 46 || y > state.h - 28) continue;

      ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.letterSpacing = "2px";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(2,10,16,.5)";
      ctx.strokeText(o.zh, x, y - 2);
      ctx.fillStyle = `rgba(132,222,240,${zhAlpha})`;
      ctx.fillText(o.zh, x, y - 2);

      ctx.font = '600 7px "SF Mono",ui-monospace,monospace';
      ctx.letterSpacing = "1.6px";
      ctx.lineWidth = 2.4;
      ctx.strokeText(o.en, x, y + 11);
      ctx.fillStyle = `rgba(110,196,216,${enAlpha})`;
      ctx.fillText(o.en, x, y + 11);

      const tw = Math.max(26, ctx.measureText(o.en).width / 2 + 10);
      ctx.beginPath();
      ctx.moveTo(x - tw - 12, y + 11);
      ctx.lineTo(x - tw, y + 11);
      ctx.moveTo(x + tw, y + 11);
      ctx.lineTo(x + tw + 12, y + 11);
      ctx.strokeStyle = `rgba(96,206,228,${focused ? 0.16 : 0.26})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      pushLabelBox(boxes, x, y + 4, Math.max(tw + 12, 30), 15);
    }
    ctx.restore();
    ctx.letterSpacing = "0px";
    return boxes;
  }

  function drawFlatLabels(ctx, prep) {
    const z = state.flatZoom;
    const hl = state.highlightSet;
    const nbs = state.neighborSet;
    const force = hl && hl.size <= 30;
    const items = [];
    ctx.font = '10.5px "PingFang SC","Microsoft YaHei",sans-serif';
    for (const f of prep.feats) {
      if (!f.__a3) continue;
      const a3 = f.__a3;
      const c = byA3.get(a3);
      if (!c) continue;
      const isSel = a3 === state.selected;
      const isHov = state.hover && a3 === state.hover.a3;
      const isNb = !!nbs && nbs.has(a3) && !isSel;
      if (hl && !hl.has(a3) && !isSel && !isHov && !isNb) continue;
      const area = f.__area * z.k * z.k;
      if (!force && !isSel && !isHov && !isNb && area < 0.0065) continue;
      const p = state.flatProj(f.__centroid);
      if (!p) continue;
      const x = z.x + p[0] * z.k;
      const y = z.y + p[1] * z.k;
      if (x < -30 || y < -20 || x > state.w + 30 || y > state.h + 20) continue;
      const text = c.zh;
      items.push({ text, x, y, area, isSel, isHov, isNb, a3 });
    }
    items.sort((a, b) => (a.isSel - b.isSel) || (a.isHov - b.isHov) || (b.area - a.area));

    const placed = [];
    for (const item of items) {
      const width = ctx.measureText(item.text).width + 8;
      const height = 13;
      const box = { x: item.x - width / 2, y: item.y - height / 2, w: width, h: height };
      if (!item.isSel && !item.isHov) {
        let overlap = false;
        for (const r of placed) {
          if (box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;
      }
      placed.push(box);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(2,8,12,.82)";
      ctx.strokeText(item.text, item.x, item.y);
      if (item.isSel) ctx.fillStyle = "#ffe4ae";
      else if (item.isHov) ctx.fillStyle = "#ffffff";
      else if (item.isNb) ctx.fillStyle = "rgba(168,240,250,.95)";
      else if (hl && hl.has(item.a3)) ctx.fillStyle = "rgba(180,250,255,.96)";
      else ctx.fillStyle = "rgba(210,236,243,.82)";
      ctx.fillText(item.text, item.x, item.y);
    }
    return placed.map((r) => ({ x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h }));
  }

  function drawMarkers(ctx, prep, opts) {
    const hl = state.highlightSet;
    const z = state.flatZoom;
    const proj = opts.flat ? state.flatProj : state.globeProj;
    if (!proj) return;
    for (const m of prep.markers) {
      if (!opts.flat && !visibleOnGlobe(m.lon, m.lat, proj)) continue;
      const p = proj([m.lon, m.lat]);
      if (!p) continue;
      const x = opts.flat ? z.x + p[0] * z.k : p[0];
      const y = opts.flat ? z.y + p[1] * z.k : p[1];
      const isSel = m.a3 === state.selected;
      const isHov = state.hover && m.a3 === state.hover.a3;
      const isMem = !hl || hl.has(m.a3);
      const isNb = !!state.neighborSet && state.neighborSet.has(m.a3) && !isSel;
      if (x < -10 || y < -10 || x > state.w + 10 || y > state.h + 10) continue;

      const color = isSel ? "#ffe4ae" : (isNb ? "rgba(150,236,248,.95)" : (isMem ? "rgba(150,248,255,.95)" : "rgba(70,130,150,.32)"));
      const r = isSel || isHov ? 3.9 : (isNb ? 3 : (isMem ? 2.8 : 2));
      ctx.save();
      ctx.shadowColor = isSel ? "rgba(255,199,107,.9)" : "rgba(69,230,255,.85)";
      ctx.shadowBlur = isSel || isHov ? 12 : 7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      if (isHov || isSel) {
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, TAU);
        ctx.strokeStyle = isSel ? "rgba(255,228,174,.6)" : "rgba(180,250,255,.55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      if (opts.flat && (isSel || isHov || z.k > 2.4)) {
        const c = byA3.get(m.a3);
        if (c) {
          ctx.font = '10px "PingFang SC","Microsoft YaHei",sans-serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(2,8,12,.85)";
          ctx.strokeText(c.zh, x + 7, y - 1);
          ctx.fillStyle = isSel ? "#ffe4ae" : "rgba(190,248,255,.95)";
          ctx.fillText(c.zh, x + 7, y - 1);
        }
      }
    }
  }

  function drawSelectionHalo(ctx, opts) {
    if (!state.selected) return;
    const c = byA3.get(state.selected);
    if (!c) return;
    const proj = opts.flat ? state.flatProj : state.globeProj;
    if (!proj) return;
    if (!opts.flat && !visibleOnGlobe(c.lon, c.lat, proj)) return;
    const p = proj([c.lon, c.lat]);
    if (!p) return;
    let x = p[0], y = p[1];
    if (opts.flat) {
      x = state.flatZoom.x + p[0] * state.flatZoom.k;
      y = state.flatZoom.y + p[1] * state.flatZoom.k;
    }
    ctx.save();
    ctx.strokeStyle = "rgba(255,199,107,.65)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,199,107,.22)";
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - 16, y); ctx.lineTo(x - 8, y);
    ctx.moveTo(x + 8, y); ctx.lineTo(x + 16, y);
    ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 8);
    ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 16);
    ctx.strokeStyle = "rgba(255,199,107,.75)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    if (!opts.flat) {
      const label = c.zh;
      ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
      const tw = ctx.measureText(label).width;
      const bw = tw + 18, bh = 22;
      let bx = x + 22, by = y - bh / 2;
      if (bx + bw > state.w - 12) bx = x - 22 - bw;
      if (by < 12) by = 12;
      if (by + bh > state.h - 12) by = state.h - 12 - bh;
      ctx.save();
      ctx.fillStyle = "rgba(3,12,18,.88)";
      ctx.strokeStyle = "rgba(255,199,107,.45)";
      ctx.lineWidth = 0.8;
      roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffe4ae";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + 9, by + bh / 2 + 0.5);
      ctx.beginPath();
      ctx.moveTo(x + (bx > x ? 14 : -14), y);
      ctx.lineTo(bx > x ? bx : bx + bw, y);
      ctx.strokeStyle = "rgba(255,199,107,.45)";
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawOrbits(ctx, cx, cy, R) {
    const t = performance.now() / 1000;
    ctx.save();
    ctx.strokeStyle = "rgba(69,230,255,.12)";
    ctx.lineWidth = 0.6;
    ctx.setLineDash([2, 7]);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.32);
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.24, R * 0.26, 0, 0, TAU);
    ctx.stroke();
    const a = t * 0.22;
    const px = Math.cos(a) * R * 1.24;
    const py = Math.sin(a) * R * 0.26;
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, TAU);
    ctx.fillStyle = "rgba(150,248,255,.85)";
    ctx.shadowColor = "rgba(69,230,255,.9)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.58);
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.17, R * 0.18, 0, 0, TAU);
    ctx.strokeStyle = "rgba(69,230,255,.07)";
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    ctx.setLineDash([]);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function visibleOnGlobe(lon, lat, proj) {
    const r = proj.rotate();
    const center = [-r[0], -r[1]];
    return d3.geoDistance([lon, lat], center) < Math.PI / 2 - 0.012;
  }

  /* ------------------------------------------------------------------ *
   *  hit testing / hover
   * ------------------------------------------------------------------ */

  function hitTest(px, py) {
    const prep = activePrep();
    if (!prep) return null;
    if (state.mode === "globe") {
      const proj = state.globeProj;
      const R = proj.scale();
      const dx = px - state.w / 2, dy = py - state.h / 2;
      if (Math.hypot(dx, dy) > R) return null;
      for (const m of prep.markers) {
        if (!visibleOnGlobe(m.lon, m.lat, proj)) continue;
        const p = proj([m.lon, m.lat]);
        if (p && Math.hypot(p[0] - px, p[1] - py) < 10) return { type: "marker", a3: m.a3 };
      }
      const inv = proj.invert([px, py]);
      if (!inv || !Number.isFinite(inv[0]) || !Number.isFinite(inv[1])) return null;
      for (const f of prep.hitFeats) {
        if (d3.geoContains(f, inv)) return { type: "country", a3: f.__a3 };
      }
      return null;
    }

    const z = state.flatZoom;
    const bx = (px - z.x) / z.k;
    const by = (py - z.y) / z.k;
    for (const m of prep.markers) {
      const p = state.flatProj([m.lon, m.lat]);
      if (!p) continue;
      const sx = z.x + p[0] * z.k;
      const sy = z.y + p[1] * z.k;
      if (Math.hypot(sx - px, sy - py) < 10) return { type: "marker", a3: m.a3 };
    }
    const inv = state.flatProj.invert([bx, by]);
    if (!inv || !Number.isFinite(inv[0]) || !Number.isFinite(inv[1])) return null;
    for (const f of prep.hitFeats) {
      if (d3.geoContains(f, inv)) return { type: "country", a3: f.__a3 };
    }
    return null;
  }

  function updateHover(hit, px, py) {
    const a3 = hit ? hit.a3 : null;
    if (!a3) {
      if (state.hover) {
        state.hover = null;
        hideTooltip();
        state.dirty = true;
        updateCoord();
      }
      canvas.style.cursor = state.pointerDown ? "grabbing" : "grab";
      return;
    }
    const c = byA3.get(a3);
    if (!c) return;
    const prev = state.hover ? state.hover.a3 : null;
    state.hover = { type: hit.type, a3 };
    if (prev !== a3) {
      state.dirty = true;
      updateCoord();
    }
    showTooltip(c, px, py);
    canvas.style.cursor = "pointer";
  }

  function showTooltip(c, px, py) {
    ttZh.textContent = c.zh;
    ttEn.textContent = c.en;
    const context = state.activeOrg ? "成员国" : c.kind;
    ttMeta.textContent = `${c.continent} · ${context}`;
    tooltip.style.left = clamp(px, 110, state.w - 110) + "px";
    tooltip.style.top = clamp(py - 14, 70, state.h - 90) + "px";
    tooltip.classList.toggle("below", py < 96);
    tooltip.classList.add("show");
  }

  function hideTooltip() {
    tooltip.classList.remove("show");
  }

  /* ------------------------------------------------------------------ *
   *  pointer interactions
   * ------------------------------------------------------------------ */

  function localPoint(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function updateCursorGeo(px, py) {
    const proj = state.mode === "globe" ? state.globeProj : state.flatProj;
    if (!proj) return;
    let inv = null;
    if (state.mode === "globe") {
      if (Math.hypot(px - state.w / 2, py - state.h / 2) <= proj.scale()) inv = proj.invert([px, py]);
    } else {
      inv = proj.invert([(px - state.flatZoom.x) / state.flatZoom.k, (py - state.flatZoom.y) / state.flatZoom.k]);
    }
    state.cursor = inv && Number.isFinite(inv[0]) && Number.isFinite(inv[1]) ? inv : null;
    updateCoord();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const [px, py] = localPoint(e);
    state.pointers.set(e.pointerId, { x: px, y: py });
    canvas.setPointerCapture(e.pointerId);
    state.pointerDown = true;
    state.moved = false;
    state.dragging = false;
    canvas.classList.add("dragging");
    hideTooltip();
    if (state.pointers.size === 2) {
      const pts = Array.from(state.pointers.values());
      state.pinch = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mid: [(pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2],
        scale: state.globeScale,
        zoom: { ...state.flatZoom }
      };
      state.moved = true;
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const [px, py] = localPoint(e);
    const p = state.pointers.get(e.pointerId);
    if (!p) {
      const now = performance.now();
      if (now - state.lastHit > 26) {
        state.lastHit = now;
        updateHover(hitTest(px, py), px, py);
        updateCursorGeo(px, py);
      }
      return;
    }
    const dx = px - p.x;
    const dy = py - p.y;
    p.x = px;
    p.y = py;

    if (state.pointers.size >= 2 && state.pinch) {
      const pts = Array.from(state.pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const factor = state.pinch.dist ? dist / state.pinch.dist : 1;
      if (state.mode === "globe") {
        state.globeScale = clamp(state.pinch.scale * factor, 0.72, 3.8);
      } else {
        const start = state.pinch.zoom;
        const k = clamp(start.k * factor, 1, 20);
        const mid = state.pinch.mid;
        state.flatZoom = {
          k,
          x: clamp(mid[0] - (mid[0] - start.x) * (k / start.k), state.w - state.w * k, 0),
          y: clamp(mid[1] - (mid[1] - start.y) * (k / start.k), state.h - state.h * k, 0)
        };
      }
      state.moved = true;
      state.dirty = true;
      return;
    }

    if (Math.abs(dx) + Math.abs(dy) > 1.5) state.moved = true;
    if (state.mode === "globe") {
      state.rotation[0] += dx * 0.3;
      state.rotation[1] = clamp(state.rotation[1] - dy * 0.24, -78, 78);
      state.dirty = true;
      state.dragging = true;
    } else {
      state.flatZoom.x = clamp(state.flatZoom.x + dx, state.w - state.w * state.flatZoom.k, 0);
      state.flatZoom.y = clamp(state.flatZoom.y + dy, state.h - state.h * state.flatZoom.k, 0);
      state.dirty = true;
      state.dragging = true;
    }
    updateCursorGeo(px, py);
  });

  function endPointer(e) {
    const had = state.pointers.has(e.pointerId);
    state.pointers.delete(e.pointerId);
    if (state.pointers.size < 2) state.pinch = null;
    if (state.pointers.size === 1) {
      const rem = Array.from(state.pointers.values())[0];
      state.moved = true;
    }
    if (!state.pointers.size) {
      state.pointerDown = false;
      state.dragging = false;
      canvas.classList.remove("dragging");
      if (had && !state.moved) {
        const [px, py] = localPoint(e);
        const hit = hitTest(px, py);
        if (hit) selectCountryToggle(hit.a3, { focus: true, keepContext: true });
        else clearCountry();
      }
    }
    state.dirty = true;
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("pointerleave", () => {
    if (state.pointers.size) return;
    if (state.hover) {
      state.hover = null;
      hideTooltip();
      state.dirty = true;
      updateCoord();
    }
    state.cursor = null;
    updateCoord();
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [px, py] = localPoint(e);
    const factor = Math.exp(-e.deltaY * 0.0016);
    if (state.mode === "globe") {
      state.globeScale = clamp(state.globeScale * factor, 0.72, 3.8);
    } else {
      zoomAt(px, py, factor);
    }
    state.dirty = true;
    hideTooltip();
  }, { passive: false });

  canvas.addEventListener("dblclick", (e) => {
    e.preventDefault();
    const [px, py] = localPoint(e);
    if (state.mode === "globe") {
      state.globeScale = clamp(state.globeScale * 1.5, 0.72, 3.8);
    } else {
      zoomAt(px, py, 1.6);
    }
    state.dirty = true;
  });

  /* ------------------------------------------------------------------ *
   *  info panel content
   * ------------------------------------------------------------------ */

  const KIND_NOTE = {
    TWN: "中国台湾地区，两岸同属一个中国。",
    PSE: "联合国观察员国，建国地位存在争议。",
    XKX: "2008 年单方面宣布独立，国际承认存在分歧。",
    ESH: "非自治领土，主权存在争议，摩洛哥实际控制大部分地区。",
    ATA: "无主权国家，依《南极条约》用于和平与科学考察。",
    HKG: "中国特别行政区。",
    MAC: "中国特别行政区。"
  };

  function renderGuide() {
    setEyebrow('PROFILE / <b>STANDBY</b>');
    infoBody.innerHTML = `<div class="empty">
      <div class="empty-orb" aria-hidden="true"><i></i><i></i></div>
      <h3>选择你的第一站</h3>
      <p>点击地图上的国家，或从左侧目录选择一个大洲 / 国际组织，查看它们的空间分布与背景故事。</p>
      <div class="quick">
        <button type="button" data-quick-a3="CHN">中国</button>
        <button type="button" data-quick-org="apec">APEC</button>
        <button type="button" data-quick-org="eu">欧盟</button>
      </div>
    </div>`;
  }

  function neighborsText(c) {
    const prep = state.prep50 || state.prep110;
    let nbs = prep && prep.neighbors.get(c.a3);
    if (!nbs || !nbs.length) return "无陆上邻国";
    const sorted = nbs.slice().sort((a, b) => ((byA3.get(b) || {}).pop || 0) - ((byA3.get(a) || {}).pop || 0));
    const names = sorted.map((a) => byA3.get(a) ? byA3.get(a).zh : a);
    const head = names.slice(0, 5).join("、");
    return `${names.length} 个${names.length > 5 ? " · " + head + " 等" : " · " + head}`;
  }

  function renderCountry(c) {
    const org = state.activeOrg ? orgById.get(state.activeOrg) : null;
    const cont = state.activeCont ? contById.get(state.activeCont) : null;
    const coords = fmtCoord(c.lat, c.lon);
    const orgs = D.orgs.filter((o) => o.members.includes(c.a3));
    const detailed = c.rank === "detailed" && c.h && c.c;
    const back = org
      ? `<button type="button" class="back-link" data-back-org="1">← 返回 ${esc(org.zh)}</button>`
      : cont
        ? `<button type="button" class="back-link" data-back-cont="${cont.id}">← 返回 ${esc(cont.zh)}</button>`
        : "";
    const note = KIND_NOTE[c.a3] || (!c.sovereign ? "该条目为属地或特殊地区，非主权国家。" : "");
    const nbNote = state.neighborSet && state.neighborSet.size
      ? ' <span class="nb-hint">已在地图次高亮</span>'
      : "";

    setEyebrow(`MEMBER PROFILE / <b>${esc(org ? org.abbr : c.a3)}</b>`);

    infoBody.innerHTML = `<div class="profile">
      ${back}
      <div class="profile-eyebrow" style="margin-top:${back ? "12px" : "0"}">
        COUNTRY PROFILE <span class="code">${esc(c.a3)}</span>
        ${detailed ? '<span style="color:var(--amber)">DEEP FILE</span>' : '<span>QUICK VIEW</span>'}
      </div>
      <h2>${esc(c.zh)}</h2>
      <div class="en">${esc(c.en)}</div>
      <div class="badges">
        <span class="badge cyan">${esc(c.continent)} · ${esc(c.subregion)}</span>
        <span class="badge ${c.sovereign ? "" : "amber"}">${esc(c.kind)}</span>
        <span class="badge">${hemisphere(c.lat, c.lon)}</span>
      </div>
      <dl class="stat-grid">
        <div class="stat-cell"><dt>首都 CAPITAL</dt><dd>${esc(c.capital || "—")}</dd></div>
        <div class="stat-cell"><dt>人口 POPULATION</dt><dd>${fmtPop(c.pop)}</dd></div>
        <div class="stat-cell"><dt>面积 AREA</dt><dd>${fmtArea(c.area)}</dd></div>
        <div class="stat-cell"><dt>坐标 COORDINATES</dt><dd class="mono">${coords.la} / ${coords.lo}</dd></div>
        <div class="stat-cell wide"><dt>陆上邻国 LAND NEIGHBORS</dt><dd>${esc(neighborsText(c))}${nbNote}</dd></div>
      </dl>
      ${detailed ? `
        <div class="section"><h3>历史脉络<span class="en">HISTORY</span></h3><p>${esc(c.h)}</p></div>
        <div class="section"><h3>文化名片<span class="en">CULTURE</span></h3><p>${esc(c.c)}</p></div>
      ` : `
        <div class="section"><h3>国家速览<span class="en">OVERVIEW</span></h3><p>${esc(c.s)}</p></div>
        <div class="data-note">该国资料为速览条目。可在地图上点击邻国继续探索，或在左侧选择所属大洲 / 国际组织观察区域格局。</div>
      `}
      ${orgs.length ? `<div class="section"><h3>所属国际组织<span class="en">ORGANIZATIONS · ${orgs.length}</span></h3>
        <div class="chips">${orgs.map((o) => `<button type="button" class="chip org" data-org="${o.id}">${esc(o.abbr)} · ${esc(o.zh)}</button>`).join("")}</div>
      </div>` : ""}
      ${note ? `<div class="data-note">${esc(note)}</div>` : ""}
      <div class="profile-actions">
        <button type="button" class="btn primary" data-action="focus">${state.mode === "globe" ? "旋转定位" : "放大定位"}</button>
        <button type="button" class="btn" data-action="clear">清除选择</button>
      </div>
    </div>`;
    infoBody.scrollTop = 0;
  }

  function sortMembers(a3s) {
    const order = new Map(D.continents.map((c, i) => [c.zh, i]));
    return a3s.map((a) => byA3.get(a)).filter(Boolean).sort((a, b) => {
      const ca = order.has(a.continent) ? order.get(a.continent) : 99;
      const cb = order.has(b.continent) ? order.get(b.continent) : 99;
      return ca - cb || a.zh.localeCompare(b.zh, "zh-Hans-CN");
    });
  }

  function renderOrg(id, open = true) {
    const o = orgById.get(id);
    if (!o) return;
    state.activeOrg = id;
    state.activeCont = null;
    state.selected = null;
    refreshHighlight();
    setEyebrow(`ORGANIZATION / <b>${esc(o.abbr)}</b>`);
    const members = sortMembers(o.members);
    const extra = (o.extraMembers || []).map((name) => {
      const linked = D.orgs.find((x) => x.zh === name || x.abbr === name);
      return linked
        ? `<button type="button" class="chip org" data-org="${linked.id}">${esc(name)}</button>`
        : `<span class="chip static">${esc(name)}</span>`;
    }).join("");
    infoBody.innerHTML = `<div class="profile">
      <div class="profile-eyebrow">ORGANIZATION PROFILE <span class="code">${esc(o.abbr)}</span><span>${esc(o.cat)}</span></div>
      <h2>${esc(o.zh)}</h2>
      <div class="en">${esc(o.en)}</div>
      <div class="badges">
        <span class="badge cyan">${esc(o.type)}</span>
        <span class="badge">${esc(o.countLabel)}</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><span class="k">成立于 FOUNDED</span><span class="v">${esc(o.founded)}</span></div>
        <div class="meta-item"><span class="k">总部 HQ</span><span class="v">${esc(o.hq)}</span></div>
        <div class="meta-item"><span class="k">类型 TYPE</span><span class="v">${esc(o.type)}</span></div>
        <div class="meta-item"><span class="k">成员 MEMBERS</span><span class="v">${esc(o.countLabel)}</span></div>
      </div>
      <div class="section"><h3>组织简介<span class="en">OVERVIEW</span></h3><p>${esc(o.desc)}</p></div>
      <div class="section">
        <h3>成员国 / 经济体<span class="en">MEMBERS · ${o.members.length + (o.extraMembers || []).length}</span></h3>
        <div class="chips scroll">
          ${extra}
          ${members.map((c) => `<button type="button" class="chip" data-a3="${c.a3}">${esc(c.zh)}</button>`).join("")}
        </div>
        <div class="data-note">点击成员可查看该国档案，地图高亮会保留。成员名单按 2025 年公开资料整理，可能随国际形势调整。</div>
      </div>
      <div class="profile-actions">
        <button type="button" class="btn primary" data-action="focus">转至高亮区域</button>
        <button type="button" class="btn" data-action="clear">清除高亮</button>
      </div>
    </div>`;
    if (open) openInfo();
    infoBody.scrollTop = 0;
    updateAll();
    state.dirty = true;
  }

  function renderContinent(id, open = true) {
    const c = contById.get(id);
    if (!c) return;
    state.activeCont = id;
    state.activeOrg = null;
    state.selected = null;
    refreshHighlight();
    setEyebrow(`CONTINENT / <b>${esc(CONT_CODE[id] || "")}</b>`);
    const all = D.countries.filter((x) => x.continent === c.zh);
    const sovereign = all.filter((x) => x.sovereign);
    const regions = all.length - sovereign.length;
    const sorted = all.slice().sort((a, b) => {
      if (a.sovereign !== b.sovereign) return a.sovereign ? -1 : 1;
      return (b.pop || 0) - (a.pop || 0);
    });
    infoBody.innerHTML = `<div class="profile">
      <div class="profile-eyebrow">CONTINENT PROFILE <span class="code">${esc(CONT_CODE[id] || "")}</span><span>REGION</span></div>
      <h2>${esc(c.zh)}</h2>
      <div class="en">${esc(c.en)}</div>
      <div class="badges">
        <span class="badge cyan">${sovereign.length} 个主权国家</span>
        ${regions ? `<span class="badge">${regions} 个地区 / 属地</span>` : ""}
        <span class="badge">${all.length} 个地图条目</span>
      </div>
      <div class="section"><h3>区域概览<span class="en">OVERVIEW</span></h3><p>${esc(c.desc)}</p></div>
      <div class="section">
        <h3>国家与地区<span class="en">COUNTRIES · ${all.length}</span></h3>
        <div class="chips scroll">${sorted.map((x) => `<button type="button" class="chip" data-a3="${x.a3}">${esc(x.zh)}</button>`).join("")}</div>
        <div class="data-note">点击国家查看档案；地图会保持该大洲的高亮。地区与属地以灰色标签区分。</div>
      </div>
      <div class="profile-actions">
        <button type="button" class="btn primary" data-action="focus">转至高亮区域</button>
        <button type="button" class="btn" data-action="clear">清除高亮</button>
      </div>
    </div>`;
    if (open) openInfo();
    infoBody.scrollTop = 0;
    updateAll();
    state.dirty = true;
  }

  /* ------------------------------------------------------------------ *
   *  UI events
   * ------------------------------------------------------------------ */

  function bindSidebar() {
    $("#side-scroll").addEventListener("click", (e) => {
      const orgEl = e.target.closest("[data-org]");
      if (orgEl) {
        const id = orgEl.dataset.org;
        if (state.activeOrg === id) clearAll();
        else selectOrg(id);
        return;
      }
      const contEl = e.target.closest("[data-cont]");
      if (contEl) {
        const id = contEl.dataset.cont;
        if (state.activeCont === id) clearAll();
        else selectContinent(id);
        return;
      }
      const a3El = e.target.closest("[data-a3]");
      if (a3El) {
        selectCountryToggle(a3El.dataset.a3, { focus: true, keepContext: false, zoom: true });
        clearSearch();
      }
    });

    searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = searchResults.querySelector("[data-a3],[data-org]");
        if (first) first.click();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        if (searchInput.value) clearSearch();
        searchInput.blur();
      }
    });
  }

  function bindInfo() {
    infoBody.addEventListener("click", (e) => {
      const backOrg = e.target.closest("[data-back-org]");
      if (backOrg) { if (state.activeOrg) renderOrg(state.activeOrg); return; }
      const backCont = e.target.closest("[data-back-cont]");
      if (backCont) { renderContinent(backCont.dataset.backCont); return; }
      const quickA3 = e.target.closest("[data-quick-a3]");
      if (quickA3) { selectCountry(quickA3.dataset.quickA3, { focus: true, keepContext: false }); return; }
      const quickOrg = e.target.closest("[data-quick-org]");
      if (quickOrg) { selectOrg(quickOrg.dataset.quickOrg); return; }
      const orgEl = e.target.closest("[data-org]");
      if (orgEl) { selectOrg(orgEl.dataset.org); return; }
      const a3El = e.target.closest("[data-a3]");
      if (a3El) { selectCountry(a3El.dataset.a3, { focus: true, keepContext: true }); return; }
      const contEl = e.target.closest("[data-cont]");
      if (contEl) { selectContinent(contEl.dataset.cont); return; }
      const act = e.target.closest("[data-action]");
      if (!act) return;
      if (act.dataset.action === "focus") {
        if (state.selected) {
          const c = byA3.get(state.selected);
          if (c) {
            if (state.mode === "globe") rotateTo(c.lat, c.lon);
            else zoomToCountry(c);
          }
        } else if (state.activeOrg) {
          const o = orgById.get(state.activeOrg);
          if (o && state.mode === "globe") rotateToSet(o.members);
          else if (o) zoomToSet(o.members);
        } else if (state.activeCont) {
          const center = CONT_CENTER[state.activeCont] || [20, 0];
          if (state.mode === "globe") rotateTo(center[0], center[1]);
          else {
            const set = (state.highlightSet && state.highlightSet.size)
              ? Array.from(state.highlightSet)
              : D.countries.filter((x) => x.continent === contById.get(state.activeCont).zh).map((x) => x.a3);
            zoomToSet(set);
          }
        }
      } else if (act.dataset.action === "clear") {
        clearAll();
      }
    });

    $("#info-close").addEventListener("click", closeInfo);

    breadcrumb.addEventListener("click", (e) => {
      const b = e.target.closest("[data-crumb]");
      if (!b) return;
      const [kind, id] = b.dataset.crumb.split(":");
      if (kind === "global") clearAll();
      else if (kind === "org") renderOrg(id);
      else if (kind === "cont") renderContinent(id);
      else if (kind === "country" && state.activeOrg) renderOrg(state.activeOrg);
      else if (kind === "country" && state.activeCont) renderContinent(state.activeCont);
    });
  }

  function setMode(mode) {
    if (mode === state.mode && state.booted) return;
    state.exitAnim = null;
    state.mode = mode;
    state.hover = null;
    state.cursor = null;
    hideTooltip();
    $("#mode-globe").classList.toggle("active", mode === "globe");
    $("#mode-flat").classList.toggle("active", mode === "flat");
    $("#mode-globe").setAttribute("aria-selected", String(mode === "globe"));
    $("#mode-flat").setAttribute("aria-selected", String(mode === "flat"));
    document.body.classList.toggle("mode-flat", mode === "flat");
    $(".hint").innerHTML = mode === "globe"
      ? "拖拽旋转 · 滚轮缩放<br>点击国家查看档案"
      : "拖拽平移 · 滚轮缩放<br>点击国家查看档案";

    if (mode === "flat") {
      if (!state.prep50) {
        showStageMsg("正在加载高精度国界…");
        loadGeo50().then(() => { if (state.prep50) hideStageMsg(); });
      } else {
        hideStageMsg();
      }
      if (state.selected) focusFlatCountry(state.selected);
    } else {
      hideStageMsg();
    }
    updateAll();
    state.dirty = true;
  }

  /* ------------------------------------------------------------------ *
   *  shareable view state (URL hash)
   * ------------------------------------------------------------------ */

  function stateSignature() {
    return [state.mode, state.selected || "", state.activeOrg || "", state.activeCont || ""].join("|");
  }

  function writeHash() {
    const p = new URLSearchParams();
    p.set("mode", state.mode);
    const rot = state.rotation || [0, 0];
    p.set("rot", Math.round(rot[0]) + "," + Math.round(rot[1]));
    if (state.activeOrg) p.set("org", state.activeOrg);
    else if (state.activeCont) p.set("cont", state.activeCont);
    if (state.selected) p.set("sel", state.selected);
    const hash = "#" + p.toString();
    if (location.hash === hash) return;
    try { history.replaceState(null, "", hash); }
    catch (_) { /* file:// 下某些浏览器禁止 replaceState，忽略即可，不影响功能 */ }
  }

  let lastSignature = null;
  function syncHashIfChanged() {
    const sig = stateSignature();
    if (sig === lastSignature) return;
    lastSignature = sig;
    writeHash();
  }

  function applyHash(opts = {}) {
    const raw = location.hash.replace(/^#/, "");
    if (!raw) return false;
    const p = new URLSearchParams(raw);
    const mode = p.get("mode");
    if (mode === "globe" || mode === "flat") {
      if (state.mode !== mode) setMode(mode);
    }
    const rot = p.get("rot");
    if (rot) {
      const parts = rot.split(",").map(Number);
      if (parts.length === 2 && parts.every(Number.isFinite)) {
        state.rotation = [parts[0], parts[1]];
      }
    }
    const sel = p.get("sel");
    const org = p.get("org");
    const cont = p.get("cont");
    if (org && orgById.has(org)) {
      selectOrg(org);
    } else if (cont && contById.has(cont)) {
      selectContinent(cont);
    } else if (sel && byA3.has(sel)) {
      selectCountry(sel, { focus: false });
    }
    state.dirty = true;
    lastSignature = stateSignature();
    return !!(sel || org || cont);
  }

  async function copyShareLink() {
    const url = location.href.split("#")[0] + "#" +
      new URLSearchParams({
        mode: state.mode,
        rot: Math.round(state.rotation[0]) + "," + Math.round(state.rotation[1]),
        ...(state.activeOrg ? { org: state.activeOrg } : {}),
        ...(state.activeCont ? { cont: state.activeCont } : {}),
        ...(state.selected ? { sel: state.selected } : {})
      }).toString();
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch (_) {}
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove();
    }
    if (optsToast) optsToast(ok ? "链接已复制，可分享当前视图" : "复制失败，请手动复制地址栏");
  }

  function optsToast(msg) {
    showStageMsg(msg, 2200);
  }

  window.addEventListener("hashchange", () => applyHash());

  function openSidebar() {
    sidebar.classList.add("open");
    scrim.classList.add("show");
    menuBtn.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function openAbout() {
    aboutModal.classList.add("open");
    aboutModal.setAttribute("aria-hidden", "false");
  }
  function closeAbout() {
    aboutModal.classList.remove("open");
    aboutModal.setAttribute("aria-hidden", "true");
  }

  function bindUI() {
    $("#mode-globe").addEventListener("click", () => setMode("globe"));
    $("#mode-flat").addEventListener("click", () => setMode("flat"));
    $("#zoom-in").addEventListener("click", () => {
      if (state.mode === "globe") state.globeScale = clamp(state.globeScale * 1.18, 0.72, 3.8);
      else zoomAt(state.w / 2, state.h / 2, 1.35);
      state.dirty = true;
    });
    $("#zoom-out").addEventListener("click", () => {
      if (state.mode === "globe") state.globeScale = clamp(state.globeScale / 1.18, 0.72, 3.8);
      else zoomAt(state.w / 2, state.h / 2, 1 / 1.35);
      state.dirty = true;
    });
    $("#reset-view").addEventListener("click", resetView);
    $("#toggle-rotate").addEventListener("click", () => {
      state.playing = !state.playing;
      const btn = $("#toggle-rotate");
      btn.classList.toggle("on", state.playing);
      btn.setAttribute("aria-pressed", String(state.playing));
      btn.setAttribute("aria-label", state.playing ? "暂停自动旋转" : "开启自动旋转");
      btn.title = state.playing ? "暂停自动旋转" : "开启自动旋转";
      state.dirty = true;
    });
    menuBtn.addEventListener("click", () => {
      if (sidebar.classList.contains("open")) closeSidebar();
      else openSidebar();
    });
    scrim.addEventListener("click", closeSidebar);
    $("#share-btn").addEventListener("click", copyShareLink);
    $("#about-btn").addEventListener("click", openAbout);
    $("#about-close").addEventListener("click", closeAbout);
    $("#about-link").addEventListener("click", (e) => { e.preventDefault(); openAbout(); });
    aboutModal.addEventListener("click", (e) => { if (e.target === aboutModal) closeAbout(); });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeSidebar();
    });
    window.addEventListener("keydown", (e) => {
      if (aboutModal.classList.contains("open")) {
        if (e.key === "Escape") closeAbout();
        return;
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchInput) {
          if (searchInput.value) clearSearch();
          searchInput.blur();
        } else if (info.classList.contains("open")) {
          closeInfo();
        }
        return;
      }
      if (e.key === "/" && document.activeElement !== searchInput && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        focusSearch();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   *  stars / clock
   * ------------------------------------------------------------------ */

  function initStars() {
    const sc = $("#starfield");
    const ctx = sc.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    sc.width = w * dpr;
    sc.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const count = Math.round((w * h) / 7000);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() < 0.9 ? Math.random() * 0.9 + 0.25 : Math.random() * 1.7 + 1.1;
      const a = Math.random() * 0.55 + 0.12;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = Math.random() < 0.12 ? `rgba(120,235,255,${a})` : `rgba(215,240,250,${a})`;
      ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, TAU);
      ctx.fillStyle = "rgba(150,248,255,.9)";
      ctx.shadowColor = "rgba(69,230,255,.9)";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initClock() {
    const el = $("#utc-clock");
    const tick = () => {
      const d = new Date();
      el.textContent = [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
        .map((n) => String(n).padStart(2, "0")).join(":");
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------ *
   *  main loop / init
   * ------------------------------------------------------------------ */

  function loop(ts) {
    const dt = Math.min(64, ts - (state.lastFrame || ts));
    state.lastFrame = ts;
    if (state.booted && state.mode === "globe") {
      const shouldRotate = state.playing && !state.animating && !state.pointerDown && !state.hover && !state.selected;
      if (shouldRotate) {
        state.rotation[0] += dt * 0.006;
        state.dirty = true;
      }
    }
    // 退出高亮转场：ease-in-out 从 1 淡到 0，结束后清除。
    if (state.exitAnim) {
      const e = state.exitAnim;
      const t = clamp((ts - e.t0) / e.duration, 0, 1);
      e.progress = 1 - easeInOut(t);
      state.dirty = true;
      if (t >= 1) state.exitAnim = null;
    }
    if (state.dirty) {
      state.dirty = false;
      render();
      syncHashIfChanged();
    }
    state.raf = requestAnimationFrame(loop);
  }

  async function init() {
    renderSidebar();
    bindUI();
    bindSidebar();
    bindInfo();
    renderGuide();
    initStars();
    initClock();
    window.addEventListener("resize", initStars);

    $("#stat-countries").textContent = D.meta.sovereign;
    $("#stat-orgs").textContent = D.orgs.length;

    const rotateBtn = $("#toggle-rotate");
    rotateBtn.classList.toggle("on", state.playing);
    rotateBtn.setAttribute("aria-pressed", String(state.playing));
    rotateBtn.setAttribute("aria-label", state.playing ? "暂停自动旋转" : "开启自动旋转");
    rotateBtn.title = state.playing ? "暂停自动旋转" : "开启自动旋转";

    try {
      setBoot(4, "正在同步地图引擎…");
      await Promise.all([
        loadScript(D3_URLS, () => typeof d3 !== "undefined"),
        loadScript(TOPO_URLS, () => typeof topojson !== "undefined")
      ]);
      setBoot(18, "引擎就绪，加载全球国界…");
      initGeoConstants();

      const topo110 = await loadGeo("110", GEO_110, (p) => setBoot(18 + p * 54, "加载全球国界 " + Math.round(p * 100) + "%"));
      setBoot(76, "构建国家索引…");
      state.prep110 = prepTopology(topo110);
      setBoot(88, "校准投影与渲染管线…");

      state.canvas = canvas;
      state.ctx = canvas.getContext("2d", { alpha: true });
      resizeCanvas();
      resizeObserver.observe(stage);

      state.booted = true;
      setBoot(100, "CORE ONLINE");
      renderSidebar();
      updateAll();

      // 从 URL hash 还原视图（分享链接直达）；若无指定目标，首屏主动展示引导卡。
      const restored = applyHash();
      if (!restored) {
        renderGuide();
        openInfo();
      }
      lastSignature = stateSignature();
      render();

      setTimeout(() => bootEl.classList.add("done"), 420);
      setTimeout(() => { if (!state.prep50) loadGeo50(); }, 1100);
      state.raf = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      bootFail("地图引擎或国界数据加载失败。请确认 vendor 目录中的本地文件完整，或网络连接正常后重试。");
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    if (!state.booted) return;
    resizeCanvas();
  });

  init();
})();

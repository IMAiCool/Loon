// 只处理明确广告标记及白名单列表；未知格式和解析错误原样放行。
(function () {
  const options = typeof $argument === "object" && $argument ? $argument : {};
  const url = $request.url || "";
  const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const splash = /^\/api\/ad\/v\d+\/splash\//.test(path);
  const category = splash ? "splash" : /^\/aweme\/v\d+\/follow\/feed\//.test(path) ? "following" : /^\/aweme\/v\d+\/nearby\/feed\//.test(path) ? "nearby" : /^\/aweme\/v\d+\/(?:search\/item|general\/search\/single|hot\/search\/video\/list)\//.test(path) ? "search" : /^\/aweme\/v\d+\/feed\//.test(path) ? "feed" : "";
  const marked = v => v === true || v === 1 || v === "1";
  const present = v => v !== null && v !== undefined && v !== false && v !== 0 && v !== "0" && v !== "" && (!Array.isArray(v) || v.length > 0) && (typeof v !== "object" || Array.isArray(v) || Object.keys(v).length > 0);
  const ad = item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const v = item.aweme_info || item.aweme || item;
    return [item, v].some(x => x && (marked(x.is_ads) || marked(x.is_ad) || present(x.raw_ad_data) || present(x.ad_id) || present(x.ad_data)));
  };
  try {
    if (!category || options[category] !== true || $response.status !== 200 || typeof $response.body !== "string") return $done({});
    const data = JSON.parse($response.body);
    if (!data || typeof data !== "object" || Array.isArray(data)) return $done({});
    let removed = 0;
    const keys = splash ? ["ads", "splash_ads", "splash_list"] : ["aweme_list", "items", "item_list", "search_result"];
    const visit = (obj, depth) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj) || depth > 3) return;
      for (const key of keys) if (Array.isArray(obj[key])) {
        const before = obj[key].length;
        obj[key] = obj[key].filter(item => !ad(item));
        removed += before - obj[key].length;
      }
      if (obj.data && typeof obj.data === "object") visit(obj.data, depth + 1);
      if (obj.result && typeof obj.result === "object") visit(obj.result, depth + 1);
    };
    visit(data, 0);
    if (removed) { console.log("[Douyin Clean] " + category + " removed=" + removed); return $done({body: JSON.stringify(data)}); }
  } catch (error) { console.log("[Douyin Clean] pass-through: " + String(error)); }
  $done({});
})();

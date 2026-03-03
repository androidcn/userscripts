/* 
 * 建行生活净化（Loon http-response）
 * 覆盖：yunbusiness.ccb.com/(basic_service|clp_service)/txCtrl?txcode=A3341ABxx
 *
 * 目标：
 * 1) 清内容广告字段（WINNOW_V3_FESTIVAL / HPBANNER / DAY_BEST_* / PREFERENCE 等）
 * 2) 清楼层开关（STOREY_DISPLAY_INFO）：移除 本地优惠/种草推荐/小编推荐/分期好生活
 * 3) 白名单保留：
 *    - FUNCTIONAL_AREA_AD_INFO（顶部4入口）
 *    - WINNOW_V3_MEB_GIFT（中间4卡）
 */

(function () {
  const body = $response.body || "";
  const t = body.trim();
  const looksJson =
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"));

  if (!looksJson) return $done({ body });

  // ——你要保留的模块（坚决不动）——
  const KEEP_KEYS = new Set([
    "FUNCTIONAL_AREA_AD_INFO",
    "WINNOW_V3_MEB_GIFT",
    "NOTICE_AD_INFO",
  ]);

  // ——明确广告字段（来自你文件+常见变体）——
  const DELETE_EXACT_KEYS = new Set([
    "WINNOW_V3_FESTIVAL",
    "PREFERENCE_AD_INFO",
    "HPBANNER_AD_INFO_SECOND",
    "HPBANNER_AD_INFO",
    "HPBANNER_AD_INFO_FIRST",
    "HPBANNER_AD_INFO_THIRD",
    "TAG_AD_INFO",
    "TAG_AD_INFO0",
    "TAG_AD_INFO1",
    "TAG_AD_INFO2",
  ]);

  // ——楼层开关：要移除的楼层关键词（你要求删）——
  const BAN_STOREY_NAME_PAT = /(本地优惠|种草推荐|小编推荐|分期好生活)/;

  // ✅ 新增：本地优惠楼层 TYPE=273（你抓包就是这个） :contentReference[oaicite:2]{index=2}
  const BAN_LOCAL_STOREY_TYPES = new Set(["273", 273]);

  // ——内容广告：字段名规则（谨慎）——
  function shouldDeleteKeyByName(k) {
    const key = String(k || "").toUpperCase();

    if (key.startsWith("DAY_BEST_")) return true;
    if (key.startsWith("HPBANNER")) return true;
    if (key.includes("PREFERENCE_AD")) return true;

    if (key.includes("LOCAL_BENEFIT") || key.includes("NEARBY_BENEFIT")) return true;
    if (key.startsWith("LOCAL_") || key.startsWith("NEARBY_") || key.startsWith("AROUND_")) return true;

    return false;
  }

  // ——深度剔除：只剔除“明显广告对象”（母版原逻辑）——
  function stripAdObjectsDeep(node) {
    if (!node) return node;

    if (Array.isArray(node)) {
      return node
        .map(stripAdObjectsDeep)
        .filter((item) => {
          if (!item || typeof item !== "object") return true;
          const keys = Object.keys(item).map((x) => String(x).toUpperCase());
          const looksAdObj =
            keys.includes("AD_URL") ||
            keys.includes("AD_IMG") ||
            keys.includes("AD_ID") ||
            keys.includes("SECOND_AD_TYPE");
          return !looksAdObj;
        });
    }

    if (typeof node === "object") {
      const out = {};
      for (const [k, v] of Object.entries(node)) out[k] = stripAdObjectsDeep(v);
      return out;
    }

    return node;
  }

  // ✅ 新增：仅删除“本地优惠”条目（不动其它）
  // 解释：你第二份响应里本地优惠会作为楼层存在 :contentReference[oaicite:3]{index=3}
  // 同时第一份响应里大量 AD_NAME 含“_本地优惠” :contentReference[oaicite:4]{index=4}
  function removeLocalBenefitDeep(node, topKey) {
    if (!node) return node;

    // 白名单模块完全不处理
    if (KEEP_KEYS.has(topKey)) return node;

    if (Array.isArray(node)) {
      return node.filter((it) => {
        if (!it || typeof it !== "object") return true;

        // 1) 如果是楼层结构，按 TYPE=273 强杀
        if (BAN_LOCAL_STOREY_TYPES.has(it.STOREY_TYPE)) return false;

        // 2) 按文字命中“本地优惠”（只查几个最常见字段，避免误伤）
        const hit =
          String(it.STOREY_NM || "").includes("本地优惠") ||
          String(it.STOREY_TITLE || "").includes("本地优惠") ||
          String(it.AD_NAME || "").includes("本地优惠");

        return !hit;
      });
    }

    if (typeof node === "object") {
      for (const k of Object.keys(node)) {
        node[k] = removeLocalBenefitDeep(node[k], topKey);
      }
      return node;
    }

    return node;
  }

  try {
    const obj = JSON.parse(body);
    const data = obj?.data;

    if (!data || typeof data !== "object") return $done({ body });

    // 1) STOREY_DISPLAY_INFO：母版按名字删
    // ✅ 新增：同时按 STOREY_TYPE=273 强杀（本地优惠楼层）
    if (Array.isArray(data.STOREY_DISPLAY_INFO)) {
      data.STOREY_DISPLAY_INFO = data.STOREY_DISPLAY_INFO.filter((it) => {
        const nm = String(it?.STOREY_NM || it?.STOREY_TITLE || "");
        if (BAN_STOREY_NAME_PAT.test(nm)) return false;          // 母版逻辑
        if (BAN_LOCAL_STOREY_TYPES.has(it?.STOREY_TYPE)) return false; // ✅ 新增
        return true;
      });
    }

    // 2) 删除 data 下的广告位字段（母版逻辑）
    for (const k of Object.keys(data)) {
      if (KEEP_KEYS.has(k)) continue;

      if (DELETE_EXACT_KEYS.has(k)) {
        delete data[k];
        continue;
      }

      if (shouldDeleteKeyByName(k)) {
        delete data[k];
        continue;
      }
    }

    // 3) 深度剔除明显广告对象（母版逻辑）
    for (const k of Object.keys(data)) {
      if (KEEP_KEYS.has(k)) continue;
      data[k] = stripAdObjectsDeep(data[k]);
    }

    // ✅ 4) 最后：全局深度仅剔除“本地优惠”残留条目（新增）
    for (const k of Object.keys(data)) {
      data[k] = removeLocalBenefitDeep(data[k], k);
    }

    return $done({ body: JSON.stringify(obj) });
  } catch (e) {
    return $done({ body });
  }
})();

/*
 * QQ / QQ空间 广告响应净化
 * 适用：Loon http-response
 * 原则：仅删除带有明确 GDT/广告特征的数据，不做关键词“广告”泛匹配，降低误删正常好友动态的概率。
 */
const body=$response.body||"";
let removed=0;

const AD_KEYS=new Set([
  "ad_info","adInfo","ads_info","adsInfo","advertisement_info","advertisementInfo",
  "gdt_info","gdtInfo","gdt_ad","gdtAd","ad_data","adData","ad_list","adList",
  "advertisement_list","advertisementList"
]);

const FLAG_KEYS=[
  "is_ad","isAd","is_ads","isAds","is_gdt","isGdt","ad_flag","adFlag",
  "advertisement","isAdvertisement"
];

const AD_DOMAINS=[
  "pgdt.gtimg.cn","gdt.qq.com","tangram.e.qq.com","sdkreport.e.qq.com",
  "adsmind.gdtimg.com","xj-landing.gdtimg.com","qzonestyle.gtimg.cn/qzone/biz/gdt/"
];

function truthyAdFlag(v){
  return v===true||v===1||v==="1"||v==="true";
}

function hasKnownAdDomain(v){
  if(typeof v!=="string") return false;
  const s=v.toLowerCase();
  return AD_DOMAINS.some(x=>s.includes(x));
}

function hasAdType(obj){
  const keys=["type","card_type","cardType","feed_type","feedType","business_type","businessType","source_type","sourceType"];
  for(const k of keys){
    if(typeof obj[k]!=="string") continue;
    const v=obj[k].toLowerCase();
    if(v==="ad"||v==="ads"||v==="gdt"||v==="advertisement"||v.startsWith("gdt_")||v.startsWith("ad_")) return true;
  }
  return false;
}

function isAdObject(obj){
  if(!obj||typeof obj!=="object"||Array.isArray(obj)) return false;
  for(const k of FLAG_KEYS){
    if(Object.prototype.hasOwnProperty.call(obj,k)&&truthyAdFlag(obj[k])) return true;
  }
  if(hasAdType(obj)) return true;
  for(const k of AD_KEYS){
    if(Object.prototype.hasOwnProperty.call(obj,k)){
      const v=obj[k];
      if(v!==null&&v!==undefined&&v!==false&&v!==0&&v!==""&&(!Array.isArray(v)||v.length>0)) return true;
    }
  }
  try{
    const s=JSON.stringify(obj).toLowerCase();
    if(AD_DOMAINS.some(x=>s.includes(x))) return true;
  }catch(e){}
  return false;
}

function clean(value){
  if(Array.isArray(value)){
    const out=[];
    for(const item of value){
      if(isAdObject(item)){removed++;continue;}
      const v=clean(item);
      if(v!==undefined) out.push(v);
    }
    return out;
  }
  if(value&&typeof value==="object"){
    for(const k of Object.keys(value)){
      if(AD_KEYS.has(k)){
        delete value[k];
        removed++;
        continue;
      }
      const v=value[k];
      if(typeof v==="string"&&hasKnownAdDomain(v)){
        delete value[k];
        removed++;
        continue;
      }
      value[k]=clean(v);
    }
    return value;
  }
  return value;
}

function parsePayload(raw){
  const t=raw.trim();
  if(!t) return null;
  if(t.startsWith("{")||t.startsWith("[")){
    return {kind:"json",data:JSON.parse(t)};
  }
  const l=t.indexOf("("),r=t.lastIndexOf(")");
  if(l>0&&r>l){
    const prefix=t.slice(0,l+1),suffix=t.slice(r);
    const inner=t.slice(l+1,r);
    return {kind:"jsonp",prefix,suffix,data:JSON.parse(inner)};
  }
  return null;
}

try{
  const parsed=parsePayload(body);
  if(!parsed) $done({});
  else{
    const cleaned=clean(parsed.data);
    const json=JSON.stringify(cleaned);
    const out=parsed.kind==="jsonp"?parsed.prefix+json+parsed.suffix:json;
    $done({body:out});
  }
}catch(e){
  console.log("[QQ空间净化] 解析失败，返回原响应: "+e);
  $done({});
}

/*
 * 高德地图净化 + 底栏自定义（Loon）
 * 自写实现：针对 JSON 响应做保守清理；不修改账号、导航、定位、收藏等核心数据。
 * 2026-09-26
 */
const URL=$request.url;
const ARG_KEYS=["cleanSplash","cleanHome","cleanSearch","cleanPoi","cleanTaxi","cleanMine","customTab","hideExplore","hideVoice","hideTaxi","hideMine","debug"];
function parseArgs(){
  let raw=typeof $argument==="undefined"?{}:$argument,out={};
  if(Array.isArray(raw)) raw.forEach((v,i)=>{if(ARG_KEYS[i]) out[ARG_KEYS[i]]=v;});
  else if(raw&&typeof raw==="object") out={...raw};
  else if(typeof raw==="string"){
    try{const x=JSON.parse(raw);if(x&&typeof x==="object") out=x;}catch(e){raw.split(/[,&]/).forEach(p=>{const i=p.indexOf("=");if(i>0) out[p.slice(0,i).trim()]=p.slice(i+1).trim();});}
  }
  return out;
}
const A=parseArgs();
function on(k,d=true){const v=A[k];if(v===undefined||v===null||v==="") return d;return v===true||v===1||/^(1|true|yes|on)$/i.test(String(v));}
const DEBUG=on("debug",false);
function log(...x){if(DEBUG) console.log("[AmapCustom]",...x);}
function del(o,k){if(o&&Object.prototype.hasOwnProperty.call(o,k)) delete o[k];}
function blankConfig(o,k){if(o&&Object.prototype.hasOwnProperty.call(o,k)) o[k]={status:1,version:"",value:""};}
function cleanSplash(obj){if(!on("cleanSplash",true)) return;if(Array.isArray(obj?.data?.ad)){obj.data.ad=[];log("splash cleared");}}
function cleanHome(obj){
  if(!on("cleanHome",true)||!obj?.data) return;
  if(Array.isArray(obj.data.cardList)){
    const keep=new Set(["ContinueNavigationCard","FrequentLocation","LoginCard"]);
    obj.data.cardList=obj.data.cardList.filter(x=>keep.has(x?.dataKey));
  }
  if(Array.isArray(obj.data.mapBizList)) obj.data.mapBizList=obj.data.mapBizList.filter(x=>x?.dataKey==="FindCarVirtualCard");
}
function cleanMine(obj){
  if(!on("cleanMine",true)||!obj?.data) return;
  ["tipData","memberInfo","topMixedCard","upgradeDialogData","bulletData"].forEach(k=>del(obj.data,k));
  if(Array.isArray(obj.data.cardList)) obj.data.cardList=obj.data.cardList.filter(x=>!/Recommend|Activity|Marketing|Promotion|Coupon|Feed|Hotel|Travel/i.test(String(x?.dataKey||"")));
}
function cleanAocs(obj){
  if(!on("cleanHome",true)||!obj?.data) return;
  ["SplashScreenControl","splashscreen","splashview_config","home_business_position_config","operation_layer","route_banner","routeresult_banner","taxi_activity","sur_bar","nearby_business_popup","landing_page_info","small_biz_case","feedback_banner","navi_end","preword","search_keyword","search_word"].forEach(k=>blankConfig(obj.data,k));
}
function cleanSearch(obj){
  if(!on("cleanSearch",true)) return;
  if(Array.isArray(obj?.data?.headerHotWord)) obj.data.headerHotWord=[];
  if(obj?.history_tags) del(obj,"history_tags");
  const cleanList=list=>{
    if(!list) return;
    ["hookInfo","promotion_wrap_card","tips_operation_info"].forEach(k=>del(list,k));
    if(list?.map_bottom_bar) del(list.map_bottom_bar,"hotel");
    if(list?.bottom?.bottombar_button) del(list.bottom.bottombar_button,"hotel");
    if(list?.poi?.item_info?.tips_bottombar_button) del(list.poi.item_info.tips_bottombar_button,"hotel");
    if(Array.isArray(list?.content)) list.content=list.content.filter(x=>!["brandAdCard","toplist_al","ImageBanner"].includes(x?.item_type));
  };
  cleanList(obj?.data?.list_data);
  cleanList(obj?.data?.modules?.list_data?.data);
  cleanList(obj?.data?.modules?.not_parse_result?.data?.list_data);
  if(Array.isArray(obj?.tip_list)) obj.tip_list=obj.tip_list.filter(x=>!(["ad","poi_ad","toplist"].includes(x?.tip?.result_type)||["ad","sp"].includes(x?.tip?.task_tag)||x?.tip?.datatype_spec==="12"));
  if(Array.isArray(obj?.city_list)) obj.city_list.forEach(c=>{if(Array.isArray(c?.tip_list)) c.tip_list=c.tip_list.filter(x=>!(["ad","poi_ad"].includes(x?.tip?.result_type)||x?.tip?.datatype_spec==="12"));});
  if(obj?.data?.modules){["belt","common_float_bar","common_image_banner","coupon_discount_float_bar","coupon_float_bar","discount_coupon","image_cover_bar","mood_coupon_banner","operation_brand","promotion_wrap_card","tips_top_banner"].forEach(k=>del(obj.data.modules,k));}
  del(obj?.data,"coupon");
}
function cleanPoi(obj){
  if(!on("cleanPoi",true)||!obj?.data?.modules) return;
  const keys=["CouponBanner","adv_gift","common_coupon_bar","common_coupon_card","city_discount","divergentRecommendModule","everyOneToSee","horizontalGoodsShelf","hotelCoupon","image_banner","matrix_banner","membership","nearbyRecommendModule","newGuest","newRelatedRecommends","new_operation_banner","operation_banner","poster_banner","relatedRecommends","sameIndustryRecommendModule","sameIndustry2RecommendModule","travelGuideRec","waterFallFeed","waterFallFeedTitle"];
  keys.forEach(k=>del(obj.data.modules,k));
}
function cleanTaxi(obj){
  if(!on("cleanTaxi",true)||!obj?.data) return;
  if(URL.includes("/promotion-web/resource")) ["alpha","banner","bravo","bubble","charlie","icon","other","popup","push","tips"].forEach(k=>del(obj.data,k));
  if(URL.includes("/boss/order_web/friendly_information")&&obj.data["105"]) ["banners","carouselTips","integratedBanners","integratedTips","skins","skinAndTips","tips"].forEach(k=>del(obj.data["105"],k));
  if(URL.includes("/boss/car/order/content_info")&&Array.isArray(obj?.data?.lubanData?.skin?.dataList)) obj.data.lubanData.skin.dataList=[];
}
const TAB_FIELDS=["title","name","text","label","tabName","tab_name","key","id","biz","bizType","dataKey","type","action","scheme","schema","url"];
function tabText(x){if(typeof x==="string") return x.toLowerCase();if(!x||typeof x!=="object") return "";return TAB_FIELDS.map(k=>typeof x[k]==="string"?x[k]:"").join(" ").toLowerCase();}
function tabType(x){
  const s=tabText(x);
  if(/(^|[^a-z])(home|map)([^a-z]|$)|首页|地图/.test(s)) return "home";
  if(/explore|discover|发现|探索/.test(s)) return "explore";
  if(/voice|speech|talk|mic|语音|说话/.test(s)) return "voice";
  if(/taxi|ride|dache|打车|出行/.test(s)) return "taxi";
  if(/mine|profile|usercenter|user_center|我的|个人中心/.test(s)) return "mine";
  return null;
}
function hiddenType(t){return (t==="explore"&&on("hideExplore",true))||(t==="voice"&&on("hideVoice",true))||(t==="taxi"&&on("hideTaxi",false))||(t==="mine"&&on("hideMine",false));}
function customizeTabs(root){
  if(!on("customTab",true)) return 0;
  let changed=0;
  const walk=(node,key,depth)=>{
    if(depth>9||node===null||node===undefined) return;
    if(Array.isArray(node)){
      if(node.length>=3&&node.length<=8){
        const types=node.map(tabType),recognized=types.filter(Boolean),uniq=new Set(recognized),context=/tab|bar|nav|menu|bottom|entrance|channel/i.test(String(key||""));
        const candidate=(context&&recognized.length>=3&&uniq.has("home"))||(recognized.length>=4&&uniq.has("home")&&uniq.has("mine"));
        if(candidate){
          const next=node.filter((item,i)=>!hiddenType(types[i]));
          if(next.length>=2&&next.length<node.length){node.splice(0,node.length,...next);changed++;log("tabbar",key,types,"=>",next.map(tabType));}
        }
      }
      node.forEach(x=>walk(x,key,depth+1));return;
    }
    if(typeof node==="object") Object.keys(node).forEach(k=>walk(node[k],k,depth+1));
  };
  walk(root,"root",0);return changed;
}
function run(obj){
  if(URL.includes("/valueadded/alimama/splash_screen")) cleanSplash(obj);
  if(URL.includes("/faas/amap-navigation/main-page")){cleanHome(obj);customizeTabs(obj);}
  if(URL.includes("/shield/frogserver/aocs/updatable/")){cleanAocs(obj);customizeTabs(obj);}
  if(URL.includes("/shield/dsp/profile/index/nodefaasv3")) cleanMine(obj);
  if(URL.includes("/shield/search_bff/hotword")||URL.includes("/shield/search_poi/")) cleanSearch(obj);
  if(URL.includes("/shield/search/poi/detail")){cleanPoi(obj);cleanSearch(obj);}
  if(URL.includes("/promotion-web/resource")||URL.includes("/boss/car/order/content_info")||URL.includes("/boss/order_web/friendly_information")) cleanTaxi(obj);
  return obj;
}
try{
  if(!$response?.body) $done({});
  const obj=run(JSON.parse($response.body));
  $done({body:JSON.stringify(obj)});
}catch(e){log("pass-through",e?.message||e);$done({});}

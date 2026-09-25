/*
 * 番茄小说 JSON 广告/营销/追踪垃圾清理
 * 1. 登录/验证码/Auth/Token接口完全不修改
 * 2. 普通接口中的账户相关子树完全保护
 * 3. 其余明确广告节点继续删除
 * 4. 营销垃圾、追踪垃圾可单独关闭
 * 5. JSON异常时原样返回
 */

const args=typeof $argument==="object"&&$argument?$argument:{};
const ENABLED=args.EmbeddedCleaner!==false;
const MARKETING=args.MarketingCleaner!==false;
const TRACKING=args.TrackingCleaner!==false;
const DEBUG=args.Debug===true;
const url=$request?.url||"";
const cleanUrl=url.split("?")[0];

function log(msg){
    if(DEBUG)console.log("[FanQieCleaner] "+msg);
}

/* 账户相关URL：整个Response完全放行 */
const SAFE_URL_RE=/(passport|login|logout|signin|sign_in|sign-in|auth|oauth|access_token|refresh[_-]?token|session|captcha|sms|verification|verify|send[_-]?(code|sms)|mobile[_-]?code|phone[_-]?code|bind[_-]?(mobile|phone)|account\/login|user\/login|user\/auth|credential)/i;

/* 强保护字段：命中后整个子树停止递归 */
const PROTECTED_KEYS=new Set([
    "user","userinfo","user_info","userInfo","user_data","userData","user_detail","userDetail",
    "profile","user_profile","userProfile","member","member_info","memberInfo",
    "account","account_info","accountInfo","account_data","accountData",
    "login","login_info","loginInfo","login_data","loginData","login_status","loginStatus","is_login","isLogin","logged_in","loggedIn",
    "token","access_token","accessToken","refresh_token","refreshToken","id_token","idToken","auth_token","authToken","user_token","userToken",
    "session","session_id","sessionId","session_key","sessionKey","session_token","sessionToken","sid",
    "auth","authentication","authorization","credential","credentials",
    "passport","passport_info","passportInfo",
    "mobile","phone","telephone","mobile_info","mobileInfo","phone_info","phoneInfo",
    "sms","sms_code","smsCode","captcha","captcha_code","captchaCode","verify_code","verifyCode",
    "uid","user_id","userId","userid","account_id","accountId",
    "cookie","cookies",
    "device","device_info","deviceInfo","device_id","deviceId","device_id_str","deviceIdStr","install_id","installId",
    "identity","identity_info","identityInfo","security","security_info","securityInfo"
]);

const PROTECTED_KEY_RE=/(?:^|_)(?:user|account|member|profile|login|passport|token|session|auth|credential|identity|phone|mobile|sms|captcha|verify|security|cookie|device[_-]?id|install[_-]?id|uid)(?:_|$)/i;

/* 明确广告节点 */
const AD_KEYS=new Set([
    "ad","ads","ad_info","adInfo","adinfo","ad_data","adData","ad_item","adItem","ad_items","adItems","ad_list","adList","ad_lists","adLists",
    "ad_config","adConfig","ad_configs","adConfigs","ad_slot","adSlot","ad_slots","adSlots",
    "advertisement","advertisements","advertising","commercial_ad","commercialAd",
    "splash_ad","splashAd","splash_ads","splashAds","feed_ad","feedAd","feed_ads","feedAds",
    "insert_ad","insertAd","insert_ads","insertAds","interstitial_ad","interstitialAd",
    "chapter_ad","chapterAd","chapter_ads","chapterAds","reader_ad","readerAd","reader_ads","readerAds",
    "reward_ad","rewardAd","reward_ads","rewardAds","video_ad","videoAd","video_ads","videoAds",
    "audio_ad","audioAd","audio_ads","audioAds","ad_banner","adBanner","ad_popup","adPopup","popup_ad","popupAd","topview_ad","topViewAd"
]);

/* 广告开关：保留字段但改成false/0 */
const AD_SWITCH_KEYS=new Set([
    "has_ad","hasAd","show_ad","showAd","is_ad","isAd","enable_ad","enableAd","ad_enable","adEnable","ad_enabled","adEnabled",
    "need_ad","needAd","can_show_ad","canShowAd","show_splash_ad","showSplashAd","show_reader_ad","showReaderAd",
    "show_chapter_ad","showChapterAd","show_feed_ad","showFeedAd","show_video_ad","showVideoAd",
    "show_audio_ad","showAudioAd","need_show_ad","needShowAd"
]);

/* 明确营销垃圾；不删除 banner/activity/recommend/popup/notice 等泛字段 */
const MARKETING_KEYS=new Set([
    "marketing_ad","marketingAd","marketing_banner","marketingBanner","marketing_ads","marketingAds",
    "commercial_banner","commercialBanner","commercial_popup","commercialPopup",
    "promotion_ad","promotionAd","promotion_ads","promotionAds","promotion_banner","promotionBanner","promotion_popup","promotionPopup",
    "operation_ad","operationAd","operation_ads","operationAds","business_ad","businessAd","business_ads","businessAds"
]);

/* 明确广告追踪字段 */
const TRACKING_KEYS=new Set([
    "ad_track","adTrack","ad_tracking","adTracking","track_url","trackUrl","track_urls","trackUrls",
    "click_track_url","clickTrackUrl","click_track_urls","clickTrackUrls",
    "show_track_url","showTrackUrl","show_track_urls","showTrackUrls",
    "impression_url","impressionUrl","impression_urls","impressionUrls",
    "impression_track_url","impressionTrackUrl","impression_track_urls","impressionTrackUrls",
    "ad_log","adLog","ad_log_extra","adLogExtra"
]);

function isProtectedKey(key){
    if(PROTECTED_KEYS.has(key))return true;
    const normalized=String(key).replace(/([a-z0-9])([A-Z])/g,"$1_$2").replace(/-/g,"_").toLowerCase();
    return PROTECTED_KEY_RE.test(normalized);
}

function containsProtectedIdentity(obj){
    if(!obj||typeof obj!=="object"||Array.isArray(obj))return false;
    for(const key of Object.keys(obj)){
        if(isProtectedKey(key))return true;
    }
    return false;
}

function isAdObject(obj){
    if(!obj||typeof obj!=="object"||Array.isArray(obj))return false;
    if(containsProtectedIdentity(obj))return false;
    if(obj.is_ad===true||obj.isAd===true)return true;
    const adId=obj.ad_id??obj.adId;
    if(adId!==undefined&&adId!==null&&String(adId)!==""&&String(adId)!=="0")return true;
    const type=String(
        obj.type??obj.item_type??obj.itemType??obj.cell_type??obj.cellType??obj.content_type??obj.contentType??obj.data_type??obj.dataType??""
    ).toLowerCase();
    const AD_TYPES=new Set([
        "ad","ads","advertisement","advertising","commercial_ad","splash_ad","feed_ad","insert_ad",
        "interstitial_ad","reader_ad","chapter_ad","reward_ad","video_ad","audio_ad","popup_ad","topview_ad"
    ]);
    return AD_TYPES.has(type);
}

function disableAdValue(value){
    if(typeof value==="boolean")return false;
    if(typeof value==="number")return 0;
    if(typeof value==="string"){
        if(/^(true|yes|on|enable|enabled)$/i.test(value))return "false";
        if(/^1$/.test(value))return "0";
    }
    return value;
}

let removedAd=0;
let removedMarketing=0;
let removedTracking=0;
let disabledAd=0;
let protectedNodes=0;

function clean(value,path="root"){
    if(Array.isArray(value)){
        const result=[];
        for(let i=0;i<value.length;i++){
            const item=value[i];
            if(isAdObject(item)){
                removedAd++;
                log("删除广告元素: "+path+"["+i+"]");
                continue;
            }
            result.push(clean(item,path+"["+i+"]"));
        }
        return result;
    }

    if(!value||typeof value!=="object")return value;

    for(const key of Object.keys(value)){
        const currentPath=path+"."+key;

        /* 第一优先级：账户、身份、Token、Session数据保护 */
        if(isProtectedKey(key)){
            protectedNodes++;
            log("账户保护: "+currentPath);
            continue;
        }

        /* 明确广告字段 */
        if(AD_KEYS.has(key)){
            delete value[key];
            removedAd++;
            log("删除广告字段: "+currentPath);
            continue;
        }

        /* 广告开关 */
        if(AD_SWITCH_KEYS.has(key)){
            value[key]=disableAdValue(value[key]);
            disabledAd++;
            log("关闭广告开关: "+currentPath);
            continue;
        }

        /* 营销垃圾 */
        if(MARKETING&&MARKETING_KEYS.has(key)){
            delete value[key];
            removedMarketing++;
            log("删除营销垃圾: "+currentPath);
            continue;
        }

        /* 广告追踪 */
        if(TRACKING&&TRACKING_KEYS.has(key)){
            delete value[key];
            removedTracking++;
            log("删除追踪数据: "+currentPath);
            continue;
        }

        value[key]=clean(value[key],currentPath);
    }

    return value;
}

if(!ENABLED){
    log("内嵌垃圾清理已关闭");
    $done({});
}else if(SAFE_URL_RE.test(cleanUrl)){
    log("账户接口完整放行: "+cleanUrl);
    $done({});
}else{
    try{
        const body=$response?.body;
        if(!body){
            log("Response Body为空");
            $done({});
        }else{
            let data=JSON.parse(body);
            data=clean(data);
            log(
                "清理完成"+
                " | 广告="+removedAd+
                " | 广告开关="+disabledAd+
                " | 营销="+removedMarketing+
                " | 追踪="+removedTracking+
                " | 账户保护="+protectedNodes
            );
            $done({body:JSON.stringify(data)});
        }
    }catch(e){
        log("解析失败，原样放行: "+String(e));
        $done({});
    }
}

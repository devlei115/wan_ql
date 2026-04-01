// 当前脚本来自于 http://script.345yun.cn 脚本库下载！
// 当前脚本来自于 http://2.345yun.cn 脚本库下载！
// 当前脚本来自于 http://2.345yun.cc 脚本库下载！
// 脚本库官方QQ群1群: 429274456
// 脚本库官方QQ群2群: 1077801222
// 脚本库官方QQ群3群: 433030897
// 脚本库中的所有脚本文件均来自热心网友上传和互联网收集。
// 脚本库仅提供文件上传和下载服务，不提供脚本文件的审核。
// 您在使用脚本库下载的脚本时自行检查判断风险。
// 所涉及到的 账号安全、数据泄露、设备故障、软件违规封禁、财产损失等问题及法律风险，与脚本库无关！均由开发者、上传者、使用者自行承担。

//kskm  【验证文本123】
// 账号配置：ksck 支持 ck 即 cookie，salt，proxy 组合，可用 # 或 @ 分隔
//           cookie + salt：ck#salt
//           含备注：remark#ck#salt
//           带 SOCKS5 代理：ck#salt#socks5://user:pass@host:port（用户名/密码可省略，或使用 ip|端口|账号|密码）
//           不使用代理可填写 0 或 留空
//           同样支持 @ 代替 #（如 remark@ck@salt@socks5://...）
// 任务配置：Task 可选 look,box,food,kbox,search,look_follow,search_follow
//          - 不设置 Task 时，默认执行全部任务（含 look_follow 与 search_follow）
//          - look: 看广告得金币；look_follow: look 成功后追加执行
//          - box: 宝箱广告；food: 饭补广告；kbox: 开宝箱
//          - search: 搜索任务；search_follow: search 成功后追加执行
// 
// 环境变量配置说明：
// 
// 【任务执行配置】
// - Task: 执行的任务列表（不设则默认执行全部）
//   可选值：look, box, food, kbox, search, look_follow, search_follow
//   多个任务用逗号分隔，如：Task=look,box,search
// 
// 【任务次数配置】
// - KSLOOK_COUNT: look 总执行次数，默认50
// - KSBOX_COUNT: box 总执行次数，默认10
// - KSFOOD_COUNT: food 总执行次数，默认10
// - KSKBOX_COUNT: kbox 总执行次数，默认1
// - KSSEARCH_COUNT: search 总执行次数，默认10
// - KSFOLLOW_COUNT: 每次 look 成功后 look_follow 追加次数，默认2
// - KSSEARCHFOLLOW_COUNT: 每次 search 成功后 search_follow 追加次数，默认2
// 
// 【等待时间配置】（格式：MIN-MAX 或 MIN,MAX，单位：秒）
// - KSWATCH_AD_TIME: 看广告等待时间范围，默认：30-40
// - KSPRE_LOOK_FOLLOW_WAIT: look 与 look_follow 之间等待，默认：15-30
// - KSBETWEEN_LOOK_FOLLOW_WAIT: 多次 look_follow 间隔，默认：35-50
// - KSPRE_SEARCH_FOLLOW_WAIT: search 与 search_follow 之间等待，默认：15-30
// - KSBETWEEN_SEARCH_FOLLOW_WAIT: 多次 search_follow 间隔，默认：15-30
// - KSROUND_START_WAIT: 任务块开始前等待，默认：7-15
// - KSROUND_END_WAIT: 任务块内操作间隔，默认：10-20
// - KSTASK_SWITCH_WAIT: 任务块切换等待，默认：15-30
// 
// 【金币和奖励配置】
// - KSCOIN_LIMIT: 金币上限，默认500000（达到上限后停止任务）
// - KSLOW_REWARD_THRESHOLD: 低奖励阈值，默认10（单次奖励≤该值计入低奖励次数）
// - KSLOW_REWARD_LIMIT: 连续低奖励上限，默认3（达到后停止全部任务）
// 
// 【其他配置】
// - MAX_CONCURRENCY: 最大并发数，默认888
// - SKIP_LIVE_ADS: 是否跳过直播广告（默认1，设置为0关闭）
// - SKIP_LIVE_MAX_RETRIES: 跳过直播广告时的最大重试次数（默认5）
// - ENABLE_CHANGE_DID: 是否允许脚本自动更换did（默认1，设置为0关闭自动更换did）
// - FORCE_COLOR: 强制启用颜色输出（设置为"1"启用，设置为"0"禁用）
// - NO_COLOR: 禁用颜色输出（设置为"1"禁用）





(function () {
  // 获取环境变量
  const kskm = process.env.kskm;

  // 验证环境变量是否正确
  if (typeof kskm === "undefined" || kskm !== "验证文本123") { // 可自定义验证文本
    console.log("❌ 脚本验证失败：kskm 变量未定义或值不正确");
    console.log("💡 请确保已正确设置环境变量 kskm");
    console.log("📢 永久公益版 通知渠道：示例频道"); // 去掉群号，改成自定义文字
    process.exit(1);
  }

  // 验证通过
  console.log("✅ 脚本验证通过，开始执行...");
  console.log("📢 会员专线 通知渠道：示例频道"); // 去掉群号，改成自定义文字
})();

// ===== 引入依赖模块 =====
const querystring = require("querystring");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const {
  SocksProxyAgent: SocksProxyAgent
} = require("socks-proxy-agent");

function detectLiveAd(adData = {}) {
  try {
    // 获取扩展信息，优先取 adExtInfo
    let extInfo = adData.adExtInfo || adData.extInfo || adData?.ad?.adExtInfo || "{}";

    // 如果是字符串，则尝试解析成对象
    if (typeof extInfo === "string") {
      try {
        extInfo = JSON.parse(extInfo);
      } catch (err) {
        extInfo = {};
      }
    }

    // 直播相关关键词
    const liveKeywords = ["直播", "live", "主播", "LIVE", "zb", "ZB"];

    // 获取各类文本信息，全部转小写
    const creativeId = String(adData.creativeId || adData?.ad?.creativeId || "").toLowerCase();
    const description = String(extInfo.description || "").toLowerCase();
    const title = String(extInfo.title || adData.title || "").toLowerCase();
    const caption = String(extInfo.caption || adData.caption || "").toLowerCase();

    // 待检测的内容集合
    const contents = [creativeId, description, title, caption, JSON.stringify(extInfo)];

    // 检查是否包含直播关键词
    for (const text of contents) {
      if (text) {
        for (const keyword of liveKeywords) {
          if (text.includes(keyword.toLowerCase())) {
            return true;
          }
        }
      }
    }

    // 检查 materialTime 是否超过 1 分钟（60000ms）
    const materialTime = adData.materialTime || adData?.ad?.materialTime || 0;
    if (materialTime > 60000) {
      return true;
    }

    // 检查 creativeId 是否以 live/zb 前缀开头
    if (
      creativeId.startsWith("live_") ||
      creativeId.startsWith("zb_") ||
      creativeId.startsWith("live-") ||
      creativeId.startsWith("zb-")
    ) {
      return true;
    }

    return false; // 都不符合条件，返回 false
  } catch (err) {
    return false; // 出现异常，默认认为不是直播广告
  }
}

function readIntConfig(envName, defaultValue) {
  const value = parseInt(process.env[envName], 10);
  return isNaN(value) ? defaultValue : value;
}

function readStringConfig(envName, defaultValue) {
  const value = process.env[envName];
  return value ? value.trim() : defaultValue;
}

function readRangeConfig(envName, min, max) {
  const value = process.env[envName];
  if (!value) return [min, max];

  const separator = value.includes("-") ? "-" : ",";
  const parts = value.split(separator).map(x => x.trim()).filter(Boolean);

  if (parts.length === 2) {
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      return [start, end];
    }
  }

  return [min, max];
}

const COIN_LIMIT = readIntConfig("KSCOIN_LIMIT", 500000);
const LOW_REWARD_THRESHOLD = readIntConfig("KSLOW_REWARD_THRESHOLD", 10);
const LOW_REWARD_LIMIT = readIntConfig("KSLOW_REWARD_LIMIT", 3);
const LOOK_COUNT = readIntConfig("KSLOOK_COUNT", 50);
const FOLLOW_COUNT = readIntConfig("KSFOLLOW_COUNT", 5);
const SEARCH_COUNT = readIntConfig("KSSEARCH_COUNT", 5);
const SEARCH_FOLLOW_COUNT = readIntConfig("KSSEARCHFOLLOW_COUNT", 2);
const BOX_COUNT = readIntConfig("KSBOX_COUNT", 30);
const FOOD_COUNT = readIntConfig("KSFOOD_COUNT", 50);
const KBOX_COUNT = readIntConfig("KSKBOX_COUNT", 1);
const [ROUND_START_MIN, ROUND_START_MAX] = readRangeConfig("KSROUND_START_WAIT", 7, 15);
const [WATCH_AD_MIN, WATCH_AD_MAX] = readRangeConfig("KSWATCH_AD_TIME", 30, 40);
const [PRE_LOOK_FOLLOW_MIN, PRE_LOOK_FOLLOW_MAX] = readRangeConfig("KSPRE_LOOK_FOLLOW_WAIT", 15, 30);
const [BETWEEN_LOOK_FOLLOW_MIN, BETWEEN_LOOK_FOLLOW_MAX] = readRangeConfig("KSBETWEEN_LOOK_FOLLOW_WAIT", 35, 50);
const [PRE_SEARCH_FOLLOW_MIN, PRE_SEARCH_FOLLOW_MAX] = readRangeConfig("KSPRE_SEARCH_FOLLOW_WAIT", 15, 30);
const [BETWEEN_SEARCH_FOLLOW_MIN, BETWEEN_SEARCH_FOLLOW_MAX] = readRangeConfig("KSBETWEEN_SEARCH_FOLLOW_WAIT", 15, 30);
const [ROUND_END_MIN, ROUND_END_MAX] = readRangeConfig("KSROUND_END_WAIT", 10, 20);
const [TASK_SWITCH_MIN, TASK_SWITCH_MAX] = readRangeConfig("KSTASK_SWITCH_WAIT", 15, 30);
const MAX_CONCURRENCY = readIntConfig("MAX_CONCURRENCY", 888);
const SCRIPT_VERSION = "v8-free";
const DEVICE_ID_FILE = ".device_id.txt";
const SKIP_LIVE_ADS = ["1", "true", "yes", "on"].includes(readStringConfig("SKIP_LIVE_ADS", "1").toLowerCase());
const SKIP_LIVE_MAX_RETRIES = Math.max(1, readIntConfig("SKIP_LIVE_MAX_RETRIES", 5));
const ENABLE_CHANGE_DID = ["1", "true", "yes", "on"].includes(readStringConfig("ENABLE_CHANGE_DID", "0").toLowerCase());

function getTasksToExecute() {
  const taskEnv = process.env.Task;
  const defaultTasks = ["look", "box", "food", "kbox", "search", "look_follow", "search_follow"];

  if (!taskEnv) return defaultTasks;

  const tasks = taskEnv
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  const validTasks = tasks.filter(t => defaultTasks.includes(t));

  return validTasks.length ? validTasks : defaultTasks;
}

function parseAccountsFromEnv() {
  const allAccounts = [];
  const seenAccounts = new Set();

  if (process.env.ksck) {
    const accounts = process.env.ksck
      .split("&")
      .map(a => a.trim())
      .filter(Boolean);
    allAccounts.push(...accounts);
  }

  for (let i = 1; i <= 666; i++) {
    const key = "ksck" + i;
    if (process.env[key]) {
      const accounts = process.env[key]
        .split("&")
        .map(a => a.trim())
        .filter(Boolean);
      allAccounts.push(...accounts);
    }
  }

  const uniqueAccounts = [];
  for (const account of allAccounts) {
    if (!seenAccounts.has(account)) {
      seenAccounts.add(account);
      uniqueAccounts.push(account);
    }
  }

  return uniqueAccounts;
}


const accounts = parseAccountsFromEnv();
const accountCount = accounts.length;
const tasksToExecute = getTasksToExecute();

function generateDeviceId() {
  try {
    const randomHex = length => {
      const chars = "0123456789abcdef";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const hexPart = randomHex(16);
    return "ANDROID_" + hexPart;
  } catch (err) {
    console.log("生成设备ID失败: " + err.message);
    const timestampHex = Date.now().toString(16).toUpperCase();
    return "ANDROID_" + timestampHex.substring(0, 16);
  }
}


function getOrCreateDeviceId() {
  try {
    if (fs.existsSync(DEVICE_ID_FILE)) {
      const existingId = fs.readFileSync(DEVICE_ID_FILE, "utf8").trim();
      if (existingId && existingId.length === 32) {
        return existingId;
      } else if (existingId && existingId.length > 0) {
        try {
          fs.unlinkSync(DEVICE_ID_FILE);
        } catch {}
      }
    }

    const chars = "0123456789abcdef";
    const generateRandomId = () => {
      let id = "";
      for (let i = 0; i < 32; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return id;
    };

    const newId = generateRandomId();
    try {
      fs.writeFileSync(DEVICE_ID_FILE, newId, "utf8");
    } catch (err) {
      console.log("保存设备ID失败: " + err.message);
    }
    return newId;

  } catch (err) {
    console.log("读取设备ID失败: " + err.message);
    const chars = "0123456789abcdef";
    let fallbackId = "";
    for (let i = 0; i < 32; i++) {
      fallbackId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return fallbackId;
  }
}


async function sendRequest(options, proxyUrl = null, requestName = "未知请求") {
  const requestOptions = { ...options };
  let agent = null;

  if (proxyUrl) {
    try {
      agent = new SocksProxyAgent(proxyUrl);
    } catch (err) {
      console.log("[错误] " + requestName + " 代理URL无效(" + err.message + ")，尝试直连模式");
    }
  }

  const method = requestOptions.method || "GET";
  const url = requestOptions.url;
  const headers = requestOptions.headers || {};
  const data = requestOptions.body || requestOptions.form;

  try {
    const startTime = Date.now();
    const axiosOptions = {
      method: method,
      url: url,
      headers: headers,
      data: data,
      timeout: requestOptions.timeout || 30000,
      startTime: startTime,
      ...(agent && { httpAgent: agent, httpsAgent: agent })
    };

    const response = await axios(axiosOptions);
    const duration = Date.now() - startTime;

    return {
      response: response,
      body: response.data
    };
  } catch (err) {
    const duration = err.config?.startTime ? Date.now() - err.config.startTime : 0;

    if (err.response) {
      const body = err.response.data || null;
      return {
        response: err.response,
        body: body
      };
    } else if (err.request) {
      // 请求已发出但无响应
    } else {
      // 请求未发出或其他错误
    }

    return {
      response: null,
      body: null
    };
  }
}


function isValidIP(ip) {
  if (!ip || typeof ip !== "string") {
    return false;
  }

  if (
    ip.includes("<html>") ||
    ip.includes("503 Service Temporarily Unavailable") ||
    ip.includes("502 Bad Gateway") ||
    ip.includes("504 Gateway Timeout")
  ) {
    return false;
  }

  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Pattern.test(ip)) {
    const parts = ip.split(".");
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (num < 0 || num > 255 || isNaN(num)) {
        return false;
      }
    }
    return true;
  }

  return ipv6Pattern.test(ip);
}

async function testProxyConnectivity(proxyUrl, label = "代理连通性检测", maxAttempts = 10) {
  if (!proxyUrl) {
    return {
      ok: true,
      msg: " 未配置代理（直连模式）",
      ip: "localhost"
    };
  }

  let lastError = null;
  const testEndpoints = [
    "https://httpbin.org/ip",
    "https://api.ipify.org?format=json",
    "https://jsonip.com",
    "https://api.my-ip.io/ip.json"
  ];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const endpoint of testEndpoints) {
      try {
        const { response, body } = await sendRequest({
          method: "GET",
          url: endpoint,
          headers: { "User-Agent": "ProxyTester/1.0" },
          timeout: 15000
        }, proxyUrl, label + " → " + new URL(endpoint).hostname);

        if (typeof body === "string" && (
          body.includes("<html>") ||
          body.includes("503 Service Temporarily Unavailable") ||
          body.includes("502 Bad Gateway") ||
          body.includes("504 Gateway Timeout")
        )) {
          continue;
        }

        if (body) {
          let ip = null;
          if (endpoint.includes("httpbin.org") && body.origin) {
            ip = body.origin;
          } else if ((endpoint.includes("ipify.org") || endpoint.includes("jsonip.com") || endpoint.includes("my-ip.io")) && body.ip) {
            ip = body.ip;
          } else if (typeof body === "string" && !body.includes("<")) {
            ip = body.trim();
          }

          if (ip && isValidIP(ip)) {
            return {
              ok: true,
              msg: " SOCKS5代理正常，出口IP: " + ip,
              ip
            };
          }
        }
      } catch (err) {
        lastError = err;
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }

  try {
    new URL(proxyUrl);
  } catch (err) {
    return {
      ok: false,
      msg: " 代理URL格式错误: " + err.message,
      ip: null
    };
  }

  return {
    ok: false,
    msg: " 代理测试失败: " + (lastError?.message || "所有测试端点均无法访问"),
    ip: null
  };
}

const usedProxyIPs = new Set();

async function getAccountBasicInfo(cookie, proxy = null, index = "?") {
  const url = "https://nebula.kuaishou.com/rest/n/nebula/activity/earn/overview/basicInfo?source=bottom_guide_first";
  
  const { body } = await sendRequest({
    method: "GET",
    url,
    headers: {
      Host: "nebula.kuaishou.com",
      "User-Agent": "kwai-android aegon/3.56.0",
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    timeout: 8000
  }, proxy, `账号[${index}] 获取基本信息`);

  if (body && body.result === 1 && body.data) {
    let userId = null;

    if (body.data.userData) {
      userId = body.data.userData.ud || body.data.userData.userId || body.data.userData.user_id || body.data.userData.id || null;
    }

    if (!userId) {
      userId = body.data.ud || body.data.userId || body.data.user_id || null;
    }

    return {
      nickname: body.data.userData?.nickname || null,
      totalCoin: body.data.totalCoin ?? null,
      allCash: body.data.allCash ?? null,
      ud: userId
    };
  }

  return null;
}

const forceColor = String(process.env.FORCE_COLOR || "").toLowerCase();
const noColor = String(process.env.NO_COLOR || "").toLowerCase() === "1";
const enableColors = !noColor && forceColor !== "0";

const colors = enableColors ? {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
} : {
  reset: "",
  bright: "",
  dim: "",
  red: "",
  green: "",
  yellow: "",
  blue: "",
  magenta: "",
  cyan: "",
  white: ""
};

function colorText(text, color) {
  if (!enableColors || !color) {
    return String(text);
  }
  return color + text + colors.reset;
}

function formatTag(tag) {
  return colorText("[" + tag + "]", colors.bright + colors.cyan);
}

function formatSuccess(tag) {
  return colorText("[" + tag + "]", colors.bright + colors.green);
}

function formatWarning(tag) {
  return colorText("[" + tag + "]", colors.bright + colors.yellow);
}

function centerText(text, width) {
  text = String(text);
  if (text.length >= width) {
    return text.substring(0, width);
  }
  const padding = width - text.length;
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

//混淆代码暂时改到这，不影响使用
class KuaishouAccount {
  constructor({
    index,
    salt,
    cookie,
    nickname = "",
    proxyUrl = null,
    tasksToExecute = ["look"],
    remark = "",
    udFromLogin = null
  }) {
    this.index = index;
    this.salt = salt;
    this.cookie = cookie;
    this.nickname = nickname || remark || "账号" + index;
    this.remark = remark;
    this.proxyUrl = proxyUrl;
    this.coinLimit = COIN_LIMIT;
    this.coinExceeded = false;
    this.tasksToExecute = tasksToExecute;
    this.adAdditionalNum = 0;
    this.extractCookieInfo();
    if (udFromLogin && udFromLogin.trim()) {
      const trimmedId = String(udFromLogin).trim();
      if (trimmedId) {
        this.userId = trimmedId;
      }
    }
    this.headers = {
      Host: "nebula.kuaishou.com",
      Connection: "keep-alive",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Lite Build/QKQ1.190910.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.101 Mobile Safari/537.36",
      Cookie: this.cookie,
      "content-type": "application/json"
    };
    this.taskReportPath = "/rest/r/ad/task/report";
    this.startTime = Date.now();
    this.endTime = this.startTime - 30000;
    this.queryParams = "mod=Xiaomi(MI 11)&appver=" + this.appver + "&egid=" + this.egid + "&did=" + this.did;
    this.taskConfigs = {
      look: {
        name: "看广告得金币",
        businessId: 672,
        posId: 24067,
        subPageId: 100026367,
        requestSceneType: 1,
        taskType: 1
      },
      look_follow: {
        name: "追加看广告得金币",
        businessId: 672,
        posId: 24067,
        subPageId: 100026367,
        requestSceneType: 7,
        taskType: 2
      },
      box: {
        name: "宝箱广告",
        businessId: 606,
        posId: 20346,
        subPageId: 100024064,
        requestSceneType: 1,
        taskType: 1
      },
      food: {
        name: "饭补广告",
        businessId: 9362,
        posId: 24067,
        subPageId: 100026367,
        requestSceneType: 7,
        taskType: 2
      },
      kbox: {
        name: "开宝箱",
        businessId: 606,
        posId: 20346,
        subPageId: 100024064,
        requestSceneType: 1,
        taskType: 1
      },
      search: {
        name: "搜索任务",
        pageId: 11014,
        businessId: 7076,
        posId: 216268,
        subPageId: 100161537,
        requestSceneType: 1,
        taskType: 1
      },
      search_follow: {
        name: "搜索任务追加",
        pageId: 11014,
        businessId: 7076,
        posId: 216268,
        subPageId: 100161537,
        requestSceneType: 7,
        taskType: 2
      }
    };
    this.taskStats = {};
    const actions = new Set(this.tasksToExecute);
    actions.add("look_follow");
    actions.add("search");
    actions.add("search_follow");
    actions.forEach(action => {
      if (this.taskConfigs[action]) {
        this.taskStats[action] = {
          success: 0,
          failed: 0,
          totalReward: 0
        };
      }
    });
    this.lowRewardStreak = 0;
    this.lowRewardThreshold = LOW_REWARD_THRESHOLD;
    this.lowRewardLimit = LOW_REWARD_LIMIT;
    this.stopAllTasks = false;
    this.taskLimitReached = {};
    const actionsToRun = new Set(this.tasksToExecute);
    actionsToRun.add("look_follow");
    actionsToRun.add("search");
    actionsToRun.add("search_follow");
    actionsToRun.forEach(action => {
      if (this.taskConfigs[action]) {
        this.taskLimitReached[action] = false;
      }
    });
  }
  getAccountDisplayName() {
    const displayName = this.remark || this.nickname || "账号" + this.index;
    if (enableColors) {
      const accountLabel = colors.bright + colors.cyan + "账号" + colors.reset;
      return accountLabel + formatTag(displayName);
    }
    return "账号[" + displayName + "]";
  }
  getTaskTotalCount(taskName) {
    switch (taskName) {
      case "look":
        return LOOK_COUNT;
      case "look_follow":
        if (this.tasksToExecute.includes("look")) {
          return LOOK_COUNT * FOLLOW_COUNT;
        } else {
          return 0;
        }
      case "search":
        return SEARCH_COUNT;
      case "search_follow":
        if (this.tasksToExecute.includes("search")) {
          return SEARCH_COUNT * SEARCH_FOLLOW_COUNT;
        } else {
          return 0;
        }
      case "box":
        return BOX_COUNT;
      case "food":
        return FOOD_COUNT;
      case "kbox":
        return KBOX_COUNT;
      default:
        return 0;
    }
  }
  async checkCoinLimit() {
    try {
      const accountInfo = await getAccountBasicInfo(this.getCookieWithCurrentDid(), this.proxyUrl, this.index);
      if (accountInfo && accountInfo.totalCoin) {
        const totalCoin = parseInt(accountInfo.totalCoin);
        if (totalCoin >= this.coinLimit) {
          console.log("⚠️ " + this.getAccountDisplayName() + " 金币已达 " + totalCoin + "，超过 " + this.coinLimit + " 阈值，将停止任务");
          this.coinExceeded = true;
          this.stopAllTasks = true;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log("❌ " + this.getAccountDisplayName() + " 金币检查异常: " + error.message);
      return false;
    }
  }
  extractCookieInfo() {
    try {
      const formatString = (input, suffix = "") => {
        const regexList = [new RegExp("\\b" + input + "\\s*=\\s*\"([^\"]+)\"", "i"), new RegExp("\\b" + input + "\\s*=\\s*([^;]+)", "i"), new RegExp("\\b" + input + "\\s*:\\s*\"([^\"]+)\"", "i"), new RegExp("\\b" + input + "\\s*:\\s*([^,;]+)", "i")];
        for (const regex of regexList) {
          const matchResult = this.cookie.match(regex);
          if (matchResult && matchResult[1] && matchResult[1].trim()) {
            return matchResult[1].trim();
          }
        }
        return suffix;
      };
      this.egid = formatString("egid");
      this.did = formatString("did") || formatString("oDid");
      this.userId = formatString("ud") || formatString("userId") || "";
      this.kuaishouApiSt = formatString("kuaishou.api_st") || "";
      this.appver = formatString("appver", "13.8.40.10657");
      const items = [];
      if (!this.egid) {
        items.push("egid");
      }
      if (!this.did) {
        items.push("did");
      }
      if (!this.userId) {
        items.push("ud/userId");
      }
      if (!this.kuaishouApiSt) {
        items.push("kuaishou.api_st");
      }
      if (items.length > 0) {
        console.log("⚠️ " + this.getAccountDisplayName() + " 缺少必要参数: " + items.join(", "));
      }
    } catch (error) {
      console.log("❌ " + this.getAccountDisplayName() + " 解析cookie失败: " + error.message);
    }
  }
  getCookieWithCurrentDid() {
    try {
      if (!this.cookie || !this.did) {
        return this.cookie;
      }
      const cookieParts = String(this.cookie).split(";");
      const parsedCookies = cookieParts.map(part => {
        const partStr = String(part ?? "");
        if (!partStr.trim()) {
          return partStr;
        }
        const hasEqualSign = partStr.includes("=");
        const hasColon = partStr.includes(":");
        const separator = hasEqualSign ? "=" : hasColon ? ":" : null;
        if (!separator) {
          return partStr;
        }
        const [key, ...valueParts] = partStr.split(separator);
        const keyStr = String(key || "").trim();
        const keyLower = keyStr.toLowerCase();
        if (keyLower === "did" || keyLower === "odid") {
          return keyStr + separator + this.did;
        }
        return partStr;
      });
      return parsedCookies.join("; ");
    } catch (error) {
      return this.cookie;
    }
  }
  getTaskStats() {
    return this.taskStats;
  }
  printTaskStats() {
    console.log("\n📊 " + this.getAccountDisplayName() + " 任务执行统计:");
    for (const [taskName, stats] of Object.entries(this.taskStats)) {
      const config = this.taskConfigs[taskName];
      console.log("  " + config.name + ": 成功" + stats.success + "次, 失败" + stats.failed + "次, 总奖励" + stats.totalReward + "金币");
    }
  }
  async retryOperation(operationFn, errorMsg, maxRetries = 3, delayMs = 2000) {
    let attempt = 0;
    let lastError = null;
    while (attempt < maxRetries) {
      try {
        const result = await operationFn();
        if (result) {
          return result;
        }
        lastError = new Error(errorMsg + " 返回空结果");
      } catch (error) {
        lastError = error;
      }
      attempt++;
      if (attempt < maxRetries) {
        await new Promise(resolve => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(resolve, delayMs));
      }
    }
    return null;
  }
  needsNewDid = false;
  async getAdInfo(adRequest, retryCount = 0) {
    try {
      const maxRetries = SKIP_LIVE_ADS ? SKIP_LIVE_MAX_RETRIES : 1;
      const urlPath = "/rest/e/reward/mixed/ad";
      const encPayload = {
        encData: "|encData|",
        sign: "|sign|",
        cs: "false",
        client_key: "2ac2a76d",
        videoModelCrowdTag: "1_23",
        os: "android",
        "kuaishou.api_st": this.kuaishouApiSt,
        uQaTag: "1##swLdgl:99#ecPp:-9#cmNt:-0#cmHs:-3#cmMnsl:-0"
      };
      const devicePayload = {
        earphoneMode: "1",
        mod: "Xiaomi(23116PN5BC)",
        appver: this.appver,
        isp: "CUCC",
        language: "zh-cn",
        ud: this.userId || "",
        did_tag: "0",
        net: "WIFI",
        kcv: "1599",
        app: "0",
        kpf: "ANDROID_PHONE",
        ver: "11.6",
        android_os: "0",
        boardPlatform: "pineapple",
        kpn: "NEBULA",
        androidApiLevel: "35",
        country_code: "cn",
        sys: "ANDROID_15",
        sw: "1080",
        sh: "2400",
        abi: "arm64",
        userRecoBit: "0"
      };
      let impExtData = "{}";
      if (adRequest.businessId === 7076) {
        const neoParams = "eyJwYWdlSWQiOiAxMTAxNCwgInN1YlBhZ2VJZCI6IDEwMDE2MTUzNywgInBvc0lkIjogMjE2MjY4LCAiYnVzaW5lc3NJZCI6IDcwNzYsICJleHRQYXJhbXMiOiAiIiwgImN1c3RvbURhdGEiOiB7ImV4aXRJbmZvIjogeyJ0b2FzdERlc2MiOiBudWxsLCAidG9hc3RJbWdVcmwiOiBudWxsfX0sICJwZW5kYW50VHlwZSI6IDEsICJkaXNwbGF5VHlwZSI6IDIsICJzaW5nbGVQYWdlSWQiOiAwLCAic2luZ2xlU3ViUGFnZUlkIjogMCwgImNoYW5uZWwiOiAwLCAiY291bnRkb3duUmVwb3J0IjogZmFsc2UsICJ0aGVtZVR5cGUiOiAwLCAibWl4ZWRBZCI6IHRydWUsICJmdWxsTWl4ZWQiOiB0cnVlLCAiYXV0b1JlcG9ydCI6IHRydWUsICJmcm9tVGFza0NlbnRlciI6IHRydWUsICJzZWFyY2hJbnNwaXJlU2NoZW1lSW5mbyI6IG51bGwsICJhbW91bnQiOiAwfQ==";
        const adInfo = {
          openH5AdCount: 0,
          sessionLookedCompletedCount: this.adAdditionalNum,
          sessionType: adRequest.requestSceneType === 2 ? "2" : "1",
          searchKey: "短剧小说",
          triggerType: "2",
          disableReportToast: true,
          businessEnterAction: "7",
          neoParams: neoParams
        };
        impExtData = JSON.stringify(adInfo);
      }
      const reqPayload = {
        appInfo: {
          appId: "kuaishou_nebula",
          name: "快手极速版",
          packageName: "com.kuaishou.nebula",
          version: this.appver,
          versionCode: -1
        },
        deviceInfo: {
          osType: 1,
          osVersion: "15",
          deviceId: this.did,
          screenSize: {
            width: 1080,
            height: 2249
          },
          ftt: ""
        },
        userInfo: {
          userId: this.userId || "",
          age: 0,
          gender: ""
        },
        impInfo: [{
          pageId: adRequest.pageId || 11101,
          subPageId: adRequest.subPageId,
          action: 0,
          browseType: 3,
          impExtData: impExtData,
          mediaExtData: "{}"
        }]
      };
      const base64Payload = Buffer.from(JSON.stringify(reqPayload)).toString("base64");
      let signResult = await this.getSign(base64Payload);
      if (!signResult) {
        console.log("❌ " + this.getAccountDisplayName() + " 获取签名失败");
        return null;
      }
      encPayload.encData = signResult.encdata;
      encPayload.sign = signResult.sign;
      let signServiceResult = await this.requestSignService({
        urlpath: urlPath,
        reqdata: querystring.stringify(encPayload) + "&" + querystring.stringify(devicePayload),
        api_client_salt: this.salt
      }, "获取广告签名");
      if (!signServiceResult) {
        console.log("❌ " + this.getAccountDisplayName() + " 获取广告签名失败");
        return null;
      }
      const finalPayload = {
        ...devicePayload,
        sig: signServiceResult.sig,
        __NS_sig3: signServiceResult.__NS_sig3,
        __NS_xfalcon: signServiceResult.__NS_xfalcon || "",
        __NStokensig: signServiceResult.__NStokensig
      };
      const adUrl = "https://api.e.kuaishou.com" + urlPath + "?" + querystring.stringify(finalPayload);
      const {
        response: response,
        body: body
      } = await sendRequest({
        method: "POST",
        url: adUrl,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Host: "api.e.kuaishou.com",
          "User-Agent": "kwai-android aegon/3.56.0",
          Cookie: "kuaishou.api_st=" + this.kuaishouApiSt
        },
        form: encPayload,
        timeout: 30000
      }, this.proxyUrl, this.getAccountDisplayName() + " 获取广告");
      if (!response || !body) {
        console.log("❌ " + this.getAccountDisplayName() + " 获取广告无响应");
        return null;
      }
      if (body.errorMsg === "OK" && body.feeds && body.feeds[0] && body.feeds[0].ad) {
        const feed = body.feeds[0];
        const creativeId = feed?.ad?.creativeId ?? feed?.creativeId;
        const expTag = feed.exp_tag || "";
        const llsid = expTag.split("/")[1]?.split("_")?.[0] || "";
        if (!creativeId) {
          console.log("⚠️ " + this.getAccountDisplayName() + " 未能解析广告 creativeId");
          return null;
        }
        const adTitle = (feed.caption || feed?.ad?.caption || "").slice(0, 30);
        let expectedReward = 0;
        try {
          if (feed.ad?.adDataV2?.inspirePersonalize?.awardValue) {
            expectedReward = parseInt(feed.ad.adDataV2.inspirePersonalize.awardValue) || 0;
          } else if (feed.ad?.awardCoin) {
            expectedReward = parseInt(feed.ad.awardCoin) || 0;
          } else if (feed.ad?.adDataV2?.inspireAdInfo?.neoCount) {
            expectedReward = parseInt(feed.ad.adDataV2.inspireAdInfo.neoCount) || 0;
          }
          if (expectedReward === 0) {
            console.log("🔍 " + this.getAccountDisplayName() + " 调试广告数据结构:");
            console.log("  - adData.ad.adDataV2:", feed.ad?.adDataV2 ? "存在" : "不存在");
            console.log("  - adData.ad.awardCoin:", feed.ad?.awardCoin || "不存在");
            if (feed.ad?.adDataV2) {
              console.log("  - inspirePersonalize:", feed.ad.adDataV2.inspirePersonalize ? "存在" : "不存在");
              console.log("  - inspireAdInfo:", feed.ad.adDataV2.inspireAdInfo ? "存在" : "不存在");
            }
          }
        } catch (error) {
          console.log("❌ " + this.getAccountDisplayName() + " 解析预估金币异常: " + error.message);
        }
        if (expectedReward > 0) {
          console.log("ℹ️ " + this.getAccountDisplayName() + " 获取广告: " + (adTitle || "无标题") + " 预计获得(" + expectedReward + ")金币");
        } else {
          console.log("ℹ️ " + this.getAccountDisplayName() + " 获取广告: " + (adTitle || "无标题") + " 预计获得(未知)金币");
        }
        return {
          cid: creativeId,
          llsid: llsid
        };
      } else {
        console.log("❌ " + this.getAccountDisplayName() + " 获取广告失败: errorMsg=" + (body?.error_msg || "unknown") + ", result=" + (body?.result || "unknown"));
        return null;
      }
    } catch (error) {
      console.log("❌ " + this.getAccountDisplayName() + " 获取广告异常: " + error.message);
      return null;
    }
  }
  //混淆代码暂时改到这，不影响使用
  async generateSignature(_0x10627b, _0x2db24c, _0x201463, _0x154a53) {
    try {
      const _0x43b7f0 = {
        businessId: _0x154a53.businessId,
        endTime: this.endTime,
        extParams: "",
        mediaScene: "video",
        neoInfos: [{
          creativeId: _0x10627b,
          extInfo: "",
          llsid: _0x2db24c,
          requestSceneType: _0x154a53.requestSceneType,
          taskType: _0x154a53.taskType,
          watchExpId: "",
          watchStage: 0
        }],
        pageId: _0x154a53.pageId || 11101,
        posId: _0x154a53.posId,
        reportType: 0,
        sessionId: "",
        startTime: this.startTime,
        subPageId: _0x154a53.subPageId
      };
      const _0x235638 = "bizStr=" + encodeURIComponent(JSON.stringify(_0x43b7f0)) + "&cs=false&client_key=2ac2a76d&kuaishou.api_st=" + this.kuaishouApiSt;
      const _0x391858 = this.queryParams + "&" + _0x235638;
      const _0x1d9877 = await this.requestSignService({
        urlpath: this.taskReportPath,
        reqdata: _0x391858,
        api_client_salt: this.salt
      }, this.getAccountDisplayName() + " 生成报告签名");
      if (!_0x1d9877) {
        return null;
      }
      return {
        sig: _0x1d9877.sig,
        sig3: _0x1d9877.__NS_sig3,
        sigtoken: _0x1d9877.__NStokensig,
        xfalcon: _0x1d9877.__NS_xfalcon || "",
        post: _0x235638
      };
    } catch (_0x33766d) {
      console.log("❌ " + this.getAccountDisplayName() + " 生成签名异常: " + _0x33766d.message);
      return null;
    }
  }
  async submitReport(sig, sig3, tokenSig, xfalcon, post数据, taskName, taskConfig) {
    try {
      const requestUrl = "https://api.e.kuaishou.com" + this.taskReportPath + "?" + this.queryParams + "&sig=" + _0x3d2e6c + "&__NS_sig3=" + _0x17f15a + "&__NS_xfalcon=" + (_0x2536d4 || "") + "&__NStokensig=" + _0xac3de9;
      const {
        response: _0x3aeb7b,
        body: _0x5c6f77
      } = await sendRequest({
        method: "POST",
        url: requestUrl,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Host: "api.e.kuaishou.com",
          "User-Agent": "kwai-android aegon/3.56.0"
        },
        body: post数据,
        timeout: 12000
      }, this.proxyUrl, "账号[" + this.nickname + "]" + (this.remark ? "（" + this.remark + "）" : "") + " 提交任务");
      if (!_0x5c6f77) {
        return {
          success: false,
          reward: 0,
          shouldRetry: false
        };
      }
      if (_0x5c6f77.result === 1) {
        const _0x4ef407 = _0x5c6f77.data?.neoAmount || 0;
        if (_0x4ef407 <= this.lowRewardThreshold) {
          this.lowRewardStreak++;
          if (ENABLE_CHANGE_DID) {
            const _0x3fd8e5 = generateDeviceId();
            this.did = _0x3fd8e5;
            this.queryParams = "mod=Xiaomi(MI 11)&appver=" + this.appver + "&egid=" + this.egid + "&did=" + _0x3fd8e5;
            console.log("🔄 " + this.getAccountDisplayName() + " 低奖励触发，已更新设备ID: " + _0x3fd8e5);
          } else {
            console.log("🔄 " + this.getAccountDisplayName() + " 低奖励触发，但当前已关闭自动更换did");
          }
          console.log("⚠️ " + this.getAccountDisplayName() + " 金币奖励(" + _0x4ef407 + ")低于或等于阈值(" + this.lowRewardThreshold + ")，等待30秒后重试，当前连续低奖励次数：(" + this.lowRewardStreak + ")/" + this.lowRewardLimit);
          await new Promise(_0x5aabaa => // TOLOOK
          // TOLOOK
          // TOLOOK
          setTimeout(_0x5aabaa, 30000));
          if (this.lowRewardStreak >= this.lowRewardLimit) {
            console.log("🏁 " + this.getAccountDisplayName() + " 连续" + this.lowRewardLimit + "次奖励≤" + this.lowRewardThreshold + "，停止全部任务");
            this.stopAllTasks = true;
            return {
              success: false,
              reward: 0,
              shouldRetry: false
            };
          }
          return {
            success: true,
            reward: _0x4ef407,
            shouldRetry: false
          };
        } else {
          if (this.lowRewardStreak > 0) {
            console.log("✅ " + this.getAccountDisplayName() + " 奖励(" + _0x4ef407 + ")恢复正常，重置低奖励计数");
            this.lowRewardStreak = 0;
          }
          return {
            success: true,
            reward: _0x4ef407,
            shouldRetry: false
          };
        }
      }
      if ([20107, 20108, 1003, 415].includes(_0x5c6f77.result)) {
        console.log("⚠️ " + this.getAccountDisplayName() + " " + taskConfig.name + " 已达上限");
        this.taskLimitReached[taskName] = true;
        return {
          success: false,
          reward: 0
        };
      }
      return {
        success: false,
        reward: 0
      };
    } catch (_0x433644) {
      return {
        success: false,
        reward: 0
      };
    }
  }
  async getSign(_0x5d66a3) {
    const _0x5c9d75 = 3;
    for (let _0x295b3f = 1; _0x295b3f <= _0x5c9d75; _0x295b3f++) {
      try {
        const _0x475258 = JSON.stringify({
          type: "encsign",
          data: _0x5d66a3,
          ud: this.userId || "",
          script_version: SCRIPT_VERSION
        });
        const {
          response: _0x1f8078,
          body: _0x36b4a7
        } = await sendRequest({
          method: "POST",
		  //改成接口API
          url: "http://127.0.0.1:8888/encsign",
          body: _0x475258,
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 30000
        }, this.proxyUrl, this.getAccountDisplayName() + " encsign签名");
        if (!_0x1f8078) {
          if (_0x295b3f < _0x5c9d75) {
            continue;
          } else {
            console.log("❌ " + this.getAccountDisplayName() + " 签名请求失败");
            return null;
          }
        }
        if (!_0x36b4a7) {
          if (_0x295b3f < _0x5c9d75) {
            continue;
          } else {
            console.log("❌ " + this.getAccountDisplayName() + " 签名响应为空");
            return null;
          }
        }
        if (_0x36b4a7 && _0x36b4a7.status) {
          let _0x405346 = _0x36b4a7.data;
          if (typeof _0x405346 === "string") {
            try {
              _0x405346 = JSON.parse(_0x405346);
            } catch (_0x4b071e) {
              if (_0x295b3f < _0x5c9d75) {
                continue;
              } else {
                console.log("❌ " + this.getAccountDisplayName() + " 解析签名数据失败");
                return null;
              }
            }
          }
          return _0x405346;
        } else {
          if (_0x295b3f >= _0x5c9d75) {
            console.log("❌ " + this.getAccountDisplayName() + " 签名服务返回错误: " + (_0x36b4a7?.message || "未知错误"));
          }
          if (_0x295b3f < _0x5c9d75) {
            continue;
          } else {
            return null;
          }
        }
      } catch (_0xcca6ed) {
        if (_0x295b3f >= _0x5c9d75) {
          console.log("❌ " + this.getAccountDisplayName() + " 签名请求异常: " + _0xcca6ed.message);
        }
        if (_0x295b3f < _0x5c9d75) {
          continue;
        } else {
          return null;
        }
      }
      if (_0x295b3f < _0x5c9d75) {
        await new Promise(_0x1b942a => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x1b942a, 2000));
      }
    }
    console.log("❌ " + this.getAccountDisplayName() + " 签名获取失败，已达最大重试次数");
    return null;
  }
  async requestSignService(_0x16730a, _0x2a6ee2) {
    const _0x37385b = 3;
    for (let _0x521670 = 1; _0x521670 <= _0x37385b; _0x521670++) {
      try {
        const _0x456d9c = getOrCreateDeviceId();
        const _0x3266bf = JSON.stringify({
          type: "nssig",
          path: _0x16730a.urlpath,
          data: _0x16730a.reqdata,
          salt: _0x16730a.api_client_salt,
          ud: this.userId || "",
          script_version: SCRIPT_VERSION,
          device_id: _0x456d9c
        });
        const {
          response: _0x50f0c4,
          body: _0x3225b4
        } = await sendRequest({
          method: "POST",
		  //改成接口API
          url: "http://127.0.0.1:8888/nssig",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
          },
          body: _0x3266bf,
          timeout: 15000
        }, this.proxyUrl, _0x2a6ee2 + "（签名服务）");
        if (!_0x3225b4) {
          if (_0x521670 < _0x37385b) {
            continue;
          } else {
            console.log("❌ " + this.getAccountDisplayName() + " " + _0x2a6ee2 + " 签名响应为空");
            return null;
          }
        }
        if (_0x3225b4 && _0x3225b4.status) {
          let _0x19d642 = _0x3225b4.data;
          if (typeof _0x19d642 === "string") {
            try {
              _0x19d642 = JSON.parse(_0x19d642);
            } catch (_0x10665a) {
              if (_0x521670 < _0x37385b) {
                continue;
              } else {
                console.log("❌ " + this.getAccountDisplayName() + " " + _0x2a6ee2 + " 解析签名数据失败");
                return null;
              }
            }
          }
          let _0x1fd23e = _0x19d642;
          if (_0x19d642.data && typeof _0x19d642.data === "object") {
            _0x1fd23e = _0x19d642.data;
          }
          let _0x427c9a = _0x1fd23e.nssig3 || _0x1fd23e.__NS_sig3;
          let _0x37de02 = _0x1fd23e.nstokensig || _0x1fd23e.__NStokensig;
          let _0x3ffac6 = _0x1fd23e.xfalcon || _0x1fd23e.nssig4 || _0x1fd23e.__NS_xfalcon || "";
          let _0x16d107 = _0x1fd23e.sig;
          return {
            __NS_sig3: _0x427c9a,
            __NStokensig: _0x37de02,
            sig: _0x16d107,
            __NS_xfalcon: _0x3ffac6
          };
        }
        if (_0x521670 >= _0x37385b) {
          console.log("❌ " + this.getAccountDisplayName() + " " + _0x2a6ee2 + " 签名失败");
        }
        if (_0x521670 < _0x37385b) {
          continue;
        } else {
          return null;
        }
      } catch (_0x1b0571) {
        if (_0x521670 >= _0x37385b) {
          console.log("❌ " + this.getAccountDisplayName() + " " + _0x2a6ee2 + " 签名异常: " + _0x1b0571.message);
        }
        if (_0x521670 < _0x37385b) {
          continue;
        } else {
          return null;
        }
      }
    }
    console.log("❌ " + this.getAccountDisplayName() + " " + _0x2a6ee2 + " 签名失败，已达最大重试次数");
    return null;
  }
  async executeTask(_0x5184ff) {
    if (!this.tasksToExecute.includes(_0x5184ff)) {
      return false;
    }
    const _0x408b71 = this.taskConfigs[_0x5184ff];
    if (!_0x408b71) {
      console.log("❌ " + this.getAccountDisplayName() + " 未知任务: " + _0x5184ff);
      return false;
    }
    if (this.taskLimitReached[_0x5184ff]) {
      return false;
    }
    try {
      const _0x3fc296 = await getAccountBasicInfo(this.getCookieWithCurrentDid(), this.proxyUrl, this.index);
      const _0x5d44fb = _0x3fc296?.totalCoin || 0;
      let _0x47d912;
      let _0x4229f5 = 0;
      const _0x5ea188 = 3;
      while (_0x4229f5 < _0x5ea188) {
        const _0x16e1f3 = await this.getAdInfo(_0x408b71);
        if (_0x16e1f3 && _0x16e1f3.needsNewDid) {
          this.needsNewDid = true;
          _0x4229f5++;
          console.log("🔄 " + this.getAccountDisplayName() + " 正在更新设备ID并重试获取广告 (" + _0x4229f5 + "/" + _0x5ea188 + ")");
          continue;
        } else if (_0x16e1f3) {
          _0x47d912 = _0x16e1f3;
          break;
        } else {
          _0x4229f5++;
          if (_0x4229f5 >= _0x5ea188) {
            console.log("❌ " + this.getAccountDisplayName() + " 获取" + _0x408b71.name + "信息失败");
            this.taskStats[_0x5184ff].failed++;
            return false;
          }
          await new Promise(_0x1a662e => // TOLOOK
          // TOLOOK
          // TOLOOK
          setTimeout(_0x1a662e, 2000));
        }
      }
      if (!_0x47d912) {
        this.taskStats[_0x5184ff].failed++;
        return false;
      }
      const _0x29a283 = Math.floor(Math.random() * (WATCH_AD_MAX - WATCH_AD_MIN + 1)) + WATCH_AD_MIN;
      console.log("⏱️ " + this.getAccountDisplayName() + " " + _0x408b71.name + " 等待 " + _0x29a283 + " 秒后继续");
      await new Promise(_0xf2bb18 => // TOLOOK
      // TOLOOK
      // TOLOOK
      setTimeout(_0xf2bb18, _0x29a283 * 1000));
      const _0x544a70 = await this.generateSignature(_0x47d912.cid, _0x47d912.llsid, _0x5184ff, _0x408b71);
      if (!_0x544a70) {
        this.taskStats[_0x5184ff].failed++;
        console.log("❌ " + this.getAccountDisplayName() + " 生成签名失败，本次" + _0x408b71.name + "未获得奖励");
        return false;
      }
      let _0x39b672;
      let _0x531c98 = 0;
      while (_0x531c98 < 3) {
        _0x39b672 = await this.submitReport(_0x544a70.sig, _0x544a70.sig3, _0x544a70.sigtoken, _0x544a70.xfalcon || "", _0x544a70.post, _0x5184ff, _0x408b71);
        if (_0x39b672?.success || !_0x39b672?.shouldRetry) {
          break;
        }
        _0x531c98++;
        if (_0x39b672.shouldRetry) {
          await new Promise(_0x4a70bc => // TOLOOK
          // TOLOOK
          // TOLOOK
          setTimeout(_0x4a70bc, 30000));
          console.log("🔄 " + this.getAccountDisplayName() + " 准备重试 (" + _0x531c98 + "/3)");
        }
      }
      if (_0x39b672?.success) {
        this.taskStats[_0x5184ff].success++;
        this.taskStats[_0x5184ff].totalReward += _0x39b672.reward || 0;
        const _0x39b7dd = await getAccountBasicInfo(this.getCookieWithCurrentDid(), this.proxyUrl, this.index);
        const _0x2640ae = _0x39b7dd?.totalCoin || _0x5d44fb;
        const _0x4bcbf2 = _0x39b672.reward || 0;
        const _0x52cac8 = this.remark || this.nickname || "备注";
        let _0x49ea7d = "获取到广告";
        let _0x12e1a1 = colors.bright + colors.cyan;
        switch (_0x5184ff) {
          case "kbox":
            _0x49ea7d = "获取到宝箱";
            _0x12e1a1 = colors.bright + colors.magenta;
            break;
          case "box":
            _0x49ea7d = "获取到宝箱广告";
            _0x12e1a1 = colors.bright + colors.blue;
            break;
          case "food":
            _0x49ea7d = "获取到饭补广告";
            _0x12e1a1 = colors.bright + colors.green;
            break;
          case "look_follow":
            _0x49ea7d = "获取追加广告";
            _0x12e1a1 = colors.bright + colors.yellow;
            break;
          case "search_follow":
            _0x49ea7d = "获取到搜索追加广告";
            _0x12e1a1 = colors.bright + colors.yellow;
            break;
          case "look":
            _0x49ea7d = "获取到广告";
            _0x12e1a1 = colors.bright + colors.cyan;
            break;
          case "search":
            _0x49ea7d = "获取到搜索广告";
            _0x12e1a1 = colors.bright + colors.cyan;
            break;
        }
        const _0xf617c = this.taskStats[_0x5184ff].success;
        const _0x55c59e = this.getTaskTotalCount(_0x5184ff);
        const _0x314d7b = _0x4bcbf2 >= 100 ? colors.bright + colors.red + "💰[高额奖励]" + colors.reset : colors.bright + colors.green + "💰[奖励]" + colors.reset;
        const _0x2b1417 = formatTag(_0x52cac8);
        const _0x445f42 = colorText(_0x49ea7d, _0x12e1a1);
        console.log(_0x314d7b + " " + _0x2b1417 + " " + _0x445f42 + "（第" + _0xf617c + "/" + _0x55c59e + "次）==>" + formatWarning(_0x4bcbf2) + "金币 —— 当前金币 " + formatSuccess(_0x2640ae));
        return true;
      }
      this.taskStats[_0x5184ff].failed++;
      if (this.taskLimitReached[_0x5184ff]) {
        console.log("⚠️ " + this.getAccountDisplayName() + " " + _0x408b71.name + " 已达上限，本次未获得奖励");
      } else if (_0x39b672) {
        console.log("❌ " + this.getAccountDisplayName() + " 提交" + _0x408b71.name + "失败，本次未获得奖励");
      } else {
        console.log("❌ " + this.getAccountDisplayName() + " 提交" + _0x408b71.name + "失败（网络或服务器异常），本次未获得奖励");
      }
      return false;
    } catch (_0x3efcb5) {
      this.taskStats[_0x5184ff].failed++;
      return false;
    }
  }
  async executeAllTasksByPriority() {
    console.log("🔀 " + this.getAccountDisplayName() + " 任务执行顺序: " + this.tasksToExecute.join(" → "));
    for (const _0x9d7540 of this.tasksToExecute) {
      if (this.stopAllTasks) {
        console.log("🛑 " + this.getAccountDisplayName() + " 已停止所有任务");
        break;
      }
      if (this.taskLimitReached[_0x9d7540]) {
        console.log("⏭️ " + this.getAccountDisplayName() + " " + this.taskConfigs[_0x9d7540]?.name + " 已达上限，跳过");
        continue;
      }
      console.log("🚀 " + this.getAccountDisplayName() + " 开始执行: " + this.taskConfigs[_0x9d7540]?.name);
      switch (_0x9d7540) {
        case "look":
          await this.executeLookTasks();
          break;
        case "search":
          await this.executeSearchTasks();
          break;
        case "box":
          await this.executeBoxTasks();
          break;
        case "food":
          await this.executeFoodTasks();
          break;
        case "kbox":
          await this.executeKboxTasks();
          break;
        case "look_follow":
          console.log("ℹ️ " + this.getAccountDisplayName() + " look_follow 将在 look 任务成功后自动执行");
          break;
        case "search_follow":
          console.log("ℹ️ " + this.getAccountDisplayName() + " search_follow 将在 search 任务成功后自动执行");
          break;
        default:
          console.log("❌ " + this.getAccountDisplayName() + " 未知任务类型: " + _0x9d7540);
      }
      const _0x2c3719 = _0x9d7540 === this.tasksToExecute[this.tasksToExecute.length - 1];
      if (!_0x2c3719 && !this.stopAllTasks && !this.taskLimitReached[_0x9d7540]) {
        const _0x551ae1 = (Math.floor(Math.random() * (TASK_SWITCH_MAX - TASK_SWITCH_MIN + 1)) + TASK_SWITCH_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " 任务切换 等待 " + Math.round(_0x551ae1 / 1000) + " 秒");
        await new Promise(_0xc5b3e1 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0xc5b3e1, _0x551ae1));
      }
    }
    console.log("✅ " + this.getAccountDisplayName() + " 所有任务执行完成");
    return {};
  }
  async executeLookTasks() {
    console.log("📺 " + this.getAccountDisplayName() + " 开始执行看广告任务，计划执行 " + LOOK_COUNT + " 次");
    for (let _0x64ffec = 0; _0x64ffec < LOOK_COUNT; _0x64ffec++) {
      if (this.stopAllTasks || this.taskLimitReached.look) {
        console.log("🛑 " + this.getAccountDisplayName() + " 看广告任务已停止");
        break;
      }
      const _0x430584 = _0x64ffec + 1;
      console.log("🔍 " + this.getAccountDisplayName() + " 看广告任务 第" + _0x430584 + "/" + LOOK_COUNT + " 次");
      const _0x2ac606 = await this.executeTask("look");
      if (_0x2ac606 && this.tasksToExecute.includes("look_follow") && !this.stopAllTasks && !this.taskLimitReached.look_follow && FOLLOW_COUNT > 0) {
        const _0x3dabda = (Math.floor(Math.random() * (PRE_LOOK_FOLLOW_MAX - PRE_LOOK_FOLLOW_MIN + 1)) + PRE_LOOK_FOLLOW_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " look→look_follow 等待 " + Math.round(_0x3dabda / 1000) + " 秒");
        await new Promise(_0x2633fd => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x2633fd, _0x3dabda));
        console.log("🔄 " + this.getAccountDisplayName() + " 开始执行追加看广告任务，计划执行 " + FOLLOW_COUNT + " 次");
        for (let _0x481768 = 0; _0x481768 < FOLLOW_COUNT; _0x481768++) {
          if (this.stopAllTasks || this.taskLimitReached.look_follow) {
            console.log("🛑 " + this.getAccountDisplayName() + " 追加看广告任务已停止");
            break;
          }
          const _0x33fc72 = _0x481768 + 1;
          console.log("📱 " + this.getAccountDisplayName() + " 追加看广告 第" + _0x33fc72 + "/" + FOLLOW_COUNT + " 次");
          await this.executeTask("look_follow");
          if (_0x481768 < FOLLOW_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.look_follow) {
            const _0x47fdb3 = (Math.floor(Math.random() * (BETWEEN_LOOK_FOLLOW_MAX - BETWEEN_LOOK_FOLLOW_MIN + 1)) + BETWEEN_LOOK_FOLLOW_MIN) * 1000;
            console.log("⏱ " + this.getAccountDisplayName() + " look_follow 间隔 等待 " + Math.round(_0x47fdb3 / 1000) + " 秒");
            await new Promise(_0x38f186 => // TOLOOK
            // TOLOOK
            // TOLOOK
            setTimeout(_0x38f186, _0x47fdb3));
          }
        }
      }
      if (_0x64ffec < LOOK_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.look) {
        const _0x457618 = (Math.floor(Math.random() * (ROUND_END_MAX - ROUND_END_MIN + 1)) + ROUND_END_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " look 间隔 等待 " + Math.round(_0x457618 / 1000) + " 秒");
        await new Promise(_0x38f661 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x38f661, _0x457618));
      }
    }
    console.log("✅ " + this.getAccountDisplayName() + " 看广告任务执行完成");
  }
  async executeSearchTasks() {
    console.log("🔎 " + this.getAccountDisplayName() + " 开始执行搜索任务，计划执行 " + SEARCH_COUNT + " 次");
    for (let _0x4aa5e4 = 0; _0x4aa5e4 < SEARCH_COUNT; _0x4aa5e4++) {
      if (this.stopAllTasks || this.taskLimitReached.search) {
        console.log("🛑 " + this.getAccountDisplayName() + " 搜索任务已停止");
        break;
      }
      const _0x44fdba = _0x4aa5e4 + 1;
      console.log("🔍 " + this.getAccountDisplayName() + " 搜索任务 第" + _0x44fdba + "/" + SEARCH_COUNT + " 次");
      const _0x165c26 = await this.executeTask("search");
      if (_0x165c26 && this.tasksToExecute.includes("search_follow") && !this.stopAllTasks && !this.taskLimitReached.search_follow && SEARCH_FOLLOW_COUNT > 0) {
        const _0x249948 = (Math.floor(Math.random() * (PRE_SEARCH_FOLLOW_MAX - PRE_SEARCH_FOLLOW_MIN + 1)) + PRE_SEARCH_FOLLOW_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " search→search_follow 等待 " + Math.round(_0x249948 / 1000) + " 秒");
        await new Promise(_0x4e7ed1 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x4e7ed1, _0x249948));
        console.log("🔄 " + this.getAccountDisplayName() + " 开始执行搜索追加任务，计划执行 " + SEARCH_FOLLOW_COUNT + " 次");
        for (let _0x55816f = 0; _0x55816f < SEARCH_FOLLOW_COUNT; _0x55816f++) {
          if (this.stopAllTasks || this.taskLimitReached.search_follow) {
            console.log("🛑 " + this.getAccountDisplayName() + " 搜索追加任务已停止");
            break;
          }
          const _0x8301d = _0x55816f + 1;
          console.log("📱 " + this.getAccountDisplayName() + " 搜索追加 第" + _0x8301d + "/" + SEARCH_FOLLOW_COUNT + " 次");
          this.adAdditionalNum++;
          await this.executeTask("search_follow");
          this.adAdditionalNum = 0;
          if (_0x55816f < SEARCH_FOLLOW_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.search_follow) {
            const _0xde0d31 = (Math.floor(Math.random() * (BETWEEN_SEARCH_FOLLOW_MAX - BETWEEN_SEARCH_FOLLOW_MIN + 1)) + BETWEEN_SEARCH_FOLLOW_MIN) * 1000;
            console.log("⏱ " + this.getAccountDisplayName() + " search_follow 间隔 等待 " + Math.round(_0xde0d31 / 1000) + " 秒");
            await new Promise(_0x5e337a => // TOLOOK
            // TOLOOK
            // TOLOOK
            setTimeout(_0x5e337a, _0xde0d31));
          }
        }
      }
      if (_0x4aa5e4 < SEARCH_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.search) {
        const _0x5af3a2 = (Math.floor(Math.random() * (ROUND_END_MAX - ROUND_END_MIN + 1)) + ROUND_END_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " search 间隔 等待 " + Math.round(_0x5af3a2 / 1000) + " 秒");
        await new Promise(_0x435646 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x435646, _0x5af3a2));
      }
    }
    console.log("✅ " + this.getAccountDisplayName() + " 搜索任务执行完成");
  }
  async executeBoxTasks() {
    console.log("🎁 " + this.getAccountDisplayName() + " 开始执行宝箱任务，计划执行 " + BOX_COUNT + " 次");
    for (let _0x409eb1 = 0; _0x409eb1 < BOX_COUNT; _0x409eb1++) {
      if (this.stopAllTasks || this.taskLimitReached.box) {
        console.log("🛑 " + this.getAccountDisplayName() + " 宝箱任务已停止");
        break;
      }
      const _0x2f799d = _0x409eb1 + 1;
      console.log("🔍 " + this.getAccountDisplayName() + " 宝箱任务 第" + _0x2f799d + "/" + BOX_COUNT + " 次");
      await this.executeTask("box");
      if (_0x409eb1 < BOX_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.box) {
        const _0x2470f7 = (Math.floor(Math.random() * (TASK_SWITCH_MAX - TASK_SWITCH_MIN + 1)) + TASK_SWITCH_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " box 间隔 等待 " + Math.round(_0x2470f7 / 1000) + " 秒");
        await new Promise(_0x3b0769 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x3b0769, _0x2470f7));
      }
    }
    console.log("✅ " + this.getAccountDisplayName() + " 宝箱任务执行完成");
  }
  async executeFoodTasks() {
    console.log("🍚 " + this.getAccountDisplayName() + " 开始执行饭补任务，计划执行 " + FOOD_COUNT + " 次");
    for (let _0x18c0a5 = 0; _0x18c0a5 < FOOD_COUNT; _0x18c0a5++) {
      if (this.stopAllTasks || this.taskLimitReached.food) {
        console.log("🛑 " + this.getAccountDisplayName() + " 饭补任务已停止");
        break;
      }
      const _0x229cfb = _0x18c0a5 + 1;
      console.log("🔍 " + this.getAccountDisplayName() + " 饭补任务 第" + _0x229cfb + "/" + FOOD_COUNT + " 次");
      await this.executeTask("food");
      if (_0x18c0a5 < FOOD_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.food) {
        const _0x15018f = (Math.floor(Math.random() * (TASK_SWITCH_MAX - TASK_SWITCH_MIN + 1)) + TASK_SWITCH_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " food 间隔 等待 " + Math.round(_0x15018f / 1000) + " 秒");
        await new Promise(_0x5c7243 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x5c7243, _0x15018f));
      }
    }
    console.log("✅ " + this.getAccountDisplayName() + " 饭补任务执行完成");
  }
  async executeKboxTasks() {
    console.log("📦 " + this.getAccountDisplayName() + " 开始执行开宝箱任务，计划执行 " + KBOX_COUNT + " 次");
    for (let _0x22b7d1 = 0; _0x22b7d1 < KBOX_COUNT; _0x22b7d1++) {
      if (this.stopAllTasks || this.taskLimitReached.kbox) {
        console.log("🛑 " + this.getAccountDisplayName() + " 开宝箱任务已停止");
        break;
      }
      const _0x3ad8d7 = _0x22b7d1 + 1;
      console.log("🔍 " + this.getAccountDisplayName() + " 开宝箱任务 第" + _0x3ad8d7 + "/" + KBOX_COUNT + " 次");
      await this.executeTask("kbox");
      if (_0x22b7d1 < KBOX_COUNT - 1 && !this.stopAllTasks && !this.taskLimitReached.kbox) {
        const _0x43aede = (Math.floor(Math.random() * (TASK_SWITCH_MAX - TASK_SWITCH_MIN + 1)) + TASK_SWITCH_MIN) * 1000;
        console.log("⏱ " + this.getAccountDisplayName() + " kbox 间隔 等待 " + Math.round(_0x43aede / 1000) + " 秒");
        await new Promise(_0x581ea8 => // TOLOOK
        // TOLOOK
        // TOLOOK
        setTimeout(_0x581ea8, _0x43aede));
      }
    }
    console.log("✅ " + this.getAccountDisplayName() + " 开宝箱任务执行完成");
  }
}
function parseAccountString(_0x3a73cb) {
  const _0x2ea7f0 = String(_0x3a73cb || "").trim();
  if (!_0x2ea7f0) {
    return null;
  }
  let _0x8d189c = "";
  let _0x11e322 = "";
  let _0x12d050 = "";
  let _0x80c950 = null;
  if (_0x2ea7f0.includes("#")) {
    const _0xb4cadc = _0x2ea7f0.split("#");
    if (_0xb4cadc.length === 2) {
      _0x12d050 = _0xb4cadc[0];
      _0x11e322 = _0xb4cadc[1];
    } else if (_0xb4cadc.length === 3) {
      if (/^socks5:\/\//i.test(_0xb4cadc[2]) || _0xb4cadc[2].includes("|")) {
        _0x12d050 = _0xb4cadc[0];
        _0x11e322 = _0xb4cadc[1];
        _0x80c950 = _0xb4cadc[2];
      } else {
        _0x8d189c = _0xb4cadc[0];
        _0x12d050 = _0xb4cadc[1];
        _0x11e322 = _0xb4cadc[2];
      }
    } else if (_0xb4cadc.length >= 4) {
      _0x8d189c = _0xb4cadc[0];
      _0x12d050 = _0xb4cadc[1];
      _0x11e322 = _0xb4cadc.slice(2, _0xb4cadc.length - 1).join("#");
      _0x80c950 = _0xb4cadc[_0xb4cadc.length - 1];
    }
  } else {
    _0x12d050 = _0x2ea7f0;
    _0x11e322 = "";
  }
  if (_0x80c950) {
    if (_0x80c950 === "0" || _0x80c950.toLowerCase() === "none") {
      _0x80c950 = null;
    } else if (_0x80c950.includes("|")) {
      const _0x5d365c = _0x80c950.split("|");
      if (_0x5d365c.length >= 2) {
        const [_0x5060b7, _0x453a3a, _0x2b79d8 = "", _0x44134e = ""] = _0x5d365c.map(_0x14fbf5 => String(_0x14fbf5 || "").trim());
        if (_0x5060b7 && _0x453a3a) {
          const _0x1dfc6f = _0x2b79d8 || _0x44134e ? encodeURIComponent(_0x2b79d8) + ":" + encodeURIComponent(_0x44134e) + "@" : "";
          _0x80c950 = "socks5://" + _0x1dfc6f + _0x5060b7 + ":" + _0x453a3a;
        } else {
          _0x80c950 = null;
        }
      } else {
        _0x80c950 = null;
      }
    }
  }
  return {
    remark: _0x8d189c || "",
    salt: _0x11e322,
    cookie: _0x12d050,
    proxyUrl: _0x80c950
  };
}
function getAllAccountConfigs() {
  const _0x3b24b8 = parseAccountsFromEnv();
  const _0xe0732b = [];
  for (const _0x2b68ae of _0x3b24b8) {
    const _0x13bd53 = parseAccountString(_0x2b68ae);
    if (_0x13bd53) {
      _0xe0732b.push(_0x13bd53);
    } else {
      console.log("账号格式错误：" + _0x2b68ae);
    }
  }
  _0xe0732b.forEach((_0x89e1bc, _0x3a61e5) => {
    _0x89e1bc.index = _0x3a61e5 + 1;
  });
  return _0xe0732b;
}
async function executeConcurrently(_0x5eed42, _0x1c947f, _0xdffae) {
  const _0x22c369 = new Array(_0x5eed42.length);
  let _0x397572 = 0;
  async function _0x197d2b() {
    while (true) {
      const _0x31675c = _0x397572++;
      if (_0x31675c >= _0x5eed42.length) {
        return;
      }
      const _0x59ad68 = _0x5eed42[_0x31675c];
      try {
        _0x22c369[_0x31675c] = await _0xdffae(_0x59ad68, _0x31675c);
      } catch (_0x50d6f1) {
        console.log("并发执行异常（index=" + (_0x31675c + 1) + "）：" + _0x50d6f1.message);
        _0x22c369[_0x31675c] = null;
      }
    }
  }
  const _0x97463d = Array.from({
    length: Math.min(_0x1c947f, _0x5eed42.length)
  }, _0x197d2b);
  await Promise.all(_0x97463d);
  return _0x22c369;
}
function formatAccountDisplay(_0x31af53, _0x18a357, _0x60fe67) {
  const _0x257da1 = "账号[" + (_0x18a357 || _0x31af53) + "]" + (_0x60fe67 ? "（" + _0x60fe67 + "）" : "");
  return colors.bright + colors.cyan + _0x257da1 + colors.reset;
}
async function processAccount(_0x49384a) {
  const _0x2568b9 = {
    OCnmG: "✅ SOCKS5代理正常，出口IP: ",
    tjjDX: "look",
    CAMWD: "kbox",
    psqKD: "search",
    yYsXz: "search_follow",
    XVydT: "box",
    wPlGm: "filter",
    Njfnl: "index",
    jxmGX: "proxyUrl",
    cYluL: "✅ 代理验证通过",
    Yrpgp: "msg",
    iBUDS: function (_0xd6a8f9, _0x49a7a1) {
      return _0xd6a8f9 !== _0x49a7a1;
    },
    UpUuj: function (_0x59b01c, _0x2362d2) {
      return _0x59b01c + _0x2362d2;
    },
    DppEe: function (_0x5d9a36, _0x1a32d0) {
      return _0x5d9a36 + _0x1a32d0;
    },
    wCeRf: " 代理测试失败，跳过该账号",
    quuKk: "无备注",
    oUvFG: function (_0x47bb46, _0x132241, _0x57846a, _0x59ab4c) {
      return _0x47bb46(_0x132241, _0x57846a, _0x59ab4c);
    },
    Zqpta: function (_0x504aff, _0x25094c) {
      return _0x504aff != _0x25094c;
    },
    cECrQ: function (_0x3e1743, _0x4a20c4, _0x2c3217) {
      return _0x3e1743(_0x4a20c4, _0x2c3217);
    },
    JcpSx: "log",
    hZVAb: function (_0xb13bf5, _0x19f1d9) {
      return _0xb13bf5 + _0x19f1d9;
    },
    ApHsl: function (_0x487d55, _0x1f6992) {
      return _0x487d55 === _0x1f6992;
    },
    LZtjy: "lEMLx",
    TgaHE: "getCookieWithCurrentDid",
    XuIvz: function (_0x492f4f, _0x2b7d07) {
      return _0x492f4f - _0x2b7d07;
    },
    bjRuT: "allCash"
  };
  if (_0x49384a.proxyUrl) {
    const _0x107728 = formatAccountDisplay(_0x49384a[_0x2568b9.Njfnl], null, _0x49384a.remark);
    const _0xd81aab = await testProxyConnectivity(_0x49384a[_0x2568b9.jxmGX], _0x107728);
    console.log("  - " + (_0xd81aab.ok ? _0x2568b9.cYluL : "❌ 代理验证失败") + ": " + _0xd81aab[_0x2568b9.Yrpgp]);
    if (_0xd81aab.ok && _0xd81aab.ip && _0x2568b9.iBUDS(_0xd81aab.ip, "localhost")) {
      if (usedProxyIPs.has(_0xd81aab.ip)) {
        console.log(_0x2568b9.UpUuj("⚠️ 存在相同代理IP（", _0xd81aab.ip) + "），继续执行其余账号...");
      } else {
        usedProxyIPs.add(_0xd81aab.ip);
      }
      console.log("🌐 " + _0x107728 + " 使用代理: " + _0x49384a.proxyUrl);
    } else if (!_0xd81aab.ok) {
      console.log(_0x2568b9.DppEe("❌ ", _0x107728) + _0x2568b9.wCeRf);
      return {
        index: _0x49384a.index,
        remark: _0x49384a.remark || _0x2568b9.quuKk,
        nickname: "账号" + _0x49384a[_0x2568b9.Njfnl],
        initialCoin: 0,
        finalCoin: 0,
        coinChange: 0,
        initialCash: 0,
        finalCash: 0,
        cashChange: 0,
        error: "代理测试失败: " + _0xd81aab[_0x2568b9.Yrpgp],
        skipped: true
      };
    }
  } else {
    const _0x4a64c8 = formatAccountDisplay(_0x49384a.index, null, _0x49384a.remark);
    console.log("🌐 " + _0x4a64c8 + " 未配置代理，走直连");
  }
  const _0x1a1e38 = formatAccountDisplay(_0x49384a.index, null, _0x49384a.remark);
  console.log("🔍 " + _0x1a1e38 + " 获取账号信息中...");
  let _0x401723 = await _0x2568b9.oUvFG(getAccountBasicInfo, _0x49384a.cookie, _0x49384a.proxyUrl, _0x49384a.index);
  let _0x374cd8 = _0x401723?.nickname || "账号" + _0x49384a.index;
  if (_0x401723) {
    const _0x3ad07f = _0x401723.totalCoin != null ? _0x401723.totalCoin : "未知";
    const _0x5cfa02 = _0x2568b9.Zqpta(_0x401723.allCash, null) ? _0x401723.allCash : "未知";
    const _0x5f51cc = formatAccountDisplay(_0x49384a.index, _0x374cd8, _0x49384a.remark);
    const _0x237b3c = _0x401723.ud ? "，UD: " + _0x401723.ud : "";
    if (enableColors) {
      console.log("✅ " + _0x5f51cc + " 登录成功，💰 当前金币: " + formatSuccess(_0x3ad07f) + "，💸 当前余额: " + _0x2568b9.cECrQ(colorText, _0x5cfa02, colors.bright + colors.yellow) + _0x237b3c);
    } else {
      console[_0x2568b9.JcpSx](_0x2568b9.hZVAb("✅ " + _0x5f51cc + " 登录成功，💰 当前金币: " + _0x3ad07f + "，💸 当前余额: ", _0x5cfa02) + _0x237b3c);
    }
  } else if (_0x2568b9.ApHsl("lEMLx", _0x2568b9.LZtjy)) {
    const _0x52ee4c = formatAccountDisplay(_0x49384a.index, _0x374cd8, _0x49384a.remark);
    console.log("❌ " + _0x52ee4c + " 基本信息获取失败，但仍继续执行任务");
  } else {
    const _0x2143bc = process.env.Task;
    if (!_0x2143bc) {
      return [_0x2568b9.tjjDX, "box", "food", _0x2568b9.CAMWD, _0x2568b9.psqKD, "look_follow", _0x2568b9.yYsXz];
    }
    const _0x563268 = _0x2143bc.split(",").map(_0xfa9b9c => _0xfa9b9c.trim().toLowerCase()).filter(_0x2568b9);
    const _0x1632e7 = ["look", _0x2568b9.XVydT, "food", "kbox", "search", "look_follow", "search_follow"];
    const _0x2f4a99 = _0x563268[_0x2568b9.wPlGm](_0x1bd472 => _0x1632e7.includes(_0x1bd472));
    if (_0x2f4a99.length === 0) {
      return ["look", "box", "food", "kbox", "search", "look_follow", "search_follow"];
    } else {
      return _0x2f4a99;
    }
  }
  const _0x3e7f55 = _0x401723?.ud || null;
  const _0x30e9ca = new KuaishouAccount({
    ..._0x49384a,
    nickname: _0x374cd8,
    tasksToExecute: tasksToExecute,
    udFromLogin: _0x3e7f55
  });
  if (_0x401723) {
    await _0x30e9ca.checkCoinLimit();
    if (_0x30e9ca.coinExceeded) {
      console.log("⚠️ " + _0x30e9ca.getAccountDisplayName() + " 初始金币已超过阈值，不执行任务");
      const _0x583644 = await getAccountBasicInfo(_0x30e9ca.getCookieWithCurrentDid(), _0x49384a.proxyUrl, _0x49384a.index);
      const _0x2ee5a5 = _0x401723?.totalCoin || 0;
      const _0x51f38e = _0x583644?.totalCoin || 0;
      const _0x29afd3 = _0x51f38e - _0x2ee5a5;
      const _0x194f18 = _0x401723?.allCash || 0;
      const _0x3ee0be = _0x583644?.allCash || 0;
      const _0xab17bd = _0x3ee0be - _0x194f18;
      return {
        index: _0x49384a[_0x2568b9.Njfnl],
        remark: _0x49384a.remark || "无备注",
        nickname: _0x374cd8,
        initialCoin: _0x2ee5a5,
        finalCoin: _0x51f38e,
        coinChange: _0x29afd3,
        initialCash: _0x194f18,
        finalCash: _0x3ee0be,
        cashChange: _0xab17bd,
        stats: _0x30e9ca.getTaskStats(),
        coinLimitExceeded: true
      };
    }
  }
  await _0x30e9ca.executeAllTasksByPriority();
  const _0xe40e7b = await getAccountBasicInfo(_0x30e9ca[_0x2568b9.TgaHE](), _0x49384a.proxyUrl, _0x49384a.index);
  const _0x462cfa = _0x401723?.totalCoin || 0;
  const _0x10db0f = _0xe40e7b?.totalCoin || 0;
  const _0x28781c = _0x2568b9.XuIvz(_0x10db0f, _0x462cfa);
  const _0x31e3cc = _0x401723?.allCash || 0;
  const _0x4a9cb2 = _0xe40e7b?.[_0x2568b9.bjRuT] || 0;
  const _0x4b03ec = _0x2568b9.XuIvz(_0x4a9cb2, _0x31e3cc);
  _0x30e9ca.printTaskStats();
  return {
    index: _0x49384a[_0x2568b9.Njfnl],
    remark: _0x49384a.remark || "无备注",
    nickname: _0x374cd8,
    initialCoin: _0x462cfa,
    finalCoin: _0x10db0f,
    coinChange: _0x28781c,
    initialCash: _0x31e3cc,
    finalCash: _0x4a9cb2,
    cashChange: _0x4b03ec,
    stats: _0x30e9ca.getTaskStats(),
    coinLimitExceeded: _0x30e9ca.coinExceeded,
    infoFetchFailed: !_0x401723
  };
}
async function testSignService() {
  try {
    const requestData = {
      type: "encsign",
      data: "dGVzdF9kYXRh",
      ud: "test_user",
      script_version: SCRIPT_VERSION
    };

    const { response, body } = await sendRequest({
      method: "POST",
	  //改成接口API
      url: "http://127.0.0.1:8888/encsign",
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 10000
    }, null, "encsign签名服务测试");

    if (!response) {
      console.log("❌ encsign签名服务测试失败: 无响应");
      return false;
    }

    if (body && body.status) {
      console.log("✅ encsign签名服务测试成功");
      return true;
    } else {
      console.log("❌ encsign签名服务测试失败: " + (body?.message || "未知错误"));
      return false;
    }
  } catch (error) {
    console.log("❌ encsign签名服务测试异常: " + error.message);
    return false;
  }
}
async function testNssigService() {
  try {
    const deviceId = getOrCreateDeviceId();
    const requestData = {
      type: "nssig",
      path: "/rest/e/reward/mixed/ad",
      data: "test=data&salt=test_salt",
      salt: "test_salt",
      ud: "test_user",
      script_version: SCRIPT_VERSION,
      device_id: deviceId
    };

    const { response, body } = await sendRequest({
      method: "POST",
	  //改成接口API
      url: "http://127.0.0.1:8888/nssig",
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 10000
    }, null, "nssig签名服务测试");

    if (!response) {
      console.log("❌ nssig签名服务测试失败: 无响应");
      return false;
    }

    if (body && body.status) {
      console.log("✅ nssig签名服务测试成功");
      return true;
    } else {
      console.log("❌ nssig签名服务测试失败: " + (body?.message || "未知错误"));
      return false;
    }
  } catch (error) {
    console.log("❌ nssig签名服务测试异常: " + error.message);
    return false;
  }
}
(async () => {

  console.log("📢 会员专线 通知群 示例频道");

  const deviceId = getOrCreateDeviceId();
  console.log(" 设备ID: " + deviceId);

  //  测试签名服务
  const signOk = await testSignService();
  const nssigOk = await testNssigService();

  if (!signOk || !nssigOk) {
    console.log("\n 签名服务测试失败，脚本终止执行");
    console.log(" 请检查以下问题:");
    console.log("  1. 网络连接是否正常");
    console.log("  2. 签名服务地址是否正确");
    console.log("  3. 服务是否可用");
    console.log("  4. 防火墙或代理设置");
    process.exit(1);
  }

  //  读取账号配置
  const accounts = getAllAccountConfigs();
  if (!accounts.length) {
    console.log("\n 错误: 未配置账号信息");
    console.log(" 请设置环境变量 ksck 或 ksck1, ksck2... 来配置账号");
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log(` 开始执行任务，共 ${accounts.length} 个账号...\n`);

  //  结果汇总数组
  const results = [];

  const concurrency = Math.max(
    1,
    Math.min(MAX_CONCURRENCY, accounts.length)
  );

  //  并发执行账号任务
  await executeConcurrently(accounts, concurrency, async (account) => {
    try {
      const info = await processAccount(account);

      results.push({
        index: account.index,
        remark: account.remark || "无备注",
        nickname: info?.nickname || `账号${account.index}`,

        initialCoin: info?.initialCoin || 0,
        finalCoin: info?.finalCoin || 0,
        coinChange: info?.coinChange || 0,

        initialCash: info?.initialCash || 0,
        finalCash: info?.finalCash || 0,
        cashChange: info?.cashChange || 0,

        skipped: false,
        error: null
      });

    } catch (err) {
      console.log(
        `账号[${account.index}]` +
        (account.remark ? `（${account.remark}）` : "") +
        `  执行异常：${err.message}`
      );

      results.push({
        index: account.index,
        remark: account.remark || "无备注",
        nickname: `账号${account.index}`,

        initialCoin: 0,
        finalCoin: 0,
        coinChange: 0,
        initialCash: 0,
        finalCash: 0,
        cashChange: 0,

        skipped: true,
        error: err.message
      });
    }
  });

  //  排序 + 汇总输出
  results.sort((a, b) => a.index - b.index);

  console.log("\n全部完成。");
  console.log("-------------------------------------------------- 账号信息汇总 --------------------------------------------------");

  printAccountsSummary(results);

})();


// ===== 账号汇总展示 =====
function printAccountsSummary(results) {
  if (!Array.isArray(results) || results.length === 0) {
    console.log("无账号汇总数据");
    return;
  }

  console.table(results.map(r => ({
    序号: r.index,
    备注: r.remark,
    昵称: r.nickname,
    金币变化: r.coinChange,
    现金变化: r.cashChange,
    是否跳过: r.skipped ? "是" : "否",
    错误信息: r.error || ""
  })));
}


// 当前脚本来自于 http://script.345yun.cn 脚本库下载！
// 当前脚本来自于 http://2.345yun.cn 脚本库下载！
// 当前脚本来自于 http://2.345yun.cc 脚本库下载！
// 脚本库官方QQ群1群: 429274456
// 脚本库官方QQ群2群: 1077801222
// 脚本库官方QQ群3群: 433030897
// 脚本库中的所有脚本文件均来自热心网友上传和互联网收集。
// 脚本库仅提供文件上传和下载服务，不提供脚本文件的审核。
// 您在使用脚本库下载的脚本时自行检查判断风险。
// 所涉及到的 账号安全、数据泄露、设备故障、软件违规封禁、财产损失等问题及法律风险，与脚本库无关！均由开发者、上传者、使用者自行承担。
/**
 * JD_All.js
 * name: 京东全套薅羊毛
 * cron: 30 8,20 * * *
 * description: 每日签到领京豆、PLUS签到、店铺签到、京东金融签到、价格保护、闪购签到、领券中心、京东农场、京东萌宠、种豆得豆
 * 多账号支持：环境变量 JD_COOKIE，多个账号用 & 分隔
 * Cookie 格式：pt_key=xxx;pt_pin=xxx;
 */

const { sendNotify } = require('./sendNotify.js');

// ==================== 配置区 ====================
const JD_COOKIE = process.env.JD_COOKIE || '';
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

// 可签到店铺列表（shopId -> 店铺名）
const SHOPS = {
  '1000000770': '京东超市',
  '1000003300': '京东家电',
  '1000003697': '京东服饰',
  '1000000384': '京东手机',
  '1000003604': '京东国际',
  '1000003585': '京东图书',
  '1000000734': '京东生鲜',
  '1000003515': '京东美妆',
  '1000003630': '京东运动',
  '1000003490': '京东宠物',
};

// ==================== 工具函数 ====================

/** 解析 Cookie 列表，支持多账号 */
function parseCookies(cookieStr) {
  if (!cookieStr) return [];
  return cookieStr
    .split('&')
    .map((c) => c.trim())
    .filter((c) => c && c.includes('pt_key') && c.includes('pt_pin'));
}

/** 从 Cookie 中提取 pt_pin */
function getPin(cookie) {
  const match = cookie.match(/pt_pin=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '未知用户';
}

/** 通用京东 API 请求 */
async function jdApi(functionId, body = {}, cookie, appid = 'ld') {
  const url = `https://api.m.jd.com/client.action?functionId=${functionId}&appid=${appid}&t=${Date.now()}`;
  const formBody = Object.keys(body)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`)
    .join('&');

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Accept': 'application/json',
      },
      body: formBody || undefined,
      signal: controller.signal,
    });

    return await resp.json();
  } catch (e) {
    console.log(`  ❌ 请求 ${functionId} 失败: ${e.message}`);
    return null;
  }
}

/** 通用 GET 请求 */
async function jdApiGet(url, cookie) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30000);

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    return await resp.json();
  } catch (e) {
    console.log(`  ❌ 请求失败: ${e.message}`);
    return null;
  }
}

// ==================== 功能模块 ====================

/**
 * 1. 每日签到领京豆
 */
async function signBean(cookie) {
  console.log('  📍 执行京豆签到...');
  const result = await jdApi('signBeanAct', {}, cookie, 'ld');

  if (!result) return { ok: false, msg: '请求失败' };

  if (result.code === '0' || result.data?.detailMessage?.includes('签到成功')) {
    const beans = result.data?.amount || result.data?.dailyAward?.beanAward?.beans || 0;
    const msg = `签到成功，获得 ${beans} 京豆`;
    console.log(`  ✅ ${msg}`);
    return { ok: true, msg };
  }

  if (result.data?.detailMessage?.includes('已签到')) {
    console.log('  ℹ️ 今日已签到');
    return { ok: true, msg: '今日已签到' };
  }

  // 尝试获取今日签到状态
  const status = await jdApi('signBeanStatus', {}, cookie, 'ld');
  if (status?.data?.todaySigned === true) {
    console.log('  ℹ️ 今日已签到（状态确认）');
    return { ok: true, msg: '今日已签到' };
  }

  console.log(`  ⚠️ 京豆签到异常: ${JSON.stringify(result)}`);
  return { ok: false, msg: `签到异常: ${result.data?.detailMessage || JSON.stringify(result)}` };
}

/**
 * 2. PLUS 会员签到
 */
async function plusSign(cookie) {
  console.log('  📍 执行PLUS签到...');
  const result = await jdApi('plusMemberSign', {}, cookie, 'jdplus');

  if (!result) return { ok: false, msg: '请求失败' };

  if (result.code === '0' || result.data?.signSuccess === true) {
    // 尝试获取奖励信息
    const award = result.data?.awardInfo || result.data?.rewardResult || {};
    const awardMsg = award.prizeName || award.awardName || '签到成功';
    console.log(`  ✅ PLUS签到成功: ${awardMsg}`);
    return { ok: true, msg: awardMsg };
  }

  if (result.data?.signed === true || result.data?.alreadySign === true) {
    console.log('  ℹ️ PLUS今日已签到');
    return { ok: true, msg: '今日已签到' };
  }

  // 可能是非PLUS会员
  if (result.data?.errorCode === 'NON_MEMBER') {
    console.log('  ℹ️ 非PLUS会员，跳过');
    return { ok: true, msg: '非PLUS会员' };
  }

  console.log(`  ⚠️ PLUS签到异常: ${JSON.stringify(result)}`);
  return { ok: false, msg: `异常: ${JSON.stringify(result)}` };
}

/**
 * 3. 店铺签到
 */
async function shopSign(cookie) {
  console.log('  📍 执行店铺签到...');
  let success = 0;
  let fail = 0;
  let details = [];

  for (const [shopId, shopName] of Object.entries(SHOPS)) {
    try {
      const body = { shopId, signType: '1' };
      const result = await jdApi('signInShop', body, cookie, 'shop');

      if (!result) {
        fail++;
        continue;
      }

      if (result.code === '0' || result.data?.success === true) {
        const award = result.data?.awardList?.[0]?.awardName || result.data?.awardName || '签到成功';
        details.push(`${shopName}: ✅ ${award}`);
        success++;
      } else if (result.data?.alreadySign === true || result.data?.signed === true) {
        details.push(`${shopName}: ℹ️ 已签到`);
        success++;
      } else {
        details.push(`${shopName}: ⚠️ ${result.data?.errorMessage || result.message || '失败'}`);
        fail++;
      }
    } catch (e) {
      details.push(`${shopName}: ❌ ${e.message}`);
      fail++;
    }

    // 店铺签到间隔，避免触发风控
    await new Promise((r) => setTimeout(r, 1000));
  }

  details.forEach((d) => console.log(`    ${d}`));
  console.log(`  📊 店铺签到: 成功 ${success} / 失败 ${fail}`);
  return { ok: fail === 0, msg: `成功${success}家，失败${fail}家` };
}

/**
 * 4. 京东金融签到
 */
async function financeSign(cookie) {
  console.log('  📍 执行京东金融签到...');
  const result = await jdApi('signIn', {}, cookie, 'finance');

  if (!result) return { ok: false, msg: '请求失败' };

  if (result.code === '0' || result.data?.signSuccess === true) {
    const award = result.data?.prizeName || result.data?.awardName || '签到成功';
    console.log(`  ✅ 金融签到成功: ${award}`);
    return { ok: true, msg: award };
  }

  if (result.data?.alreadySign === true || result.data?.signed === true) {
    console.log('  ℹ️ 金融今日已签到');
    return { ok: true, msg: '今日已签到' };
  }

  console.log(`  ⚠️ 金融签到异常: ${JSON.stringify(result)}`);
  return { ok: false, msg: `异常: ${JSON.stringify(result)}` };
}

/**
 * 5. 价格保护
 */
async function priceProtect(cookie) {
  console.log('  📍 执行价格保护...');
  const queryUrl = `https://api.m.jd.com/client.action?functionId=priceProtectQuery&appid=pc&t=${Date.now()}`;

  const result = await jdApiGet(queryUrl, cookie);

  if (!result) return { ok: false, msg: '查询失败' };

  const orderList = result.data?.orderList || result.data?.list || [];
  if (orderList.length === 0) {
    console.log('  ℹ️ 没有可价保的订单');
    return { ok: true, msg: '无可价保订单' };
  }

  console.log(`  ℹ️ 发现 ${orderList.length} 个可价保订单`);
  let applied = 0;
  let totalAmount = 0;

  for (const order of orderList.slice(0, 10)) {
    // 最多处理10个
    const orderId = order.orderId || order.id;
    if (!orderId) continue;

    const applyBody = { orderId, appid: 'pc' };
    const applyResult = await jdApi('priceProtectApply', applyBody, cookie, 'pc');

    if (applyResult?.code === '0' || applyResult?.data?.success === true) {
      const amount = applyResult.data?.priceProtectAmount || order.priceProtectAmount || 0;
      totalAmount += parseFloat(amount) || 0;
      applied++;
      console.log(`    ✅ 订单 ${orderId} 价保成功，预计退款 ${amount} 元`);
    } else {
      console.log(`    ⚠️ 订单 ${orderId} 价保失败: ${applyResult?.data?.errorMessage || applyResult?.message || '未知'}`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  const msg = `成功申请 ${applied} 笔，预计退款 ¥${totalAmount.toFixed(2)}`;
  console.log(`  📊 ${msg}`);
  return { ok: applied > 0, msg };
}

/**
 * 6. 京东闪购签到
 */
async function flashSaleSign(cookie) {
  console.log('  📍 执行闪购签到...');
  const result = await jdApi('signInFlashSale', {}, cookie, 'flashsale');

  if (!result) return { ok: false, msg: '请求失败' };

  if (result.code === '0' || result.data?.signSuccess === true) {
    const award = result.data?.awardName || result.data?.prizeName || '签到成功';
    console.log(`  ✅ 闪购签到成功: ${award}`);
    return { ok: true, msg: award };
  }

  if (result.data?.alreadySign === true || result.data?.signed === true) {
    console.log('  ℹ️ 闪购今日已签到');
    return { ok: true, msg: '今日已签到' };
  }

  console.log(`  ⚠️ 闪购签到异常: ${JSON.stringify(result)}`);
  return { ok: false, msg: `异常: ${JSON.stringify(result)}` };
}

/**
 * 7. 京东领券中心
 */
async function couponCenter(cookie) {
  console.log('  📍 执行领券中心...');

  const listResult = await jdApi('myCouponCenter', { page: 1, pageSize: 20 }, cookie, 'coupon');

  if (!listResult) return { ok: false, msg: '查询失败' };

  const couponList = listResult.data?.couponList || listResult.data?.list || [];
  if (couponList.length === 0) {
    console.log('  ℹ️ 暂无可用优惠券');
    return { ok: true, msg: '暂无可用优惠券' };
  }

  console.log(`  ℹ️ 发现 ${couponList.length} 张可领优惠券`);
  let claimed = 0;

  for (const coupon of couponList.slice(0, 10)) {
    const couponId = coupon.id || coupon.couponId;
    if (!couponId) continue;

    const claimResult = await jdApi('receiveCoupon', { id: couponId }, cookie, 'coupon');

    if (claimResult?.code === '0' || claimResult?.data?.success === true) {
      const amount = coupon.amount || coupon.discount || '未知';
      console.log(`    ✅ 领取优惠券成功: ${amount}元`);
      claimed++;
    } else if (claimResult?.data?.alreadyReceived === true) {
      console.log(`    ℹ️ 优惠券已领取`);
    } else {
      console.log(`    ⚠️ 领取失败: ${claimResult?.data?.errorMessage || '未知'}`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  const msg = `成功领取 ${claimed} 张优惠券`;
  console.log(`  📊 ${msg}`);
  return { ok: claimed > 0, msg };
}

/**
 * 8. 京东农场
 */
async function farmTasks(cookie) {
  console.log('  📍 执行京东农场...');

  const initResult = await jdApi('initForFarm', { version: 2 }, cookie, 'wh5');
  if (!initResult) return { ok: false, msg: '请求失败' };

  // 签到领水滴
  const signResult = await jdApi('signInForFarm', {}, cookie, 'wh5');
  let signMsg = '';
  if (signResult?.code === '0' || signResult?.data?.success === true) {
    const water = signResult.data?.water || signResult.data?.award || 0;
    signMsg = `签到领水成功 +${water}`;
    console.log(`    ✅ ${signMsg}`);
  } else if (signResult?.data?.alreadySign === true) {
    signMsg = '今日已签到';
    console.log(`    ℹ️ ${signMsg}`);
  } else {
    console.log(`    ⚠️ 农场签到异常`);
  }

  // 执行浇水任务（最多浇3次）
  let waterCount = 0;
  for (let i = 0; i < 3; i++) {
    const waterResult = await jdApi('waterForFarm', {}, cookie, 'wh5');
    if (waterResult?.code === '0' || waterResult?.data?.success === true) {
      waterCount++;
      console.log(`    ✅ 第${i + 1}次浇水成功`);
    } else if (waterResult?.data?.noWater === true) {
      console.log(`    ℹ️ 水滴不足，停止浇水`);
      break;
    } else {
      console.log(`    ⚠️ 第${i + 1}次浇水失败`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  const msg = `${signMsg}，浇水${waterCount}次`;
  return { ok: true, msg };
}

/**
 * 9. 京东萌宠
 */
async function petTasks(cookie) {
  console.log('  📍 执行京东萌宠...');

  const homeResult = await jdApi('petHome', {}, cookie, 'pet');
  if (!homeResult) return { ok: false, msg: '请求失败' };

  // 签到
  const signResult = await jdApi('petSignIn', {}, cookie, 'pet');
  let signMsg = '';
  if (signResult?.code === '0' || signResult?.data?.success === true) {
    const award = signResult.data?.awardName || signResult.data?.prizeName || '签到成功';
    signMsg = `签到成功: ${award}`;
    console.log(`    ✅ ${signMsg}`);
  } else if (signResult?.data?.alreadySign === true) {
    signMsg = '今日已签到';
    console.log(`    ℹ️ ${signMsg}`);
  } else {
    console.log(`    ⚠️ 萌宠签到异常`);
  }

  // 喂食（最多3次）
  let feedCount = 0;
  for (let i = 0; i < 3; i++) {
    const feedResult = await jdApi('petFeed', {}, cookie, 'pet');
    if (feedResult?.code === '0' || feedResult?.data?.success === true) {
      feedCount++;
      console.log(`    ✅ 第${i + 1}次喂食成功`);
    } else {
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  const msg = `${signMsg}，喂食${feedCount}次`;
  return { ok: true, msg };
}

/**
 * 10. 京东种豆得豆
 */
async function plantBeanTasks(cookie) {
  console.log('  📍 执行种豆得豆...');

  const indexResult = await jdApi('plantBeanIndex', {}, cookie, 'plant');
  if (!indexResult) return { ok: false, msg: '请求失败' };

  // 签到领营养液
  const signResult = await jdApi('plantBeanSign', {}, cookie, 'plant');
  let signMsg = '';
  if (signResult?.code === '0' || signResult?.data?.success === true) {
    const award = signResult.data?.amount || signResult.data?.award || '奖励';
    signMsg = `签到成功 +${award}`;
    console.log(`    ✅ ${signMsg}`);
  } else if (signResult?.data?.alreadySign === true) {
    signMsg = '今日已签到';
    console.log(`    ℹ️ ${signMsg}`);
  } else {
    console.log(`    ⚠️ 种豆签到异常`);
  }

  // 执行任务
  const taskResult = await jdApi('plantBeanTask', {}, cookie, 'plant');
  if (taskResult?.code === '0' || taskResult?.data?.success === true) {
    console.log(`    ✅ 任务执行成功`);
  } else {
    console.log(`    ℹ️ 无可执行任务或任务已结束`);
  }

  return { ok: true, msg: signMsg };
}

// ==================== 主流程 ====================

async function allTasks() {
  console.log('🛒 ====== 京东全套薅羊毛开始 ======');
  const cookies = parseCookies(JD_COOKIE);

  if (cookies.length === 0) {
    console.log('❌ 未检测到京东Cookie，请配置环境变量 JD_COOKIE');
    console.log('   Cookie格式: pt_key=xxx;pt_pin=xxx;');
    console.log('   多个账号用 & 分隔');
    await sendNotify('京东全套薅羊毛', '❌ 错误：未配置 JD_COOKIE 环境变量');
    return;
  }

  console.log(`📋 共检测到 ${cookies.length} 个账号\n`);

  let allResults = [];

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const pin = getPin(cookie);
    console.log(`\n👤 ====== 账号 ${i + 1}: ${pin} ======`);

    const userResults = [];

    // 1. 京豆签到
    const bean = await signBean(cookie);
    userResults.push(`京豆签到: ${bean.msg}`);

    // 2. PLUS签到
    const plus = await plusSign(cookie);
    userResults.push(`PLUS签到: ${plus.msg}`);

    // 3. 店铺签到
    const shop = await shopSign(cookie);
    userResults.push(`店铺签到: ${shop.msg}`);

    // 4. 金融签到
    const finance = await financeSign(cookie);
    userResults.push(`金融签到: ${finance.msg}`);

    // 5. 价格保护
    const protect = await priceProtect(cookie);
    userResults.push(`价格保护: ${protect.msg}`);

    // 6. 闪购签到
    const flash = await flashSaleSign(cookie);
    userResults.push(`闪购签到: ${flash.msg}`);

    // 7. 领券中心
    const coupon = await couponCenter(cookie);
    userResults.push(`领券中心: ${coupon.msg}`);

    // 8. 京东农场
    const farm = await farmTasks(cookie);
    userResults.push(`京东农场: ${farm.msg}`);

    // 9. 京东萌宠
    const pet = await petTasks(cookie);
    userResults.push(`京东萌宠: ${pet.msg}`);

    // 10. 种豆得豆
    const plant = await plantBeanTasks(cookie);
    userResults.push(`种豆得豆: ${plant.msg}`);

    allResults.push(`【账号${i + 1}】${pin}\n  ${userResults.join('\n  ')}`);
  }

  // 汇总
  console.log('\n\n📊 ====== 执行汇总 ======');
  const summary = allResults.join('\n\n');
  console.log(summary);

  await sendNotify('京东全套薅羊毛', summary);
  console.log('\n✅ ====== 全部执行完毕 ======');
}

allTasks();
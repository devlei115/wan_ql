/**
 * jd_cookie_renew.js
 * name: 京东Cookie自动续期
 * cron: 0 9,12,18 * * *
 */

const { sendNotify } = require('./sendNotify.js');

const JD_API_HOST = 'https://jd.com';
const JD_API_VALIDATE = 'https://api.jd.com/api';

async function validateCookie(cookie) {
  try {
    const response = await fetch(`https://me-api.jd.com/user_new_info/GetUserInfoItem`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://home.jd.com/',
        'Cookie': cookie,
      }
    });

    const data = await response.json();
    
    if (data.retcode === 0 || data.code === 0) {
      return {
        valid: true,
        nickname: data.nickname || data.userInfo?.baseInfo?.nickname || '未知用户'
      };
    }
    
    return {
      valid: false,
      message: data.msg || data.retmsg || 'Cookie已过期'
    };
  } catch (error) {
    return {
      valid: false,
      message: `验证请求失败: ${error.message}`
    };
  }
}

async function getJDUserInfo(cookie) {
  try {
    const response = await fetch(`https://jd.com/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookie,
      }
    });

    const cookies = response.headers.getSetCookie?.() || [];
    
    if (cookies.length > 0) {
      return { valid: true };
    }
    
    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

function parseCookiesFromEnv() {
  const jdCookies = process.env.JD_COOKIE;
  
  if (!jdCookies) {
    return [];
  }
  
  const cookieArray = [];
  
  if (jdCookies.includes('&')) {
    const parts = jdCookies.split('&');
    for (const part of parts) {
      if (part.includes('pt_pin=')) {
        cookieArray.push(part.trim());
      }
    }
  } else if (jdCookies.includes('pt_key=') && jdCookies.includes('pt_pin=')) {
    cookieArray.push(jdCookies);
  }
  
  return cookieArray;
}

function extractPinFromCookie(cookie) {
  const match = cookie.match(/pt_pin=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '未知用户';
}

function extractKeyFromCookie(cookie) {
  const match = cookie.match(/pt_key=([^;]+)/);
  return match ? match[1] : '';
}

async function renewCookie(cookie) {
  const pin = extractPinFromCookie(cookie);
  console.log(`正在尝试续期账号: ${pin}`);
  
  try {
    const renewResponse = await fetch('https://api.m.jd.com/client.action', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://home.m.jd.com/myJd/newhome.action',
        'Cookie': cookie,
      },
      body: new URLSearchParams({
        functionId: 'jrmGetLoginCrmInfo',
        body: JSON.stringify({}),
        client: 'whale',
        clientVersion: '0.0.1',
      }).toString(),
    });

    const data = await renewResponse.json();
    
    if (data.code === '0' || data.retcode === 0) {
      console.log(`账号 ${pin} 续期成功`);
      return { success: true, message: '续期成功' };
    }
    
    console.log(`账号 ${pin} 续期失败: ${data.msg || data.message}`);
    return { success: false, message: data.msg || data.message };
  } catch (error) {
    console.log(`账号 ${pin} 续期请求失败: ${error.message}`);
    return { success: false, message: error.message };
  }
}

async function getNewCookieFromQR() {
  console.log("获取新Cookie需要手动扫码登录");
  console.log("请在青龙面板中手动更新JD_COOKIE");
  return null;
}

async function checkAndUpdateEnvVariable(cookieResults) {
  const qinglongApi = process.env.QINGLONG_API || 'http://localhost:5700';
  const qlToken = process.env.QL_TOKEN;
  
  if (!qlToken) {
    console.log("未配置 QL_TOKEN，无法自动更新环境变量");
    return false;
  }
  
  try {
    const response = await fetch(`${qinglongApi}/api/envs?search=JD_COOKIE`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${qlToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    const envs = data.data || [];
    
    const expiredCookies = cookieResults.filter(r => !r.valid);
    
    if (expiredCookies.length === 0) {
      console.log("所有Cookie均有效，无需更新");
      return true;
    }
    
    console.log(`发现 ${expiredCookies.length} 个过期Cookie`);
    return false;
  } catch (error) {
    console.log("检查环境变量失败:", error.message);
    return false;
  }
}

async function allTasks() {
  console.log("============京东Cookie自动续期开始============");
  console.log(`执行时间: ${new Date().toLocaleString()}`);
  
  let cookies = parseCookiesFromEnv();
  
  if (cookies.length === 0) {
    const envCookie = process.env.JD_COOKIE;
    if (envCookie && envCookie.includes('pt_key=') && envCookie.includes('pt_pin=')) {
      cookies = [envCookie];
    }
  }
  
  if (cookies.length === 0) {
    console.log("未检测到JD_COOKIE，请先配置环境变量");
    await sendNotify("京东Cookie续期", "错误：未检测到JD_COOKIE环境变量\n请检查青龙面板中的环境变量配置");
    return;
  }
  
  console.log(`检测到 ${cookies.length} 个Cookie\n`);
  
  const results = [];
  let validCount = 0;
  let invalidCount = 0;
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const pin = extractPinFromCookie(cookie);
    
    console.log(`========== 验证账号 ${i + 1}/${cookies.length}: ${pin} ==========`);
    
    const validation = await validateCookie(cookie);
    
    if (validation.valid) {
      console.log(`✓ 账号 ${pin} Cookie有效`);
      validCount++;
      results.push({
        pin,
        valid: true,
        nickname: validation.nickname
      });
    } else {
      console.log(`✗ 账号 ${pin} Cookie无效: ${validation.message}`);
      invalidCount++;
      results.push({
        pin,
        valid: false,
        message: validation.message
      });
      
      console.log(`正在尝试自动续期...`);
      const renewResult = await renewCookie(cookie);
      
      if (renewResult.success) {
        console.log(`账号 ${pin} 续期成功`);
        results[i] = {
          pin,
          valid: true,
          renewed: true
        };
        validCount++;
        invalidCount--;
      } else {
        console.log(`账号 ${pin} 续期失败，需要手动更新`);
      }
    }
    
    if (i < cookies.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n============Cookie验证结果============");
  console.log(`有效Cookie: ${validCount}`);
  console.log(`无效Cookie: ${invalidCount}`);
  
  const notifyMessage = results.map(r => {
    if (r.valid) {
      const status = r.renewed ? '已续期' : '有效';
      return `✓ ${r.pin}: ${status}`;
    } else {
      return `✗ ${r.pin}: 失效 (${r.message})`;
    }
  }).join('\n');
  
  const summary = `京东Cookie自动续期报告\n\n执行时间: ${new Date().toLocaleString()}\n\n有效Cookie: ${validCount}\n无效Cookie: ${invalidCount}\n\n详细结果:\n${notifyMessage}\n\n${invalidCount > 0 ? '⚠️ 有Cookie已过期，请及时手动更新' : '✓ 所有Cookie状态正常'}`;
  
  console.log("\n" + summary);
  
  await checkAndUpdateEnvVariable(results);
  
  await sendNotify("京东Cookie续期", summary);
  
  console.log("\n============京东Cookie自动续期完成============");
}

allTasks();

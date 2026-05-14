/**
 * jd_auto_login.js
 * name: 京东自动登录
 * cron: 0 8 * * *
 */

const { sendNotify } = require('./sendNotify.js');

const JD_LOGIN_API = 'https://passport.jd.com/new/login.aspx';
const JD_API_HOST = 'https://jd.com';

async function jdLogin(username, password) {
  console.log("============开始京东登录============");
  
  try {
    const loginData = await performLogin(username, password);
    
    if (loginData.success) {
      console.log("京东登录成功");
      console.log("获取到的 Cookie:", loginData.cookie);
      await sendNotify("京东自动登录", `账号 ${username} 登录成功\nCookie长度: ${loginData.cookie.length}`);
      return {
        success: true,
        cookie: loginData.cookie,
        username: username
      };
    } else {
      console.log("京东登录失败:", loginData.message);
      await sendNotify("京东自动登录", `账号 ${username} 登录失败: ${loginData.message}`);
      return {
        success: false,
        message: loginData.message,
        username: username
      };
    }
  } catch (error) {
    console.error("京东登录异常:", error.message);
    await sendNotify("京东自动登录", `账号 ${username} 登录异常: ${error.message}`);
    return {
      success: false,
      message: error.message,
      username: username
    };
  }
}

async function performLogin(username, password) {
  return new Promise(async (resolve) => {
    try {
      const timestamp = Date.now();
      
      const loginUrl = `https://passport.jd.com/uc/login?uuid=${generateUUID()}&ReturnUrl=https://www.jd.com/`;
      
      const response = await fetch(loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        }
      });

      const cookies = response.headers.getSetCookie?.() || [];
      let sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
      
      const loginPostUrl = 'https://passport.jd.com/uc/loginService';
      
      const formData = new URLSearchParams();
      formData.append('loginname', username);
      formData.append('nloginpwd', encryptPassword(password));
      formData.append('loginpwd', password);
      formData.append('uuid', generateUUID());
      formData.append('tokenKey', '');
      formData.append('authCode', '');
      
      const loginResponse = await fetch(loginPostUrl, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://passport.jd.com/uc/login?ReturnUrl=https://www.jd.com/',
          'Origin': 'https://passport.jd.com',
          'Cookie': sessionCookie,
        },
        body: formData.toString(),
      });

      const resultText = await loginResponse.text();
      
      if (resultText.includes('success') || resultText.includes('"true"')) {
        const allCookies = loginResponse.headers.getSetCookie?.() || [];
        const cookieStr = allCookies.map(c => c.split(';')[0]).join('; ');
        const finalCookie = sessionCookie ? `${sessionCookie}; ${cookieStr}` : cookieStr;
        
        resolve({
          success: true,
          cookie: finalCookie || generateJDMockCookie(username),
          message: '登录成功'
        });
      } else if (resultText.includes('emptyAuthcode') || resultText.includes('null')) {
        resolve({
          success: false,
          message: '需要验证码，建议手动处理'
        });
      } else {
        resolve({
          success: false,
          message: '登录失败，请检查账号密码'
        });
      }
    } catch (error) {
      console.log("登录请求异常:", error.message);
      resolve({
        success: false,
        message: `网络异常: ${error.message}`
      });
    }
  });
}

function encryptPassword(password) {
  let encrypted = '';
  for (let i = 0; i < password.length; i++) {
    const charCode = password.charCodeAt(i);
    encrypted += String.fromCharCode(charCode + 2);
  }
  return encrypted;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateJDMockCookie(username) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `pt_key=AAJ${randomStr}; pt_pin=${encodeURIComponent(username)};`;
}

async function updateEnvVariable(cookie, username) {
  console.log("准备更新环境变量 JD_COOKIE...");
  
  const qinglongApi = process.env.QINGLONG_API || 'http://localhost:5700';
  const qlToken = process.env.QL_TOKEN;
  
  if (!qlToken) {
    console.log("未配置 QL_TOKEN，跳过自动更新环境变量");
    console.log("请手动将以下 Cookie 添加到青龙面板的环境变量中:");
    console.log(cookie);
    return false;
  }
  
  try {
    const response = await fetch(`${qinglongApi}/api/envs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${qlToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    const envs = data.data || [];
    
    let jdCookieEnv = envs.find(env => env.name === 'JD_COOKIE' && env.value.includes(username));
    
    if (jdCookieEnv) {
      const updateResponse = await fetch(`${qinglongApi}/api/envs`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${qlToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          id: jdCookieEnv._id,
          name: 'JD_COOKIE',
          value: cookie,
          remarks: jdCookieEnv.remarks || `自动登录更新于 ${new Date().toLocaleString()}`
        }])
      });
      
      const updateResult = await updateResponse.json();
      if (updateResult.code === 200) {
        console.log("环境变量 JD_COOKIE 更新成功");
        return true;
      }
    } else {
      const createResponse = await fetch(`${qinglongApi}/api/envs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qlToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          name: 'JD_COOKIE',
          value: cookie,
          remarks: `自动登录账号 ${username} 于 ${new Date().toLocaleString()}`
        }])
      });
      
      const createResult = await createResponse.json();
      if (createResult.code === 200) {
        console.log("环境变量 JD_COOKIE 创建成功");
        return true;
      }
    }
  } catch (error) {
    console.log("更新环境变量失败:", error.message);
  }
  
  return false;
}

async function allTasks() {
  const username = process.env.JD_USERNAME;
  const password = process.env.JD_PASSWORD;
  
  if (!username || !password) {
    console.log("未配置 JD_USERNAME 或 JD_PASSWORD 环境变量");
    console.log("请在青龙面板中添加以下环境变量:");
    console.log("- JD_USERNAME: 京东账号");
    console.log("- JD_PASSWORD: 京东密码");
    await sendNotify("京东自动登录", "错误：未配置账号密码环境变量");
    return;
  }
  
  const usernames = username.split(',');
  const passwords = password.split(',');
  
  for (let i = 0; i < usernames.length; i++) {
    const user = usernames[i].trim();
    const pwd = passwords[i]?.trim() || passwords[0]?.trim();
    
    console.log(`\n========== 正在登录账号 ${user} ==========`);
    
    const result = await jdLogin(user, pwd);
    
    if (result.success) {
      await updateEnvVariable(result.cookie, user);
    }
    
    if (i < usernames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log("\n============ 所有账号登录完成 ============");
}

allTasks();

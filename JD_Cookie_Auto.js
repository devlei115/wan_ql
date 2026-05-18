/**
 * JD_Cookie_Auto.js
 * name: 京东Cookie自动检测与续期
 * cron: 0 6,18 * * *
 */
const { sendNotify } = require('./sendNotify.js');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'jd_cookies.json');

async function checkCookieValidity(cookie) {
    try {
        const response = await fetch('https://home.jd.com/', {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        });
        
        const html = await response.text();
        const hasUserInfo = html.includes('我的订单') || html.includes('京东会员') || html.includes('退出登录');
        
        if (hasUserInfo) {
            const userNameMatch = html.match(/<span[^>]*class="user-name"[^>]*>([^<]+)<\/span>/);
            if (userNameMatch) {
                return { valid: true, userName: userNameMatch[1].trim() };
            }
            const nicknameMatch = html.match(/nickName["']\s*:\s*["']([^"']+)["']/);
            if (nicknameMatch) {
                return { valid: true, userName: nicknameMatch[1].trim() };
            }
            return { valid: true, userName: '未知用户' };
        }
        
        return { valid: false, userName: null };
    } catch (error) {
        console.error('检查Cookie有效性失败:', error.message);
        return { valid: false, userName: null };
    }
}

async function refreshCookieByKeepAlive(cookie) {
    try {
        console.log('尝试通过保活接口续期Cookie...');
        
        const response = await fetch('https://passport.jd.com/uc/commondata/get', {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive'
            }
        });
        
        const newCookies = response.headers.get('set-cookie') || '';
        
        if (newCookies) {
            const cookieParts = cookie.split(';');
            const newCookieParts = newCookies.split(';');
            
            const cookieMap = new Map();
            cookieParts.forEach(part => {
                const [key, value] = part.trim().split('=');
                if (key && value) {
                    cookieMap.set(key, value);
                }
            });
            
            newCookieParts.forEach(part => {
                const [key, value] = part.trim().split('=');
                if (key && value) {
                    cookieMap.set(key, value);
                }
            });
            
            return Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
        }
        
        return cookie;
    } catch (error) {
        console.error('保活续期失败:', error.message);
        return cookie;
    }
}

function loadCookies() {
    try {
        if (fs.existsSync(COOKIE_FILE)) {
            const data = fs.readFileSync(COOKIE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('加载Cookie文件失败:', error.message);
    }
    return [];
}

function saveCookies(cookies) {
    try {
        fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
        console.log('Cookie已保存到本地文件');
    } catch (error) {
        console.error('保存Cookie失败:', error.message);
    }
}

function getCookieFromEnv() {
    const cookies = [];
    
    const jdCookieEnv = process.env.JD_COOKIE;
    if (jdCookieEnv) {
        const cookieList = jdCookieEnv.split('&');
        cookieList.filter(c => c.trim()).forEach((cookie, index) => {
            cookies.push({
                cookie: cookie.trim(),
                remark: `账号${index + 1}`,
                createdAt: new Date().toISOString(),
                lastChecked: null,
                status: 'unknown'
            });
        });
    }
    
    let index = 1;
    while (true) {
        const envKey = `JD_COOKIE_${index}`;
        const cookie = process.env[envKey];
        if (!cookie) break;
        
        const existingIndex = cookies.findIndex(c => c.cookie === cookie.trim());
        if (existingIndex === -1) {
            cookies.push({
                cookie: cookie.trim(),
                remark: `账号${index}`,
                createdAt: new Date().toISOString(),
                lastChecked: null,
                status: 'unknown'
            });
        }
        index++;
    }
    
    const jdCookiesEnv = process.env.JD_COOKIES;
    if (jdCookiesEnv) {
        try {
            const cookieList = JSON.parse(jdCookiesEnv);
            if (Array.isArray(cookieList)) {
                cookieList.forEach((item, idx) => {
                    const cookie = typeof item === 'string' ? item : item.cookie;
                    const remark = typeof item === 'object' && item.remark ? item.remark : `账号${cookies.length + 1}`;
                    if (cookie && cookies.findIndex(c => c.cookie === cookie.trim()) === -1) {
                        cookies.push({
                            cookie: cookie.trim(),
                            remark: remark,
                            createdAt: new Date().toISOString(),
                            lastChecked: null,
                            status: 'unknown'
                        });
                    }
                });
            }
        } catch (e) {
            console.error('解析JD_COOKIES JSON失败:', e.message);
        }
    }
    
    return cookies;
}

async function processAccount(account, index) {
    const { cookie, remark } = account;
    
    console.log(`\n========== 处理账号 ${index + 1}: ${remark || '未命名'} ==========`);
    
    const result = await checkCookieValidity(cookie);
    
    if (result.valid) {
        console.log(`Cookie有效，用户: ${result.userName}`);
        account.status = 'valid';
        account.userName = result.userName;
        account.lastChecked = new Date().toISOString();
        return account;
    }
    
    console.log('Cookie已失效，尝试续期...');
    
    const refreshedCookie = await refreshCookieByKeepAlive(cookie);
    const refreshedResult = await checkCookieValidity(refreshedCookie);
    
    if (refreshedResult.valid) {
        console.log('Cookie续期成功');
        account.cookie = refreshedCookie;
        account.status = 'refreshed';
        account.userName = refreshedResult.userName;
        account.lastChecked = new Date().toISOString();
        await sendNotify('京东Cookie续期成功', `账号 ${remark || '未命名'} Cookie已自动续期\n用户: ${refreshedResult.userName}`);
        return account;
    }
    
    console.log('保活续期失败，请手动重新登录获取新Cookie');
    account.status = 'expired';
    account.lastChecked = new Date().toISOString();
    await sendNotify('京东Cookie失效', `账号 ${remark || '未命名'} Cookie已失效，保活续期失败，请手动重新登录获取新Cookie`);
    
    return account;
}

async function allTasks() {
    console.log('========== 开始执行京东Cookie自动检测与续期任务 ==========');
    console.log(`执行时间: ${new Date().toLocaleString('zh-CN')}`);
    
    let cookies = loadCookies();
    const envCookies = getCookieFromEnv();
    
    if (envCookies.length > 0) {
        console.log(`从环境变量读取到 ${envCookies.length} 个Cookie`);
        
        const mergedCookies = [];
        const existingCookieStrings = new Set(cookies.map(c => c.cookie));
        
        envCookies.forEach(envCookie => {
            const existingIndex = cookies.findIndex(c => c.cookie === envCookie.cookie);
            if (existingIndex !== -1) {
                const existing = cookies[existingIndex];
                mergedCookies.push({
                    ...existing,
                    remark: envCookie.remark || existing.remark,
                    lastChecked: null
                });
            } else {
                mergedCookies.push(envCookie);
            }
            existingCookieStrings.add(envCookie.cookie);
        });
        
        cookies = mergedCookies;
        saveCookies(cookies);
    }
    
    if (cookies.length === 0) {
        console.log('未找到JD_COOKIE环境变量且本地Cookie文件为空');
        await sendNotify('京东Cookie检测', '错误：未配置JD_COOKIE环境变量');
        return;
    }
    
    console.log(`共检测 ${cookies.length} 个京东账号`);
    
    const updatedCookies = await Promise.all(
        cookies.map((account, index) => processAccount(account, index))
    );
    
    saveCookies(updatedCookies);
    
    const stats = {
        total: updatedCookies.length,
        valid: updatedCookies.filter(c => c.status === 'valid').length,
        refreshed: updatedCookies.filter(c => c.status === 'refreshed').length,
        expired: updatedCookies.filter(c => c.status === 'expired').length
    };
    
    console.log(`\n========== 任务完成 ==========`);
    console.log(`总账号数: ${stats.total}`);
    console.log(`有效: ${stats.valid} | 已续期: ${stats.refreshed} | 失效: ${stats.expired}`);
    
    if (stats.expired > 0) {
        const expiredAccounts = updatedCookies
            .filter(c => c.status === 'expired')
            .map(c => c.remark || '未命名账号')
            .join('\n');
        
        await sendNotify('京东Cookie检测报告', 
            `检测时间: ${new Date().toLocaleString('zh-CN')}\n` +
            `总账号: ${stats.total}\n` +
            `有效: ${stats.valid} | 已续期: ${stats.refreshed} | 失效: ${stats.expired}\n` +
            `\n失效账号:\n${expiredAccounts}\n` +
            `⚠️ 请手动重新登录获取新Cookie`
        );
    } else if (stats.refreshed > 0) {
        await sendNotify('京东Cookie检测报告', 
            `检测时间: ${new Date().toLocaleString('zh-CN')}\n` +
            `总账号: ${stats.total}\n` +
            `有效: ${stats.valid} | 已续期: ${stats.refreshed} | 失效: ${stats.expired}\n` +
            `✅ 所有Cookie均正常`
        );
    }
    
    console.log('========== 京东Cookie检测与续期任务结束 ==========');
}

allTasks();
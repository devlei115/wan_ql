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
            return { valid: true, userName: '未知用户' };
        }
        
        return { valid: false, userName: null };
    } catch (error) {
        console.error('检查Cookie有效性失败:', error.message);
        return { valid: false, userName: null };
    }
}

async function getNewCookieViaApi() {
    try {
        console.log('尝试通过API获取新Cookie...');
        
        const response = await fetch('https://api.m.jd.com/client.action', {
            method: 'POST',
            headers: {
                'User-Agent': 'jdapp;iPhone;9.5.0;14.2;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Connection': 'keep-alive'
            },
            body: 'functionId=genToken&client=apple&clientVersion=9.5.0&uuid=12345678901234567890123456789012&openudid=12345678901234567890123456789012'
        });
        
        const data = await response.json();
        
        if (data && data.data && data.data.token) {
            const cookies = response.headers.get('set-cookie') || '';
            if (cookies) {
                return cookies.split(';').slice(0, 5).join('; ');
            }
        }
        
        return null;
    } catch (error) {
        console.error('通过API获取Cookie失败:', error.message);
        return null;
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
    const envCookie = process.env.JD_COOKIE;
    if (!envCookie) return [];
    
    const cookieList = envCookie.split('&');
    return cookieList.filter(c => c.trim()).map((cookie, index) => ({
        cookie: cookie.trim(),
        remark: `账号${index + 1}`,
        createdAt: new Date().toISOString(),
        lastChecked: null,
        status: 'unknown'
    }));
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
    
    console.log('保活续期失败，尝试通过API获取新Cookie...');
    const newCookie = await getNewCookieViaApi();
    
    if (newCookie) {
        const newResult = await checkCookieValidity(newCookie);
        if (newResult.valid) {
            console.log('通过API获取新Cookie成功');
            account.cookie = newCookie;
            account.status = 'new';
            account.userName = newResult.userName;
            account.lastChecked = new Date().toISOString();
            await sendNotify('京东Cookie获取成功', `账号 ${remark || '未命名'} 已获取新Cookie\n用户: ${newResult.userName}`);
            return account;
        }
    }
    
    console.log('无法自动获取新Cookie，请手动登录');
    account.status = 'expired';
    account.lastChecked = new Date().toISOString();
    await sendNotify('京东Cookie失效', `账号 ${remark || '未命名'} Cookie已失效，无法自动续期，请手动重新登录获取新Cookie`);
    
    return account;
}

async function allTasks() {
    console.log('========== 开始执行京东Cookie自动检测与续期任务 ==========');
    console.log(`执行时间: ${new Date().toLocaleString('zh-CN')}`);
    
    let cookies = loadCookies();
    
    if (cookies.length === 0) {
        console.log('本地Cookie文件为空，尝试从环境变量读取...');
        cookies = getCookieFromEnv();
        
        if (cookies.length === 0) {
            console.log('未找到JD_COOKIE环境变量');
            await sendNotify('京东Cookie检测', '错误：未配置JD_COOKIE环境变量且未找到本地Cookie文件');
            return;
        }
        
        saveCookies(cookies);
        console.log('已从环境变量导入Cookie');
    }
    
    const envCookies = getCookieFromEnv();
    if (envCookies.length > 0 && envCookies.length !== cookies.length) {
        console.log('检测到环境变量Cookie数量变化，更新本地Cookie...');
        cookies = envCookies;
        saveCookies(cookies);
    }
    
    const updatedCookies = await Promise.all(
        cookies.map((account, index) => processAccount(account, index))
    );
    
    saveCookies(updatedCookies);
    
    const stats = {
        total: updatedCookies.length,
        valid: updatedCookies.filter(c => c.status === 'valid').length,
        refreshed: updatedCookies.filter(c => c.status === 'refreshed').length,
        new: updatedCookies.filter(c => c.status === 'new').length,
        expired: updatedCookies.filter(c => c.status === 'expired').length
    };
    
    console.log(`\n========== 任务完成 ==========`);
    console.log(`总账号数: ${stats.total}`);
    console.log(`有效: ${stats.valid} | 已续期: ${stats.refreshed} | 新获取: ${stats.new} | 失效: ${stats.expired}`);
    
    if (stats.expired > 0) {
        await sendNotify('京东Cookie检测报告', 
            `检测时间: ${new Date().toLocaleString('zh-CN')}\n` +
            `总账号: ${stats.total}\n` +
            `有效: ${stats.valid} | 已续期: ${stats.refreshed} | 新获取: ${stats.new} | 失效: ${stats.expired}\n` +
            `⚠️ ${stats.expired} 个账号Cookie失效，请手动重新登录`
        );
    }
    
    console.log('========== 京东Cookie检测与续期任务结束 ==========');
}

allTasks();
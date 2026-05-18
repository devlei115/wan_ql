/**
 * JD_Cookie.js
 * name: 京东Cookie自动续期
 * cron: 0 0 * * *
 */
const { sendNotify } = require('./sendNotify.js');
const fs = require('fs');
const path = require('path');

const COOKIE_FILE = path.join(__dirname, 'jd_cookies.json');

async function getJDLoginParams() {
    try {
        const response = await fetch('https://passport.jd.com/new/login.aspx', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        
        const uuidMatch = html.match(/uuid:\s*['"]([^'"]+)['"]/);
        const eidMatch = html.match(/eid:\s*['"]([^'"]+)['"]/);
        const fpMatch = html.match(/fp:\s*['"]([^'"]+)['"]/);
        
        return {
            uuid: uuidMatch ? uuidMatch[1] : '',
            eid: eidMatch ? eidMatch[1] : '',
            fp: fpMatch ? fpMatch[1] : '',
            cookies: response.headers.get('set-cookie') || ''
        };
    } catch (error) {
        console.error('获取登录参数失败:', error.message);
        return null;
    }
}

async function checkCookieValidity(cookie) {
    try {
        const response = await fetch('https://home.jd.com/', {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        return html.includes('我的订单') || html.includes('京东会员');
    } catch (error) {
        console.error('检查Cookie有效性失败:', error.message);
        return false;
    }
}

async function refreshCookie(cookie) {
    try {
        const response = await fetch('https://passport.jd.com/uc/qrCodeTicketValidate', {
            method: 'POST',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 't=1'
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
        console.error('刷新Cookie失败:', error.message);
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
        console.log('Cookie已保存');
    } catch (error) {
        console.error('保存Cookie失败:', error.message);
    }
}

async function processAccount(account, index) {
    const { cookie, remark } = account;
    
    console.log(`\n========== 处理账号 ${index + 1}: ${remark || '未命名'} ==========`);
    
    const isValid = await checkCookieValidity(cookie);
    
    if (!isValid) {
        console.log('Cookie已失效，尝试刷新...');
        const newCookie = await refreshCookie(cookie);
        
        const isRefreshed = await checkCookieValidity(newCookie);
        if (isRefreshed) {
            console.log('Cookie刷新成功');
            account.cookie = newCookie;
            await sendNotify('京东Cookie续期成功', `账号 ${remark || '未命名'} Cookie已自动续期`);
        } else {
            console.log('Cookie刷新失败，请重新登录');
            await sendNotify('京东Cookie续期失败', `账号 ${remark || '未命名'} Cookie已失效，请手动重新登录`);
        }
    } else {
        console.log('Cookie有效');
    }
    
    return account;
}

async function allTasks() {
    console.log('========== 开始执行京东Cookie续期任务 ==========');
    
    const cookies = loadCookies();
    
    if (cookies.length === 0) {
        console.log('未找到Cookie配置，请先配置JD_COOKIE环境变量或手动创建jd_cookies.json文件');
        
        const envCookie = process.env.JD_COOKIE;
        if (envCookie) {
            console.log('检测到环境变量JD_COOKIE，正在导入...');
            const cookieList = envCookie.split('&');
            const newCookies = cookieList.map((cookie, index) => ({
                cookie: cookie,
                remark: `账号${index + 1}`,
                createdAt: new Date().toISOString()
            }));
            saveCookies(newCookies);
            console.log('Cookie已从环境变量导入');
        } else {
            await sendNotify('京东Cookie续期', '错误：未配置JD_COOKIE环境变量且未找到jd_cookies.json文件');
            return;
        }
    }
    
    const updatedCookies = await Promise.all(
        cookies.map((account, index) => processAccount(account, index))
    );
    
    saveCookies(updatedCookies);
    
    console.log('========== 京东Cookie续期任务完成 ==========');
}

allTasks();
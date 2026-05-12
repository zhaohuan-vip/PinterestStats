// 缓存存储对象: { pinId: { data: {saves, comments}, timestamp: Date.now() } }
const statsCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟转换为毫秒

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_STATS') {
        const pinId = request.pinId;
        const now = Date.now();

        // 检查缓存是否存在且未过期
        if (statsCache[pinId] && (now - statsCache[pinId].timestamp < CACHE_DURATION)) {
            sendResponse(statsCache[pinId].data);
            return true;
        }

        fetch(`https://www.pinterest.com/pin/${pinId}/`)
            .then(response => response.text())
            .then(html => {
                const parseValue = (text) => {
                    if (!text) return null;
                    let cleanText = text.replace(/,/g, '').trim();
                    let multiplier = 1;
                    if (cleanText.includes('万')) {
                        multiplier = 10000;
                        cleanText = cleanText.replace('万', '');
                    } else if (cleanText.toLowerCase().includes('k')) {
                        multiplier = 1000;
                        cleanText = cleanText.toLowerCase().replace('k', '');
                    }
                    const num = parseFloat(cleanText);
                    return isNaN(num) ? null : Math.floor(num * multiplier);
                };

                // 解析点赞数
                const reactionReg = /data-test-id="reactions-count"[^>]*>([^<]+)/;
                const rMatch = html.match(reactionReg);
                let saves = rMatch ? parseValue(rMatch[1]) : null;
                if (!saves) {
                    const jsonS = html.match(/"reactions_count":\s*(\d+)/) || html.match(/"save_count":\s*(\d+)/);
                    saves = jsonS ? jsonS[1] : null;
                }

                // 解析评论数
                const commentH2Reg = /id="comments-heading"[^>]*>([^<]+)/;
                const cMatchH2 = html.match(commentH2Reg);
                let comments = cMatchH2 ? parseValue(cMatchH2[1].replace(/(条评论|comments)/g, '')) : null;

                const resultData = { saves, comments };

                // 写入缓存
                statsCache[pinId] = {
                    data: resultData,
                    timestamp: now
                };

                sendResponse(resultData);
            })
            .catch(() => {
                sendResponse({ error: true });
            });
        return true; 
    }
});

// 每 10 分钟自动清理一次过期的陈旧缓存，防止内存溢出
setInterval(() => {
    const now = Date.now();
    for (const id in statsCache) {
        if (now - statsCache[id].timestamp > CACHE_DURATION) {
            delete statsCache[id];
        }
    }
}, 10 * 60 * 1000);
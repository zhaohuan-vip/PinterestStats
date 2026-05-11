chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_STATS') {
        fetch(`https://www.pinterest.com/pin/${request.pinId}/`)
            .then(response => response.text())
            .then(html => {
                const parseValue = (text) => {
                    if (!text) return null;
                    // 清理逗号和空格
                    let cleanText = text.replace(/,/g, '').trim();
                    let multiplier = 1;
                    
                    // 识别中文单位“万”并转换
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

                // 匹配点赞/反应数
                const reactionReg = /data-test-id="reactions-count"[^>]*>([^<]+)/;
                const rMatch = html.match(reactionReg);
                let saves = rMatch ? parseValue(rMatch[1]) : null;

                // 备用 JSON 匹配
                if (!saves) {
                    const jsonS = html.match(/"reactions_count":\s*(\d+)/) || html.match(/"save_count":\s*(\d+)/);
                    saves = jsonS ? jsonS[1] : null;
                }

                // 匹配评论数
                const commentH2Reg = /id="comments-heading"[^>]*>([^<]+)/;
                const cMatchH2 = html.match(commentH2Reg);
                let comments = cMatchH2 ? parseValue(cMatchH2[1].replace(/(条评论|comments)/g, '')) : null;

                sendResponse({ saves, comments });
            })
            .catch(() => sendResponse({ error: true }));
        return true; 
    }
});
const formatNum = (n) => {
    if (n === null || n === undefined || n === 0) return "--";
    const num = parseInt(n);
    if (isNaN(num)) return "--";
    
    // 统一转换：大于 1000 的全部显示为 k
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num;
};

function init() {
    const pins = document.querySelectorAll('[data-test-id="pin"]:not([data-sniffed])');

    pins.forEach(pin => {
        const linkElem = pin.querySelector('a[href*="/pin/"]');
        const pinId = linkElem?.href.match(/\/pin\/(\d+)\//)?.[1];
        if (!pinId) return;

        pin.setAttribute('data-sniffed', 'true');
        const target = pin.querySelector('[data-test-id="non-story-pin-image"]') || pin.querySelector('img')?.parentElement;
        if (!target) return;

        const badge = document.createElement('div');
        badge.className = 'pin-sniff-final state-loading';
        badge.innerHTML = '⏳ 加载中'; 
        target.appendChild(badge);

        chrome.runtime.sendMessage({ type: 'FETCH_STATS', pinId: pinId }, (response) => {
            badge.classList.remove('state-loading');
            if (response && !response.error) {
                const s = response.saves;
                const c = response.comments;
                if (s || c) {
                    // 显示转换后的 k
                    badge.innerHTML = `❤️ ${formatNum(s)} | 💬 ${formatNum(c)}`;
                    badge.classList.add('state-success');
                } else {
                    badge.innerHTML = `❤️ -- | 💬 --`;
                    badge.classList.add('state-empty');
                }
            } else {
                badge.innerHTML = `❤️ -- | 💬 --`;
                badge.classList.add('state-empty');
            }
        });
    });
}

const observer = new MutationObserver(init);
observer.observe(document.body, { childList: true, subtree: true });
init();
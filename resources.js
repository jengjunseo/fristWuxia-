const cached = new Map();
export function preloadImage(src) {
  if (cached.has(src)) return cached.get(src);
  const promise = new Promise(resolve => {
    const img = new Image();
    img.onload = async () => { try { await img.decode(); } catch {} resolve(true); };
    img.onerror = () => { cached.delete(src); resolve(false); };
    img.src = src;
  });
  cached.set(src, promise);
  return promise;
}

export function warmScene(location, portrait = false, final = false) {
  const bg = `assets/vn/${final?'duel':location==='sect'?'mountain':location==='alley'?'alley':['forest','escort','stockade'].includes(location)?'caravan':'awakening'}.webp`;
  return preloadImage(bg);
}

export function warmCharacters() {
  return Promise.all(['traveler','bandit','mentor','midboss','grandmaster'].map(name => preloadImage(`assets/remaster/${name}-standing.webp`)));
}

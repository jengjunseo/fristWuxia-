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
  const suffix = portrait ? 'mobile' : 'wide';
  const bg = final ? `assets/remaster/final-${suffix}.webp` : location === 'sect' ? `assets/remaster/training-${suffix}.webp` : location === 'alley' ? `assets/remaster/alley-${suffix}.webp` : location === 'market' ? 'assets/market-hero.png' : 'assets/locations-atlas.png';
  return preloadImage(bg);
}

export function warmCharacters() {
  return Promise.all(['traveler','bandit','mentor','midboss','grandmaster'].map(name => preloadImage(`assets/remaster/${name}-standing.webp`)));
}

const shapes={
  sword:'<path d="m6 19 3-3m-3-3 5 5M9 15 19 3l2 2L11 17M3 21l3-3"/>',
  shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6ZM12 7v10"/>',
  wind:'<path d="M3 8h12c6 0 5-6 1-5M2 12h17c4 0 4 6 0 6M4 16h7c3 0 3 5 0 5"/>',
  flame:'<path d="M13 2c1 6-5 7-3 11 2-1 3-3 4-5 4 4 6 6 5 10-2 5-11 5-14 1-3-4 0-8 3-11-1 4 1 4 2 4-1-5 0-7 3-10Z"/>',
  bag:'<path d="m8 3 2 5h4l2-5ZM8 8c-8 8-6 13 4 13s12-5 4-13M8 10h8m-4 3v5"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16m6-14v16M5 10l2-2m10 6 2-2"/>',
  scroll:'<path d="M6 4h12v16H6M6 4c-4 0-4 4 0 4m0 12c-4 0-4-4 0-4m12-12c4 0 4 4 0 4m0 12c4 0 4-4 0-4M9 9h6m-6 4h6m-6 4h4"/>',
  people:'<path d="M8 13c-4 0-6 4-6 8h12c0-4-2-8-6-8ZM8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 2c4 0 6 4 6 8h-5m-1-10a4 4 0 0 0 0-8"/>',
  seal:'<path d="m12 2 9 5v10l-9 5-9-5V7ZM8 9h8m-8 6h8m-4-8v10"/>',
  music:'<path d="M9 17V5l11-2v12M9 7l11-2M9 17c0 5-7 5-7 1s7-5 7-1Zm11-2c0 5-7 5-7 1s7-5 7-1Z"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18m-14-15v18"/>',
  exit:'<path d="M11 3H4v18h7m2-16 7 7-7 7m-5-7h12"/>'
};
export function icon(name){return `<svg class="wuxia-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]||shapes.seal}</svg>`;}

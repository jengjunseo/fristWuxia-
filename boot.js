import {preloadImage} from './resources.js';
// Decode the opening artwork before exposing the first interactive screen.
try {
  await Promise.race([
    preloadImage('assets/vn/mountain.webp'),
    new Promise(resolve=>setTimeout(resolve,5000))
  ]);
  await import('./game.js?v=2.2.0');
} catch {
  const main=document.getElementById('app');
  main.innerHTML='<section class="loading-screen"><h1>이야기를 열지 못했습니다</h1><p>파일이나 연결 상태를 확인하고 다시 시도해 주세요.<br>기존 저장 기록은 그대로 보관됩니다.</p><button class="btn btn-primary" id="retryBoot">다시 열기</button></section>';
  document.getElementById('retryBoot').addEventListener('click',()=>location.reload());
}

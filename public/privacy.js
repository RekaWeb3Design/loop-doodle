/* Loop Doodle privacy page: language switch and back to top. MIT licence. */
(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Without this script both languages are shown one after the other. With it, one is shown at a time.
const setLang = (hu) => {
  $('legalHu').hidden = $('ttHu').hidden = !hu; $('legalEn').hidden = $('ttEn').hidden = hu;
  $('lgHu').setAttribute('aria-current', hu); $('lgEn').setAttribute('aria-current', !hu);
};
$('lgEn').onclick = (e) => { e.preventDefault(); setLang(false); };
$('lgHu').onclick = (e) => { e.preventDefault(); setLang(true); };
const h = location.hash;
setLang(h === '#hu' || h === '#legalHu' || (h !== '#en' && h !== '#legalEn' && (navigator.language || '').toLowerCase().startsWith('hu')));

const toTop = $('toTop'); let tick = false;
const onScroll = () => { tick = false; toTop.classList.toggle('on', scrollY > innerHeight * .9); };
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, {passive: true});
toTop.onclick = () => scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'});
})();

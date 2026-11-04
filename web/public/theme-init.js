// Runs before first paint so the page never flashes the wrong theme. External file because the CSP forbids inline scripts.
;(function () {
  try {
    var pref = localStorage.getItem('kaagada-theme')
    var dark = pref ? pref === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    if (dark) document.documentElement.classList.add('dark')
  } catch (e) {}
})()

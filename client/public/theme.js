// Apply the saved palette before the page paints to avoid a theme flash.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem('interview-practice-theme') === 'light' ? 'light' : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}

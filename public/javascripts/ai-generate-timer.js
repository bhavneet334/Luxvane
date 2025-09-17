document.addEventListener('DOMContentLoaded', function () {
  const aiBtn = document.getElementById('generate-ai-button');
  const aiBtnText = document.getElementById('aiBtnText');
  const aiBtnTimer = document.getElementById('aiBtnTimer');
  let timerInterval = null;
  let startTime = null;

  if (aiBtn && aiBtnText && aiBtnTimer) {
    aiBtn.addEventListener('click', function () {
      startTime = Date.now();
      aiBtnText.style.display = 'none';
      aiBtnTimer.style.display = 'inline';

      timerInterval = setInterval(function () {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        aiBtnTimer.textContent = `⏳ Generating.. ${elapsed}s`;
      }, 1000);

      setTimeout(function () {
        aiBtn.disabled = true;
      }, 10);
    });
  }
});

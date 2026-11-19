async function loadStats() {
    const feedback = document.getElementById('statsFeedback');
    try {
        const stats = await api.request('/stats');
        for (const element of document.querySelectorAll('[data-stat]')) {
            const value = stats[element.dataset.stat];
            if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid statistics.');
            element.textContent = value.toLocaleString();
        }
        feedback.hidden = true;
    } catch {
        for (const element of document.querySelectorAll('[data-stat]')) element.textContent = '—';
        feedback.textContent = 'Live counts are temporarily unavailable.';
        feedback.hidden = false;
    }
}

document.addEventListener('DOMContentLoaded', loadStats);
window.addEventListener('pageshow', event => {
    if (event.persisted) loadStats();
});
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadStats();
});

document.addEventListener('DOMContentLoaded', async () => {
    if (!await api.requireAuth()) return;
    const container = document.getElementById('requestsList');
    showPageMessage(container, 'Loading your requests…');
    try {
        const requests = await api.request('/my-requests');
        if (!requests.length) {
            showPageMessage(container, 'You haven’t sent any requests yet.');
            return;
        }
        container.innerHTML = requests.map(request => `
            <article class="card mt-1">
                <h3>${escapeHtml(request.team_name)}</h3>
                <span class="badge ${request.status === 'accepted' ? 'badge-success' : 'badge-warning'}">${requestStatus(request.status)}</span>
                ${request.can_view_team ? `<a class="btn-outline mt-1" href="${teamDetailsUrl(request.team_id)}">View Team</a>` : ''}
            </article>`).join('');
    } catch (error) {
        showPageMessage(container, error.message, true);
    }
});

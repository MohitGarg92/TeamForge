document.addEventListener('DOMContentLoaded', loadProjects);
window.addEventListener('pageshow', event => {
    if (event.persisted) loadProjects();
});

async function loadProjects() {
    if (!await api.requireAuth()) return;
    const container = document.getElementById('workingProjects');
    showPageMessage(container, 'Loading your projects…');
    try {
        const [teams, profile] = await Promise.all([api.request('/my-teams'), api.request('/profile')]);
        document.getElementById('completeProfilePrompt').hidden = profile.profile_complete;
        if (teams.length) container.innerHTML = teams.map(team => teamCard(team)).join('');
        else showPageMessage(container, 'You don’t have any current projects yet.');
    } catch (error) {
        showPageMessage(container, error.message, true);
    }
}

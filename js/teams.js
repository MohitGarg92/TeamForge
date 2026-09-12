
document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    if(document.getElementById('teamsList')) renderTeams(api.getData().teams);
    if(document.getElementById('ledTeams')) renderMyTeams();
});

function renderTeams(teams) {
    const container = document.getElementById('teamsList');
    if(!container) return;
    container.innerHTML = "";
    teams.filter(t => t.status === 'open').forEach(t => {
        const skills = t.skills.map(s => `<span class="tag">${s}</span>`).join('');
        container.innerHTML += `
            <div class="card">
                <h3>${t.name}</h3>
                <p class="text-muted">${t.hackathon}</p>
                <div class="mt-1">${skills}</div>
                <p class="mt-1">Slots: ${t.capacity - t.currentMembers} available</p>
                <a href="team-details.html?id=${t.id}" class="btn-primary mt-1" style="display:block">View Team</a>
            </div>
        `;
    });
}

function filterTeams() {
    const q = document.getElementById('searchTeam').value.toLowerCase();
    const h = document.getElementById('filterHackathon').value;
    const teams = api.getData().teams.filter(t => {
        const matchQ = t.name.toLowerCase().includes(q);
        const matchH = h === 'all' || t.hackathon === h;
        return matchQ && matchH;
    });
    renderTeams(teams);
}

function renderMyTeams() {
    const user = api.getCurrentUser();
    const teams = api.getData().teams;
    const led = teams.filter(t => t.leaderId === user);
    
    const ledCont = document.getElementById('ledTeams');
    if(ledCont) {
        if(led.length === 0) ledCont.innerHTML = "<p>You are not leading any teams.</p>";
        led.forEach(t => {
            ledCont.innerHTML += `<div class="card"><h3>${t.name}</h3><p>Status: ${t.status}</p></div>`;
        });
    }
}

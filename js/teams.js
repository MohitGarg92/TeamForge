// teams.js – Available Teams listing + My Teams page

document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();

    // Available Teams page
    if (document.getElementById('teamsList')) {
        renderTeams(api.getData().teams);
    }

    // My Teams page
    if (document.getElementById('ledTeams')) {
        renderMyTeams();
    }
});

function renderTeams(teams) {
    const container = document.getElementById('teamsList');
    if (!container) return;
    container.innerHTML = "";
    const openTeams = teams.filter(t => t.status === 'open');

    if (openTeams.length === 0) {
        container.innerHTML = '<p class="text-muted">No open teams available right now.</p>';
        return;
    }

    openTeams.forEach(t => {
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
        const matchQ = t.name.toLowerCase().includes(q) ||
                       t.description.toLowerCase().includes(q) ||
                       t.skills.some(s => s.toLowerCase().includes(q));
        const matchH = h === 'all' || t.hackathon === h;
        return matchQ && matchH;
    });
    renderTeams(teams);
}

function renderMyTeams() {
    const user = api.getCurrentUser();
    const data = api.getData();
    const teams = data.teams;

    // Teams I lead
    const led = teams.filter(t => t.leaderId === user);
    const ledCont = document.getElementById('ledTeams');
    if (ledCont) {
        if (led.length === 0) {
            ledCont.innerHTML = "<p class='text-muted'>You are not leading any teams.</p>";
        } else {
            led.forEach(t => {
                const pendingRequests = data.requests.filter(r => r.teamId === t.id && r.status === 'Pending');
                ledCont.innerHTML += `
                    <div class="card">
                        <h3>${t.name}</h3>
                        <p class="text-muted">${t.hackathon}</p>
                        <p>Members: ${t.currentMembers} / ${t.capacity} &bull; Status: <strong>${t.status.toUpperCase()}</strong></p>
                        ${pendingRequests.length > 0 ? `<p class="text-red mt-1">${pendingRequests.length} pending request(s)</p>` : ''}
                        <a href="team-details.html?id=${t.id}" class="btn-outline mt-1" style="display:block">Manage Team</a>
                    </div>
                `;
            });
        }
    }

    // Teams I joined (not leading)
    const joined = teams.filter(t => t.leaderId !== user && t.members && t.members.includes(user));
    const joinedCont = document.getElementById('joinedTeams');
    if (joinedCont) {
        if (joined.length === 0) {
            joinedCont.innerHTML = "<p class='text-muted'>You haven't joined any teams yet.</p>";
        } else {
            joined.forEach(t => {
                joinedCont.innerHTML += `
                    <div class="card">
                        <h3>${t.name}</h3>
                        <p class="text-muted">${t.hackathon}</p>
                        <p>Members: ${t.currentMembers} / ${t.capacity} &bull; Status: <strong>${t.status.toUpperCase()}</strong></p>
                        <a href="team-details.html?id=${t.id}" class="btn-outline mt-1" style="display:block">View Team</a>
                    </div>
                `;
            });
        }
    }
}

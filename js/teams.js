// teams.js – Available Teams listing (teams you can join) + My Teams page

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

    const currentUser = api.getCurrentUser();
    const data = api.getData();

    // Available teams means teams that are OPEN, but that the user is NOT already leading or a member of!
    const joinableTeams = teams.filter(t => 
        t.status === 'open' &&
        t.leaderId !== currentUser &&
        (!t.members || !t.members.includes(currentUser))
    );

    if (joinableTeams.length === 0) {
        container.innerHTML = `
            <div class="card text-center" style="grid-column: 1 / -1; padding: 2.5rem 1.5rem;">
                <div style="font-size:2.5rem; margin-bottom:0.5rem">🎉</div>
                <h3>No Other Teams to Join Right Now</h3>
                <p class="text-muted mt-1">All available teams are either led by you or you are already working in them.</p>
                <div style="margin-top:1.25rem; display:flex; gap:0.75rem; justify-content:center;">
                    <a href="dashboard.html" class="btn-primary">View Current Projects</a>
                    <a href="create-team.html" class="btn-secondary">Create a New Team</a>
                </div>
            </div>
        `;
        return;
    }

    joinableTeams.forEach(t => {
        const skills = t.skills.map(s => `<span class="tag">${s}</span>`).join('');
        const leader = data.students.find(s => s.studentId === t.leaderId);
        const leaderName = leader ? leader.name : "Student Leader";
        const hasRequested = data.requests.some(r => r.teamId === t.id && r.studentId === currentUser && r.status === 'Pending');

        const statusBadge = hasRequested 
            ? '<span class="badge badge-warning">⏳ Request Pending</span>'
            : '<span class="badge badge-success">● Open to Join</span>';

        container.innerHTML += `
            <div class="card team-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <span class="badge badge-hackathon">${t.hackathon}</span>
                    ${statusBadge}
                </div>
                <h3>${t.name}</h3>
                <p class="text-muted" style="font-size:0.85rem; margin-bottom:0.5rem">Led by <strong>${leaderName}</strong></p>
                <p style="font-size:0.9rem; color:var(--gray-700); margin-bottom:0.75rem;">${t.description}</p>
                <div class="mt-1">${skills}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid var(--gray-100)">
                    <span class="text-muted" style="font-size:0.85rem">Slots: <strong>${t.capacity - t.currentMembers} available</strong></span>
                    <a href="team-details.html?id=${t.id}" class="${hasRequested ? 'btn-outline' : 'btn-primary'}" style="padding:0.45rem 0.9rem; font-size:0.85rem">
                        ${hasRequested ? 'View Status' : 'View & Join →'}
                    </a>
                </div>
            </div>
        `;
    });
}

function filterTeams() {
    const q = document.getElementById('searchTeam').value.toLowerCase();
    const h = document.getElementById('filterHackathon').value;
    const currentUser = api.getCurrentUser();

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
            ledCont.innerHTML = "<p class='text-muted'>You are not leading any teams right now. <a href='create-team.html' class='text-red'>Create one here</a>.</p>";
        } else {
            ledCont.innerHTML = "";
            led.forEach(t => {
                const pendingRequests = data.requests.filter(r => r.teamId === t.id && r.status === 'Pending');
                ledCont.innerHTML += `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
                            <span class="badge badge-hackathon">${t.hackathon}</span>
                            <span class="badge badge-leader">👑 Team Leader</span>
                        </div>
                        <h3>${t.name}</h3>
                        <p class="mt-1" style="font-size:0.9rem">${t.description}</p>
                        <p class="mt-1" style="font-size:0.85rem">Members: <strong>${t.currentMembers} / ${t.capacity}</strong> &bull; Status: <strong style="color:var(--primary-red)">${t.status.toUpperCase()}</strong></p>
                        ${pendingRequests.length > 0 ? `<div class="mt-1" style="color:var(--primary-red); font-weight:600; font-size:0.85rem">🔔 ${pendingRequests.length} pending join request(s)</div>` : ''}
                        <a href="team-details.html?id=${t.id}" class="btn-primary mt-1" style="display:block; text-align:center">Manage Team &amp; Requests →</a>
                    </div>
                `;
            });
        }
    }

    // Teams I joined (working as member)
    const joined = teams.filter(t => t.leaderId !== user && t.members && t.members.includes(user));
    const joinedCont = document.getElementById('joinedTeams');
    if (joinedCont) {
        if (joined.length === 0) {
            joinedCont.innerHTML = "<p class='text-muted'>You haven't joined any other teams yet. <a href='available-teams.html' class='text-red'>Browse available teams</a> to send a request.</p>";
        } else {
            joinedCont.innerHTML = "";
            joined.forEach(t => {
                const leader = data.students.find(s => s.studentId === t.leaderId);
                joinedCont.innerHTML += `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
                            <span class="badge badge-hackathon">${t.hackathon}</span>
                            <span class="badge badge-member">👥 Working Member</span>
                        </div>
                        <h3>${t.name}</h3>
                        <p class="text-muted" style="font-size:0.85rem">Led by <strong>${leader ? leader.name : 'Leader'}</strong></p>
                        <p class="mt-1" style="font-size:0.9rem">${t.description}</p>
                        <p class="mt-1" style="font-size:0.85rem">Members: <strong>${t.currentMembers} / ${t.capacity}</strong> &bull; Status: <strong>${t.status.toUpperCase()}</strong></p>
                        <a href="team-details.html?id=${t.id}" class="btn-outline mt-1" style="display:block; text-align:center">View Team Workspace →</a>
                    </div>
                `;
            });
        }
    }
}

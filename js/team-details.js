
document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const params = new URLSearchParams(window.location.search);
    const tid = parseInt(params.get('id'));
    const team = api.getData().teams.find(t => t.id === tid);
    
    const container = document.getElementById('teamDetails');
    if(!team) {
        container.innerHTML = "<p>Team not found.</p>";
        return;
    }
    
    const skills = team.skills.map(s => `<span class="tag">${s}</span>`).join('');
    
    let actionBtn = "";
    if(team.status === 'open' && team.leaderId !== api.getCurrentUser()) {
        actionBtn = `<button class="btn-primary mt-1" onclick="sendJoinReq(${team.id})">Send Join Request</button>`;
    } else if (team.status === 'closed') {
        actionBtn = `<button class="btn-secondary mt-1" disabled>Team Closed</button>`;
    }
    
    container.innerHTML = `
        <h2>${team.name}</h2>
        <p class="text-muted">${team.hackathon}</p>
        <p class="mt-1">${team.description}</p>
        <div class="mt-1"><strong>Skills:</strong><br>${skills}</div>
        <p class="mt-1">Members: ${team.currentMembers} / ${team.capacity}</p>
        ${actionBtn}
    `;
});

function sendJoinReq(tid) {
    const data = api.getData();
    data.requests.push({ teamId: tid, studentId: api.getCurrentUser(), status: 'Pending' });
    api.saveData(data);
    alert("Request Sent!");
    window.location.reload();
}

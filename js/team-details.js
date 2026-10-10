// team-details.js – Show a single team + join request + leader management

document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const params = new URLSearchParams(window.location.search);
    const tid = parseInt(params.get('id'));
    const data = api.getData();
    const team = data.teams.find(t => t.id === tid);
    const currentUser = api.getCurrentUser();

    const container = document.getElementById('teamDetails');
    if (!team) {
        container.innerHTML = "<p>Team not found.</p>";
        return;
    }

    const skills = team.skills.map(s => `<span class="tag">${s}</span>`).join('');
    const isLeader = team.leaderId === currentUser;
    const alreadyRequested = data.requests.some(r => r.teamId === team.id && r.studentId === currentUser);

    // Action button for non-leaders
    let actionBtn = "";
    if (!isLeader && team.status === 'open') {
        if (alreadyRequested) {
            actionBtn = `<button class="btn-secondary mt-1" disabled>Request Already Sent</button>`;
        } else {
            actionBtn = `<button class="btn-primary mt-1" onclick="sendJoinReq(${team.id})">Send Join Request</button>`;
        }
    } else if (team.status === 'closed' || team.status === 'full') {
        actionBtn = `<button class="btn-secondary mt-1" disabled>Team ${team.status === 'full' ? 'Full' : 'Closed'}</button>`;
    }

    // Leader name
    const leader = data.students.find(s => s.studentId === team.leaderId);
    const leaderName = leader ? leader.name : 'Unknown';

    container.innerHTML = `
        <h2>${team.name}</h2>
        <p class="text-muted">${team.hackathon}</p>
        <p class="mt-1">${team.description}</p>
        <div class="mt-1"><strong>Required Skills:</strong><br>${skills}</div>
        <p class="mt-1">Members: ${team.currentMembers} / ${team.capacity}</p>
        <p class="mt-1"><strong>Team Leader:</strong> ${leaderName}</p>
        ${actionBtn}
    `;

    // If current user is the leader, show pending requests
    if (isLeader) {
        const pendingReqs = data.requests.filter(r => r.teamId === team.id && r.status === 'Pending');
        if (pendingReqs.length > 0) {
            let reqHTML = '<h3 class="mt-2">Pending Join Requests</h3>';
            pendingReqs.forEach(r => {
                const applicant = data.students.find(s => s.studentId === r.studentId);
                const applicantName = applicant ? applicant.name : r.studentId;
                const applicantSkills = applicant ? applicant.skills.map(s => `<span class="tag">${s}</span>`).join('') : '';
                reqHTML += `
                    <div class="card mt-1">
                        <h4>${applicantName}</h4>
                        ${applicantSkills ? `<div class="mt-1">${applicantSkills}</div>` : ''}
                        <div class="mt-1">
                            <button class="btn-primary" onclick="handleRequest(${team.id}, '${r.studentId}', 'Accepted')">Accept</button>
                            <button class="btn-outline" onclick="handleRequest(${team.id}, '${r.studentId}', 'Rejected')" style="margin-left:0.5rem">Reject</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML += reqHTML;
        }
    }
});

function sendJoinReq(tid) {
    const data = api.getData();
    data.requests.push({ teamId: tid, studentId: api.getCurrentUser(), status: 'Pending' });
    api.saveData(data);
    alert("Request Sent!");
    window.location.reload();
}

function handleRequest(teamId, studentId, decision) {
    const data = api.getData();
    const req = data.requests.find(r => r.teamId === teamId && r.studentId === studentId);
    if (!req) return;

    req.status = decision;

    if (decision === 'Accepted') {
        const team = data.teams.find(t => t.id === teamId);
        if (team) {
            team.currentMembers += 1;
            if (!team.members) team.members = [];
            team.members.push(studentId);

            // Auto-close if full
            if (team.currentMembers >= team.capacity) {
                team.status = 'full';
            }
        }
    }

    api.saveData(data);
    alert(`Request ${decision.toLowerCase()}.`);
    window.location.reload();
}

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
        container.innerHTML = "<p>Team not found. <a href='available-teams.html' class='text-red'>Browse other teams</a>.</p>";
        return;
    }

    const skills = team.skills.map(s => `<span class="tag">${s}</span>`).join('');
    const isLeader = team.leaderId === currentUser;
    const isMember = team.members && team.members.includes(currentUser);
    const alreadyRequested = data.requests.some(r => r.teamId === team.id && r.studentId === currentUser && r.status === 'Pending');

    // Action banner / button
    let actionBtn = "";
    if (isLeader) {
        actionBtn = `<div class="badge badge-leader mt-2" style="font-size:0.85rem; padding:0.4rem 0.8rem">👑 You are leading this team</div>`;
    } else if (isMember) {
        actionBtn = `<div class="badge badge-member mt-2" style="font-size:0.85rem; padding:0.4rem 0.8rem">👥 You are an active working member of this team</div>`;
    } else if (team.status === 'open') {
        if (alreadyRequested) {
            actionBtn = `<button class="btn-secondary mt-2" disabled style="cursor:not-allowed">⏳ Join Request Already Sent (Pending Leader Review)</button>`;
        } else {
            actionBtn = `<button class="btn-primary mt-2" onclick="sendJoinReq(${team.id})">Send Join Request →</button>`;
        }
    } else if (team.status === 'closed' || team.status === 'full') {
        actionBtn = `<button class="btn-secondary mt-2" disabled>Team ${team.status === 'full' ? 'Full' : 'Closed'}</button>`;
    }

    // Leader name
    const leader = data.students.find(s => s.studentId === team.leaderId);
    const leaderName = leader ? leader.name : 'Unknown';

    // Roster of current team members
    let rosterHTML = "";
    if (team.members && team.members.length > 0) {
        rosterHTML = team.members.map(mId => {
            const memberObj = data.students.find(s => s.studentId === mId);
            const isTeamLeader = mId === team.leaderId;
            const displayName = memberObj ? memberObj.name : mId;
            return `
                <div style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.75rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); font-size:0.85rem; margin-right:0.5rem; margin-bottom:0.5rem;">
                    <span>${isTeamLeader ? '👑' : '👤'}</span>
                    <strong>${displayName}</strong>
                    <span class="text-muted" style="font-size:0.75rem">(${mId})</span>
                </div>
            `;
        }).join('');
    }

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span class="badge badge-hackathon">${team.hackathon}</span>
            <span class="badge ${team.status === 'open' ? 'badge-success' : 'badge-warning'}">${team.status.toUpperCase()}</span>
        </div>
        <h2 style="margin-bottom:0.25rem;">${team.name}</h2>
        <p class="text-muted" style="margin-bottom:1rem">Led by <strong>${leaderName}</strong> &bull; Hackathon: <strong>${team.hackathon}</strong></p>
        
        <div style="margin-bottom:1.25rem;">
            <h4 style="font-size:0.95rem; margin-bottom:0.35rem;">Project Overview</h4>
            <p style="color:var(--gray-700); line-height:1.5">${team.description}</p>
        </div>

        <div style="margin-bottom:1.25rem;">
            <h4 style="font-size:0.95rem; margin-bottom:0.35rem;">Required Skills</h4>
            <div>${skills}</div>
        </div>

        <div style="margin-bottom:1.25rem;">
            <h4 style="font-size:0.95rem; margin-bottom:0.5rem;">Team Roster (${team.currentMembers} / ${team.capacity} members)</h4>
            <div>${rosterHTML}</div>
        </div>

        <div>
            ${actionBtn}
        </div>
    `;

    // If current user is the leader, show pending requests
    if (isLeader) {
        const pendingReqs = data.requests.filter(r => r.teamId === team.id && r.status === 'Pending');
        if (pendingReqs.length > 0) {
            let reqHTML = `
                <div style="margin-top:2rem; padding-top:1.5rem; border-top:1px solid var(--gray-200);">
                    <h3 style="font-size:1.15rem; margin-bottom:0.75rem;">📩 Pending Join Requests (${pendingReqs.length})</h3>
            `;
            pendingReqs.forEach(r => {
                const applicant = data.students.find(s => s.studentId === r.studentId);
                const applicantName = applicant ? applicant.name : `Student (${r.studentId})`;
                const applicantSkills = applicant && applicant.skills ? applicant.skills.map(s => `<span class="tag">${s}</span>`).join('') : '';
                reqHTML += `
                    <div class="card mt-1" style="background:#ffffff; border:1px solid #e2e8f0; padding:1rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h4 style="margin-bottom:0.25rem">${applicantName}</h4>
                                <p class="text-muted" style="font-size:0.85rem">Roll No: <strong>${r.studentId}</strong> ${applicant ? `&bull; Email: ${applicant.email}` : ''}</p>
                                ${applicantSkills ? `<div class="mt-1">${applicantSkills}</div>` : ''}
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-primary" onclick="handleRequest(${team.id}, '${r.studentId}', 'Accepted')" style="padding:0.4rem 0.85rem; font-size:0.85rem">Accept</button>
                                <button class="btn-outline" onclick="handleRequest(${team.id}, '${r.studentId}', 'Rejected')" style="padding:0.4rem 0.85rem; font-size:0.85rem">Reject</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            reqHTML += '</div>';
            container.innerHTML += reqHTML;
        }
    }
});

function sendJoinReq(tid) {
    const data = api.getData();
    data.requests.push({ teamId: tid, studentId: api.getCurrentUser(), status: 'Pending' });
    api.saveData(data);
    alert("Join request sent successfully!");
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
            if (!team.members) team.members = [team.leaderId];
            if (!team.members.includes(studentId)) {
                team.members.push(studentId);
            }

            // Auto-close if full
            if (team.currentMembers >= team.capacity) {
                team.status = 'full';
            }
        }
    }

    api.saveData(data);
    alert(`Request ${decision.toLowerCase()}!`);
    window.location.reload();
}

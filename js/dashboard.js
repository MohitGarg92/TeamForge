// dashboard.js – Populate dashboard with user's current working projects

document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const data = api.getData();
    const currentUser = api.getCurrentUser();
    const user = data.students.find(s => s.studentId === currentUser) || { name: "Student" };

    // Welcome message
    const welcomeEl = document.getElementById('welcomeUser');
    if (welcomeEl) {
        welcomeEl.innerText = `Welcome, ${user.name}`;
    }

    // Projects the user is actively working in (either leading or joined as member)
    const myTeams = data.teams.filter(t =>
        t.leaderId === currentUser ||
        (t.members && t.members.includes(currentUser))
    );

    const wpContainer = document.getElementById('workingProjects');
    if (wpContainer) {
        if (myTeams.length === 0) {
            wpContainer.innerHTML = `
                <div class="card text-center" style="grid-column: 1 / -1; padding: 2.5rem 1.5rem;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem">📂</div>
                    <h3>No Working Projects Yet</h3>
                    <p class="text-muted mt-1">You are not part of any teams yet. Create a new team or browse open teams to join one!</p>
                    <div style="margin-top: 1.25rem; display: flex; gap: 0.75rem; justify-content: center;">
                        <a href="create-team.html" class="btn-primary">Create a Team</a>
                        <a href="available-teams.html" class="btn-secondary">Browse Available Teams</a>
                    </div>
                </div>
            `;
        } else {
            wpContainer.innerHTML = "";
            myTeams.forEach(t => {
                const isLeader = t.leaderId === currentUser;
                const pendingReqs = isLeader ? data.requests.filter(r => r.teamId === t.id && r.status === 'Pending') : [];
                
                const roleBadge = isLeader 
                    ? '<span class="badge badge-leader">👑 Team Leader</span>'
                    : '<span class="badge badge-member">👥 Working Member</span>';

                const leader = data.students.find(s => s.studentId === t.leaderId);
                const subtitle = isLeader ? 'You are leading this project' : `Leader: <strong>${leader ? leader.name : 'Team Leader'}</strong>`;

                wpContainer.innerHTML += `
                    <div class="card project-card reveal visible">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <span class="badge badge-hackathon">${t.hackathon}</span>
                            ${roleBadge}
                        </div>
                        <h3 style="margin-bottom:0.25rem;">${t.name}</h3>
                        <p class="text-muted" style="font-size:0.85rem; margin-bottom:0.75rem;">${subtitle}</p>
                        <p style="font-size:0.9rem; color:var(--gray-700); line-height:1.4; margin-bottom:1rem;">${t.description}</p>
                        <div class="project-meta" style="font-size:0.85rem; padding:0.6rem 0; border-top:1px solid var(--gray-100); border-bottom:1px solid var(--gray-100); margin-bottom:1rem;">
                            <span>Members: <strong>${t.currentMembers} / ${t.capacity}</strong></span>
                            <span style="float:right;">Status: <strong style="color:var(--primary-red); text-transform:uppercase;">${t.status}</strong></span>
                        </div>
                        ${pendingReqs.length > 0 ? `
                            <div class="pending-banner" style="background:#fff1f2; border:1px solid #fecdd3; color:#be123c; border-radius:var(--radius-sm); padding:0.4rem 0.75rem; font-size:0.8rem; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:space-between;">
                                <span>🔔 <strong>${pendingReqs.length}</strong> applicant waiting</span>
                                <span style="font-weight:600">Review →</span>
                            </div>
                        ` : ''}
                        <a href="team-details.html?id=${t.id}" class="${isLeader ? 'btn-primary' : 'btn-outline'}" style="display:block; text-align:center; padding:0.5rem 1rem;">
                            ${isLeader ? 'Manage Team →' : 'View Team Workspace →'}
                        </a>
                    </div>
                `;
            });
        }
    }
});

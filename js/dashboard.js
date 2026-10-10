// dashboard.js – Populate dashboard with user data

document.addEventListener('DOMContentLoaded', () => {
    api.requireAuth();
    const data = api.getData();
    const currentUser = api.getCurrentUser();
    const user = data.students.find(s => s.studentId === currentUser) || { name: "Student" };

    // Welcome message
    document.getElementById('welcomeUser').innerText = `Welcome, ${user.name}`;

    // Show teams the user is leading or a member of
    const myTeams = data.teams.filter(t =>
        t.leaderId === currentUser ||
        (t.members && t.members.includes(currentUser))
    );

    const wpContainer = document.getElementById('workingProjects');
    if (myTeams.length === 0) {
        wpContainer.innerHTML = '<p class="text-muted">You are not part of any teams yet. Create or join a team to get started!</p>';
    } else {
        myTeams.forEach(t => {
            wpContainer.innerHTML += `
                <div class="card">
                    <h3>${t.name}</h3>
                    <p class="text-muted">${t.hackathon}</p>
                    <p>Members: ${t.currentMembers} / ${t.capacity}</p>
                    <p>Status: <strong>${t.status.toUpperCase()}</strong></p>
                    <a href="team-details.html?id=${t.id}" class="btn-outline mt-1" style="display:block">View Team</a>
                </div>
            `;
        });
    }
});

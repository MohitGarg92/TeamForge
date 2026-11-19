document.addEventListener('DOMContentLoaded', async () => {
    if (!await api.requireAuth()) return;
    const container = document.getElementById('teamDetails');
    const teamId = new URLSearchParams(window.location.hash.slice(1)).get('id') ??
        new URLSearchParams(window.location.search).get('id');
    if (!teamId || !/^\d+$/.test(teamId)) {
        showPageMessage(container, 'Team not found.', true);
        return;
    }

    const load = async () => {
        try {
            const [team, profile] = await Promise.all([api.request(`/teams/${teamId}`), api.request('/profile')]);
            renderTeamDetails(container, team, profile.profile_complete);
        } catch (error) {
            showPageMessage(container, error.message, true);
        }
    };
    container.addEventListener('click', async event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'delete' && !window.confirm(
            'Permanently delete this team? Its roster and join requests will also be removed.'
        )) return;
        const feedback = container.querySelector('#requestFeedback');
        const enabledButtons = [...container.querySelectorAll('button[data-action]:enabled')];
        for (const control of enabledButtons) control.disabled = true;
        feedback.textContent = action === 'delete' ? 'Deleting team…' : 'Saving…';
        feedback.classList.remove('text-red');
        try {
            if (action === 'delete') {
                await api.request(`/teams/${teamId}`, { method: 'DELETE' });
                window.location.replace('dashboard.html');
                return;
            } else if (action === 'join') {
                await api.request(`/teams/${teamId}/request`, { method: 'POST', body: {} });
            } else {
                await api.request(`/requests/${button.dataset.requestId}`, { method: 'PUT', body: { status: action } });
            }
            await load();
        } catch (error) {
            if (action === 'join' && error.code === 'PROFILE_INCOMPLETE') {
                window.location.href = completeProfileUrl(teamId);
                return;
            }
            if (action === 'delete') {
                for (const control of enabledButtons) control.disabled = false;
            } else {
                await load();
            }
            const updatedFeedback = container.querySelector('#requestFeedback');
            if (updatedFeedback) {
                updatedFeedback.textContent = error.message;
                updatedFeedback.classList.add('text-red');
            }
        }
    });
    showPageMessage(container, 'Loading team…');
    await load();
});

function renderTeamDetails(container, team, profileComplete) {
    const status = { open: 'Open', closed: 'Closed', full: 'Full' }[team.status];
    const events = team.hackathons.map(event => event.name).join(', ');
    let action = '';
    if (team.is_leader) action = '<span class="badge badge-leader">You lead this team</span>';
    else if (team.is_member) action = '<span class="badge badge-member">You are a member</span>';
    else if (team.request_status) action = `<span class="badge badge-warning">Request ${requestStatus(team.request_status).toLowerCase()}</span>`;
    else if (team.status === 'open' && !profileComplete) action = `<a class="btn-primary" href="${completeProfileUrl(team.id)}">Complete Profile to Join</a>`;
    else if (team.status === 'open') action = '<button type="button" class="btn-primary" data-action="join">Send Join Request</button>';

    container.innerHTML = `
        <div class="team-card-badges">
            <span class="badge ${team.status === 'open' ? 'badge-success' : 'badge-warning'}">${status}</span>
            ${events ? `<span class="badge badge-hackathon">${escapeHtml(events)}</span>` : ''}
        </div>
        <h2>${escapeHtml(team.name)}</h2>
        <p class="text-muted">Led by ${escapeHtml(team.leader_name)}</p>
        <h3 class="mt-2">${escapeHtml(team.project_title)}</h3>
        <p>${escapeHtml(team.project_description) || 'No description provided.'}</p>
        <h4 class="mt-2">Required Skills</h4>
        <div>${skillTags(team.skills) || '<p class="text-muted">No skills listed.</p>'}</div>
        <h4 class="mt-2">Team Roster (${team.member_count} / ${team.capacity} members)</h4>
        ${team.members ? `<ul class="team-roster">${team.members.map(member =>
            `<li>${escapeHtml(member.full_name)}${member.is_leader ? ' (Leader)' : ''}</li>`).join('')}</ul>` : ''}
        <div class="mt-2">${action}</div>
        ${team.is_leader ? pendingRequests(team) : ''}
        ${team.is_leader ? '<button type="button" class="btn-danger mt-2" data-action="delete">Delete Team</button>' : ''}
        <p id="requestFeedback" class="mt-1" role="status"></p>`;
}

function pendingRequests(team) {
    const canAccept = team.status === 'open' && team.member_count < team.capacity;
    const cards = team.pending_requests.map(request => {
        const links = [safeLink(request.github, 'GitHub'), safeLink(request.linkedin, 'LinkedIn'),
            safeLink(request.resume_url, 'Resume')].filter(Boolean).join(' · ');
        return `
            <article class="card mt-1">
                <h4>${escapeHtml(request.full_name)}</h4>
                <a class="btn-outline mt-1" href="profile.html#request=${request.id}">View Profile</a>
                <p class="text-muted">${escapeHtml(request.email)}${request.student_id ? ` · ${escapeHtml(request.student_id)}` : ''}</p>
                ${links ? `<p>${links}</p>` : ''}
                <div>${skillTags(request.skills)}</div>
                <div class="team-card-badges mt-1">
                    <button type="button" class="btn-primary" data-action="accepted" data-request-id="${request.id}" ${canAccept ? '' : 'disabled'}>Accept</button>
                    <button type="button" class="btn-outline" data-action="rejected" data-request-id="${request.id}">Reject</button>
                </div>
            </article>`;
    });
    return `<h3 class="mt-2">Pending Join Requests</h3>${cards.join('') || '<p class="text-muted">No pending requests.</p>'}`;
}

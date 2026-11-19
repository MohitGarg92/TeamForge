document.addEventListener('DOMContentLoaded', async () => {
    const available = document.getElementById('teamsList');
    const led = document.getElementById('ledTeams');
    const joined = document.getElementById('joinedTeams');
    const createForm = document.getElementById('createTeamForm');
    if ((!available && !led && !createForm) || !await api.requireAuth()) return;

    if (available) await browseTeams(available);
    if (led) await showMyTeams(led, joined);
    if (createForm) await createTeam(createForm);
});

function teamCard(team, browse = false) {
    const status = { open: 'Open', closed: 'Closed', full: 'Full' }[team.status];
    const label = browse && team.request_status ? requestStatus(team.request_status) : status;
    const eventNames = team.hackathons.map(event => event.name).join(', ');
    const role = browse ? '' : `<span class="badge ${team.is_leader ? 'badge-leader' : 'badge-member'}">${team.is_leader ? 'Team Leader' : 'Member'}</span>`;
    return `
        <article class="card team-card">
            <div class="team-card-badges">
                ${role}
                ${eventNames ? `<span class="badge badge-hackathon">${escapeHtml(eventNames)}</span>` : ''}
                <span class="badge ${label === 'Open' ? 'badge-success' : 'badge-warning'}">${label}</span>
            </div>
            <h3>${escapeHtml(team.name)}</h3>
            <p><strong>${escapeHtml(team.project_title)}</strong></p>
            <p class="text-muted">Led by ${escapeHtml(team.leader_name)}</p>
            <p>${escapeHtml(team.project_description)}</p>
            <div>${skillTags(team.skills)}</div>
            <p class="team-slots">${team.member_count} / ${team.capacity} members${browse ? ` · ${team.capacity - team.member_count} spots available` : ''}</p>
            ${team.pending_request_count ? `<p>${team.pending_request_count} pending ${team.pending_request_count === 1 ? 'request' : 'requests'}</p>` : ''}
            <a href="${teamDetailsUrl(team.id)}" class="btn-primary">${team.is_leader && !browse ? 'Manage Team' : 'View Team'}</a>
        </article>`;
}

function addHackathonOptions(select, events) {
    for (const event of events) select.add(new Option(event.name, String(event.id)));
}

async function browseTeams(container) {
    showPageMessage(container, 'Loading open teams…');
    const search = document.getElementById('searchTeam');
    const filter = document.getElementById('filterHackathon');
    try {
        const [openTeams, events] = await Promise.all([api.request('/teams'), api.request('/hackathons')]);
        const teams = openTeams.filter(team => !team.is_member);
        addHackathonOptions(filter, events);
        const render = () => {
            const query = search.value.trim().toLowerCase();
            const matches = teams.filter(team => {
                const text = [team.name, team.project_title, team.project_description, ...team.skills];
                const matchesText = text.some(value => (value || '').toLowerCase().includes(query));
                const matchesEvent = !filter.value || team.hackathons.some(event => String(event.id) === filter.value);
                return matchesText && matchesEvent;
            });
            if (matches.length) container.innerHTML = matches.map(team => teamCard(team, true)).join('');
            else showPageMessage(container, teams.length ? 'No teams match those filters.' : 'There are no open teams to join right now.');
        };
        search.addEventListener('input', render);
        filter.addEventListener('change', render);
        render();
    } catch (error) {
        showPageMessage(container, error.message, true);
    }
}

async function showMyTeams(led, joined) {
    showPageMessage(led, 'Loading your teams…');
    try {
        const teams = await api.request('/my-teams');
        const ledTeams = teams.filter(team => team.is_leader);
        const joinedTeams = teams.filter(team => !team.is_leader);
        if (ledTeams.length) led.innerHTML = ledTeams.map(team => teamCard(team)).join('');
        else showPageMessage(led, 'You aren’t leading any teams yet.');
        if (joinedTeams.length) joined.innerHTML = joinedTeams.map(team => teamCard(team)).join('');
        else showPageMessage(joined, 'You haven’t joined any other teams yet.');
    } catch (error) {
        showPageMessage(led, error.message, true);
    }
}

async function createTeam(form) {
    const feedback = document.getElementById('teamFeedback');
    const fieldset = form.querySelector('fieldset');
    const eventSelect = form.querySelector('#tHack');
    try {
        const profile = await api.request('/profile');
        if (!profile.profile_complete) {
            window.location.replace(completeProfileUrl());
            return;
        }
        addHackathonOptions(eventSelect, await api.request('/hackathons'));
        fieldset.disabled = false;
        feedback.textContent = '';
    } catch (error) {
        feedback.textContent = error.message;
        feedback.classList.add('text-red');
        return;
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const body = {
            name: form.querySelector('#tName').value,
            project_title: form.querySelector('#tTitle').value,
            project_description: form.querySelector('#tDesc').value,
            hackathon_id: eventSelect.value ? Number(eventSelect.value) : null,
            capacity: form.querySelector('#tCap').valueAsNumber,
            skills: form.querySelector('#tSkills').value.split(',').map(skill => skill.trim()).filter(Boolean),
        };
        fieldset.disabled = true;
        feedback.textContent = 'Creating team…';
        feedback.classList.remove('text-red');
        let team;
        try {
            team = await api.request('/teams', { method: 'POST', body });
        } catch (error) {
            if (error.code === 'PROFILE_INCOMPLETE') {
                window.location.href = completeProfileUrl();
                return;
            }
            feedback.textContent = error.message;
            feedback.classList.add('text-red');
            return;
        } finally {
            fieldset.disabled = false;
        }
        form.reset();
        feedback.textContent = '';
        window.location.href = teamDetailsUrl(team.id);
    });
}

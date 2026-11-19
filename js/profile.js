document.addEventListener('DOMContentLoaded', async () => {
    if (!await api.requireAuth()) return;
    const card = document.getElementById('profileCard');
    const form = document.getElementById('editProfileForm');
    const feedback = document.getElementById('profileFeedback');
    if (card) showPageMessage(card, 'Loading profile…');
    try {
        const requestId = new URLSearchParams(window.location.hash.slice(1)).get('request');
        const applicantView = Boolean(card && requestId);
        if (applicantView) {
            document.getElementById('profileHeading').textContent = 'Applicant Profile';
            document.getElementById('profileDescription').textContent = 'Review this student’s details before deciding on their request.';
        }
        const profile = await api.request(applicantView ? `/requests/${encodeURIComponent(requestId)}/profile` : '/profile');
        if (card && !applicantView) {
            document.getElementById('editProfileLink').hidden = false;
        }
        if (card) renderProfile(card, profile);
        if (form) editProfile(form, feedback, profile);
    } catch (error) {
        if (card) showPageMessage(card, error.message, true);
        if (feedback) {
            feedback.textContent = error.message;
            feedback.classList.add('text-red');
        }
    }
});

function renderProfile(card, profile) {
    const empty = '<span class="text-muted">Not added yet</span>';
    card.innerHTML = `
        <h3>${escapeHtml(profile.full_name)}</h3>
        ${profile.profile_complete ? '' : `<p class="text-red">Profile incomplete. Missing ${escapeHtml(profile.missing_fields.join(', '))}.</p>`}
        <p><strong>Email:</strong> ${escapeHtml(profile.email)}</p>
        <p><strong>Student ID:</strong> ${escapeHtml(profile.student_id) || empty}</p>
        <p><strong>Phone:</strong> ${escapeHtml(profile.phone) || empty}</p>
        <p><strong>GitHub:</strong> ${safeLink(profile.github, 'View GitHub profile') || empty}</p>
        <p><strong>LinkedIn:</strong> ${safeLink(profile.linkedin, 'View LinkedIn profile') || empty}</p>
        <p><strong>Resume:</strong> ${safeLink(profile.resume_url, 'View resume') || empty}</p>
        <div class="mt-1"><strong>Skills:</strong><br>${skillTags(profile.skills) || empty}</div>
    `;
}

function editProfile(form, feedback, profile) {
    const fields = {
        full_name: form.querySelector('#pName'),
        student_id: form.querySelector('#pStudentId'),
        phone: form.querySelector('#pPhone'),
        github: form.querySelector('#pGit'),
        linkedin: form.querySelector('#pLink'),
        resume_url: form.querySelector('#pResume'),
    };
    for (const [name, input] of Object.entries(fields)) input.value = profile[name] || '';
    form.querySelector('#pEmail').value = profile.email;
    const skillInput = form.querySelector('#pSkills');
    skillInput.value = profile.skills.join(', ');
    const fieldset = form.querySelector('fieldset');
    fieldset.disabled = false;
    const next = new URLSearchParams(window.location.hash.slice(1));
    feedback.textContent = profile.profile_complete ? '' : `Complete the required fields to create or join teams. Missing ${profile.missing_fields.join(', ')}.`;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const body = Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
        body.skills = skillInput.value.split(',').map(skill => skill.trim()).filter(Boolean);
        fieldset.disabled = true;
        feedback.textContent = 'Saving profile…';
        feedback.classList.remove('text-red');
        try {
            const saved = await api.request('/profile', { method: 'PUT', body });
            if (!saved.profile_complete) {
                feedback.textContent = `Please complete ${saved.missing_fields.join(', ')}.`;
                fieldset.disabled = false;
                return;
            }
            const teamId = next.get('id');
            if (next.get('next') === 'team' && /^\d+$/.test(teamId || '')) {
                window.location.href = teamDetailsUrl(teamId);
            } else {
                window.location.href = next.get('next') === 'create-team' ? 'create-team.html' : 'profile.html';
            }
        } catch (error) {
            feedback.textContent = error.message;
            feedback.classList.add('text-red');
            fieldset.disabled = false;
        }
    });
}

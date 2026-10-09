/* =========================================================================
   EduReview — Frontend interactivity and API requests
   Pages: home | lecturer | add-review | login
   ========================================================================= */
(function () {
    'use strict';

    const API_BASE =
        window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';

    const qs = (selector, scope = document) => scope.querySelector(selector);
    const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

    /* --------------------------------------------------------------------- */
    /* API layer                                                             */
    /* --------------------------------------------------------------------- */
    async function request(path, options = {}) {
        const config = { headers: { 'Content-Type': 'application/json' }, ...options };
        if (config.body && typeof config.body !== 'string') {
            config.body = JSON.stringify(config.body);
        }

        let response;
        try {
            response = await fetch(API_BASE + path, config);
        } catch (error) {
            throw new Error('Cannot reach the API. Is the Flask server running?');
        }

        let data = null;
        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            const message = (data && (data.message || data.error)) || `Request failed (${response.status})`;
            const err = new Error(message);
            err.status = response.status;
            throw err;
        }
        return data;
    }

    const api = {
        get: (path) => request(path),
        post: (path, body) => request(path, { method: 'POST', body }),
    };

    /* --------------------------------------------------------------------- */
    /* Session helpers                                                       */
    /* --------------------------------------------------------------------- */
    const session = {
        student: {
            get: () => JSON.parse(localStorage.getItem('ngu_student') || 'null'),
            set: (user) => localStorage.setItem('ngu_student', JSON.stringify(user)),
            clear: () => localStorage.removeItem('ngu_student'),
        },
        lecturer: {
            get: () => JSON.parse(localStorage.getItem('ngu_lecturer') || 'null'),
            set: (user) => localStorage.setItem('ngu_lecturer', JSON.stringify(user)),
            clear: () => localStorage.removeItem('ngu_lecturer'),
        },
        admin: {
            get: () => JSON.parse(localStorage.getItem('ngu_admin') || 'null'),
            set: (user) => localStorage.setItem('ngu_admin', JSON.stringify(user)),
            clear: () => localStorage.removeItem('ngu_admin'),
        },
        logout() {
            this.student.clear();
            this.lecturer.clear();
            this.admin.clear();
        },
        current() {
            return this.admin.get() || this.lecturer.get() || this.student.get();
        },
    };

    /* --------------------------------------------------------------------- */
    /* UI helpers                                                            */
    /* --------------------------------------------------------------------- */
    function escapeHTML(value) {
        const node = document.createElement('div');
        node.textContent = value == null ? '' : String(value);
        return node.innerHTML;
    }

    function initials(name) {
        return String(name || '?')
            .replace(/[^A-Za-z ]/g, '')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('');
    }

    function formatDate(value) {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    }

    function truncate(text, max) {
        const value = String(text || '').trim();
        if (value.length <= max) return value;
        return value.slice(0, max).replace(/\s+\S*$/, '') + '…';
    }

    function hashString(value) {
        let hash = 0;
        const text = String(value || '');
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function toast(message, type = 'success') {
        let host = qs('.toast-host');
        if (!host) {
            host = document.createElement('div');
            host.className = 'toast-host';
            document.body.appendChild(host);
        }
        const node = document.createElement('div');
        node.className = `toast ${type}`;
        node.textContent = message;
        host.appendChild(node);
        setTimeout(() => node.remove(), 3200);
    }

    function ratingBadge(score) {
        const value = Number(score) || 0;
        if (value <= 0) return 'badge-neutral';
        if (value >= 80) return 'badge-positive';
        if (value >= 50) return 'badge-neutral';
        return 'badge-negative';
    }

    /* --------------------------------------------------------------------- */
    /* Lecturer presentation helpers                                         */
    /* --------------------------------------------------------------------- */
    const HEADSHOTS = [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=900&h=675&q=80',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&h=675&q=80',
    ];

    function headshotFor(lecturer) {
        return HEADSHOTS[hashString(lecturer.name) % HEADSHOTS.length];
    }

    function lecturerTitle(name) {
        const normalized = String(name || '').toLowerCase();
        if (normalized.startsWith('prof')) return 'Professor';
        if (normalized.startsWith('dr')) return 'Senior Lecturer · Principal Researcher';
        if (normalized.startsWith('mr') || normalized.startsWith('ms') || normalized.startsWith('mrs')) return 'Lecturer';
        return 'Faculty Member';
    }

    function formatRatingText(score) {
        const value = Number(score) || 0;
        return value > 0 ? (value / 20).toFixed(1) : null;
    }

    /* --------------------------------------------------------------------- */
    /* Shared: lecturer card                                                 */
    /* --------------------------------------------------------------------- */
    function renderLecturerCard(lecturer, snippet) {
        const rating = formatRatingText(lecturer.average_rating);
        const photo = headshotFor(lecturer);
        return `
            <article class="lecturer-card">
                <a class="lecturer-photo" href="lecturer.html?id=${lecturer.id}" aria-label="${escapeHTML(lecturer.name)}">
                    <img src="${photo}" alt="${escapeHTML(lecturer.name)}" loading="lazy" />
                    <span class="dept-tag">${escapeHTML(lecturer.department)}</span>
                </a>
                <div class="lecturer-body">
                    <div>
                        <h3 class="lecturer-name">
                            <a href="lecturer.html?id=${lecturer.id}">${escapeHTML(lecturer.name)}</a>
                        </h3>
                        <p class="lecturer-title mb-0">${escapeHTML(lecturerTitle(lecturer.name))}</p>
                    </div>
                    <div class="flex items-end justify-between">
                        <div class="rating-display">${rating ? `${rating} <small>/ 5.0</small>` : '<span class="text-sm text-gray-400">No ratings</span>'}</div>
                        <span class="badge ${ratingBadge(lecturer.average_rating)}">${lecturer.review_count} review${lecturer.review_count === 1 ? '' : 's'}</span>
                    </div>
                    <p class="review-snippet">${snippet ? `<i class="fa-solid fa-quote-left" aria-hidden="true"></i>&ldquo;${escapeHTML(truncate(snippet.comment, 96))}&rdquo;` : 'No written feedback yet — be the first to review.'}</p>
                    <a class="btn btn-outline btn-sm btn-block mt-auto" href="add-review.html?lecturer_id=${lecturer.id}">Write a Review</a>
                </div>
            </article>`;
    }

    /* --------------------------------------------------------------------- */
    /* Navbar, search & mobile menu                                          */
    /* --------------------------------------------------------------------- */
    function initNavbar() {
        const active = document.body.dataset.page;
        qsa('.nav-links a').forEach((link) => {
            if (link.dataset.page === active) link.classList.add('active');
        });

        const slot = qs('[data-session-slot]');
        if (slot) {
            const user = session.current();
            if (user) {
                slot.innerHTML = `
                    <span class="text-sm text-gray-600 hidden sm:inline">${escapeHTML(user.name)}</span>
                    <button class="btn btn-sm btn-outline" data-logout>Logout</button>`;
                qs('[data-logout]', slot).addEventListener('click', () => {
                    session.logout();
                    toast('Signed out');
                    setTimeout(() => window.location.reload(), 450);
                });
            } else {
                slot.innerHTML = '<a class="btn btn-sm" href="login.html">Sign In</a>';
            }
        }

        qsa('[data-nav-search]').forEach((form) => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const input = qs('[data-nav-search-input]', form);
                const query = (input && input.value || '').trim();
                window.location.href = query
                    ? `index.html?q=${encodeURIComponent(query)}#directory`
                    : 'index.html#directory';
            });
        });

        const toggle = qs('[data-nav-toggle]');
        const panel = qs('[data-nav-panel]');
        if (toggle && panel) {
            toggle.addEventListener('click', () => {
                const open = !panel.classList.contains('hidden');
                panel.classList.toggle('hidden', open);
                toggle.setAttribute('aria-expanded', String(!open));
            });
        }
    }

    /* --------------------------------------------------------------------- */
    /* Page: home                                                            */
    /* --------------------------------------------------------------------- */
    function renderDepartmentGrid(departments, lecturers) {
        const host = qs('#department-grid');
        if (!host) return;
        if (!departments.length) {
            host.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No departments available.</div>';
            return;
        }
        host.innerHTML = departments
            .map((dept) => {
                const count = lecturers.filter((lecturer) => lecturer.department === dept).length;
                return `
                    <a class="department-card" href="index.html?department=${encodeURIComponent(dept)}#directory">
                        <div class="flex items-center justify-between">
                            <span class="eyebrow">School</span>
                            <span class="badge badge-brand">${count} Members</span>
                        </div>
                        <h3 class="dep-name mt-4 mb-1">${escapeHTML(dept)}</h3>
                        <p class="muted text-sm mb-0">Browse faculty, ratings and student evaluations.</p>
                    </a>`;
            })
            .join('');
    }

    async function initHome() {
        const grid = qs('#lecturer-grid');
        const searchInput = qs('#search-input');
        const deptFilter = qs('#department-filter');
        const sortSelect = qs('#sort-select');
        const countLabel = qs('#result-count');
        const params = new URLSearchParams(window.location.search);

        let lecturers = [];
        const snippetMap = new Map();

        function snippetFor(id) {
            const list = snippetMap.get(id);
            return list && list.length ? list[0] : null;
        }

        function render(list) {
            if (!list.length) {
                grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No lecturers match your search.</div>';
                countLabel.textContent = '0 lecturers';
                return;
            }
            grid.innerHTML = list.map((lecturer) => renderLecturerCard(lecturer, snippetFor(lecturer.id))).join('');
            countLabel.textContent = `${list.length} lecturer${list.length === 1 ? '' : 's'}`;
        }

        function applyFilters() {
            const term = (searchInput.value || '').trim().toLowerCase();
            const dept = deptFilter.value;

            let list = lecturers.filter((lecturer) => {
                const matchesTerm =
                    !term ||
                    lecturer.name.toLowerCase().includes(term) ||
                    (lecturer.department || '').toLowerCase().includes(term);
                const matchesDept = !dept || lecturer.department === dept;
                return matchesTerm && matchesDept;
            });

            const sort = sortSelect ? sortSelect.value : 'name';
            if (sort === 'rating') {
                list = list.slice().sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
            } else if (sort === 'reviews') {
                list = list.slice().sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
            } else {
                list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
            }

            render(list);
        }

        try {
            const [data, departments, reviews] = await Promise.all([
                api.get('/lecturers'),
                api.get('/departments'),
                api.get('/reviews').catch(() => []),
            ]);

            lecturers = data || [];

            (reviews || []).forEach((review) => {
                if (review.comment && review.comment.trim()) {
                    if (!snippetMap.has(review.lecturer_id)) snippetMap.set(review.lecturer_id, []);
                    snippetMap.get(review.lecturer_id).push(review);
                }
            });

            deptFilter.innerHTML =
                '<option value="">All Departments</option>' +
                departments.map((d) => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('');

            renderDepartmentGrid(departments, lecturers);

            const preset = params.get('q');
            if (preset) searchInput.value = preset;

            const presetDept = params.get('department');
            if (presetDept) deptFilter.value = presetDept;

            const presetSort = params.get('sort');
            if (presetSort && sortSelect) sortSelect.value = presetSort;

            applyFilters();
        } catch (error) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${escapeHTML(error.message)}</div>`;
            countLabel.textContent = 'Error loading';
        }

        searchInput.addEventListener('input', applyFilters);
        deptFilter.addEventListener('change', applyFilters);
        if (sortSelect) sortSelect.addEventListener('change', applyFilters);

        const heroForm = qs('[data-hero-search]');
        if (heroForm) {
            heroForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const input = qs('[data-hero-search-input]', heroForm);
                const query = (input && input.value || '').trim();
                if (query) {
                    window.location.href = `index.html?q=${encodeURIComponent(query)}#directory`;
                } else {
                    const target = qs('#directory');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    }

    /* --------------------------------------------------------------------- */
    /* Page: lecturer profile                                                */
    /* --------------------------------------------------------------------- */
    async function initLecturerPage() {
        const host = qs('#lecturer-profile');
        const id = new URLSearchParams(window.location.search).get('id');

        if (!id) {
            host.innerHTML = '<div class="empty-state">No lecturer selected. <a href="index.html">Browse lecturers</a>.</div>';
            return;
        }

        try {
            const lecturer = await api.get(`/lecturers/${id}`);
            document.title = `${lecturer.name} | EduReview`;

            qs('#lecturer-name').textContent = lecturer.name;
            qs('#lecturer-department').textContent = lecturer.department;
            qs('#lecturer-role').textContent = lecturerTitle(lecturer.name);

            const photo = qs('#lecturer-photo');
            photo.src = headshotFor(lecturer);
            photo.alt = lecturer.name;

            const rating = formatRatingText(lecturer.average_rating);
            qs('#lecturer-rating').innerHTML = rating ? `${rating} <small>/ 5.0</small>` : '—';
            qs('#lecturer-review-count').textContent = lecturer.review_count;

            const stats = qs('#lecturer-stats');
            stats.innerHTML = `
                <div class="stat"><div class="stat-value">${rating || '—'}</div><div class="stat-label">Average / 5.0</div></div>
                <div class="stat"><div class="stat-value">${lecturer.review_count}</div><div class="stat-label">Total Reviews</div></div>
                <div class="stat"><div class="stat-value">${lecturer.highest ?? 0}<span class="text-base">%</span></div><div class="stat-label">Highest Score</div></div>
                <div class="stat"><div class="stat-value">${lecturer.lowest ?? 0}<span class="text-base">%</span></div><div class="stat-label">Lowest Score</div></div>`;

            renderBars(qs('#score-distribution'), lecturer.distribution, {
                '0-20': '0–20%', '21-40': '21–40%', '41-60': '41–60%', '61-80': '61–80%', '81-100': '81–100%',
            }, 'brand');

            renderBars(qs('#sentiment-breakdown'), lecturer.sentiment, {
                positive: 'Positive', neutral: 'Neutral', negative: 'Negative',
            }, 'sentiment');

            const list = qs('#review-list');
            if (!lecturer.reviews.length) {
                list.innerHTML = '<div class="empty-state">No reviews yet. Be the first to review this lecturer.</div>';
            } else {
                list.innerHTML = lecturer.reviews.map(renderReview).join('');
            }

            qs('#write-review-link').href = `add-review.html?lecturer_id=${lecturer.id}`;
        } catch (error) {
            host.innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
        }
    }

    function renderBars(host, data, labels, mode) {
        if (!host || !data) return;
        const max = Math.max(1, ...Object.values(data));
        host.innerHTML = Object.entries(labels)
            .map(([key, label]) => {
                const value = data[key] || 0;
                const width = Math.round((value / max) * 100);
                const cls = mode === 'sentiment' ? ` ${key}` : '';
                return `
                    <div class="bar-row">
                        <span>${escapeHTML(label)}</span>
                        <div class="bar-track"><div class="bar-fill${cls}" style="width:${width}%"></div></div>
                        <strong>${value}</strong>
                    </div>`;
            })
            .join('');
    }

    function renderReview(review) {
        return `
            <div class="review-item">
                <div class="review-head">
                    <span><strong>${escapeHTML(review.student_name || 'Anonymous')}</strong> &middot; ${escapeHTML(review.unit)}</span>
                    <span class="review-score">${review.score}%</span>
                </div>
                <div class="review-head">
                    <span>${escapeHTML(formatDate(review.created_at))}</span>
                    <span class="badge badge-${escapeHTML(review.sentiment)}">${escapeHTML(review.sentiment)}</span>
                </div>
                ${review.comment ? `<p class="review-comment"><i class="fa-solid fa-quote-left" aria-hidden="true"></i>${escapeHTML(review.comment)}</p>` : ''}
            </div>`;
    }

    /* --------------------------------------------------------------------- */
    /* Page: add review                                                      */
    /* --------------------------------------------------------------------- */
    async function initAddReview() {
        const form = qs('#review-form');
        const lecturerSelect = qs('#lecturer-select');
        const departmentSelect = qs('#department-select');
        const unitSelect = qs('#unit-select');
        const errorBox = qs('#form-error');
        const metricInputs = qsa('[data-metric]');

        const params = new URLSearchParams(window.location.search);
        const presetLecturer = params.get('lecturer_id');

        function syncMetricReadouts() {
            metricInputs.forEach((input) => {
                const readout = qs(`[data-metric-value="${input.dataset.metric}"]`);
                if (readout) readout.textContent = input.value;
            });
        }

        metricInputs.forEach((input) => input.addEventListener('input', syncMetricReadouts));
        syncMetricReadouts();

        try {
            const [data, departments] = await Promise.all([
                api.get('/academic-data'),
                api.get('/departments'),
            ]);

            departmentSelect.innerHTML =
                '<option value="">Select department</option>' +
                departments.map((d) => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('');

            unitSelect.innerHTML =
                '<option value="">Select unit</option>' +
                data.units.map((u) => `<option value="${escapeHTML(u)}">${escapeHTML(u)}</option>`).join('');

            function fillLecturers() {
                const dept = departmentSelect.value;
                const list = dept
                    ? data.lecturers.filter((l) => l.department === dept)
                    : data.lecturers;
                lecturerSelect.innerHTML =
                    '<option value="">Select lecturer</option>' +
                    list.map((l) => `<option value="${l.id}">${escapeHTML(l.name)}</option>`).join('');
                if (presetLecturer && list.some((l) => String(l.id) === presetLecturer)) {
                    lecturerSelect.value = presetLecturer;
                }
            }

            fillLecturers();
            if (presetLecturer) {
                const preset = data.lecturers.find((l) => String(l.id) === presetLecturer);
                if (preset) departmentSelect.value = preset.department;
            }

            departmentSelect.addEventListener('change', fillLecturers);
        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.classList.remove('hidden');
        }

        const student = session.student.get();
        if (student) {
            qs('#reviewer-name').value = student.name || '';
            qs('#reviewer-email').value = student.email || '';
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorBox.classList.add('hidden');

            const metrics = {};
            metricInputs.forEach((input) => {
                metrics[input.dataset.metric] = parseInt(input.value, 10);
            });
            const values = Object.values(metrics);
            const score = Math.round((values.reduce((sum, v) => sum + v, 0) / (values.length * 5)) * 100);

            const payload = {
                lecturer_id: lecturerSelect.value,
                unit: unitSelect.value,
                score,
                metrics,
                comment: qs('#review-comment').value,
                student_name: qs('#reviewer-name').value || 'Anonymous',
                student_email: qs('#reviewer-email').value || null,
            };

            if (!payload.lecturer_id || !payload.unit) {
                errorBox.textContent = 'Please choose a lecturer and a unit.';
                errorBox.classList.remove('hidden');
                return;
            }

            const submitButton = qs('button[type="submit"]', form);
            submitButton.disabled = true;
            try {
                await api.post('/reviews', payload);
                toast('Review submitted. Thank you!');
                const lecturerId = payload.lecturer_id;
                setTimeout(() => {
                    window.location.href = `lecturer.html?id=${lecturerId}`;
                }, 700);
            } catch (error) {
                errorBox.textContent = error.message;
                errorBox.classList.remove('hidden');
                submitButton.disabled = false;
            }
        });
    }

    /* --------------------------------------------------------------------- */
    /* Page: login                                                           */
    /* --------------------------------------------------------------------- */
    async function initLogin() {
        qsa('.tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                qsa('.tab').forEach((t) => t.classList.remove('active'));
                qsa('[data-tab-panel]').forEach((panel) => panel.classList.add('hidden'));
                tab.classList.add('active');
                qs(`[data-tab-panel="${tab.dataset.tab}"]`).classList.remove('hidden');
            });
        });

        qs('#student-login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const data = await api.post('/auth/login', {
                    email: qs('#student-email').value,
                    password: qs('#student-password').value,
                });
                session.student.set(data.user);
                toast(`Welcome back, ${data.user.name}`);
                setTimeout(() => (window.location.href = 'index.html'), 600);
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        qs('#show-signup').addEventListener('click', (event) => {
            event.preventDefault();
            qs('#student-login-form').classList.add('hidden');
            qs('#student-signup-form').classList.remove('hidden');
        });
        qs('#show-login').addEventListener('click', (event) => {
            event.preventDefault();
            qs('#student-signup-form').classList.add('hidden');
            qs('#student-login-form').classList.remove('hidden');
        });

        qs('#student-signup-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await api.post('/auth/signup', {
                    name: qs('#signup-name').value,
                    email: qs('#signup-email').value,
                    password: qs('#signup-password').value,
                });
                toast('Account created. Please sign in.');
                qs('#student-signup-form').classList.add('hidden');
                qs('#student-login-form').classList.remove('hidden');
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        const lecturerName = qs('#lecturer-name');
        const pinEntry = qs('#pin-entry');
        const pinSetup = qs('#pin-setup');

        lecturerName.addEventListener('change', async () => {
            const name = lecturerName.value.trim();
            if (!name) return;
            try {
                const data = await api.get(`/lecturers/pins/${encodeURIComponent(name)}`);
                pinEntry.classList.toggle('hidden', data.pin_set);
                pinSetup.classList.toggle('hidden', data.pin_set);
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        qs('#lecturer-login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const data = await api.post('/lecturers/login', {
                    name: lecturerName.value.trim(),
                    pin: qs('#lecturer-pin').value,
                });
                session.lecturer.set(data.lecturer);
                toast(`Welcome, ${data.lecturer.name}`);
                setTimeout(() => (window.location.href = `lecturer.html?id=${data.lecturer.id}`), 600);
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        qs('#lecturer-setup-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await api.post('/lecturers/pins', {
                    name: lecturerName.value.trim(),
                    pin: qs('#new-pin').value,
                });
                toast('PIN registered. You can now sign in.');
                pinEntry.classList.remove('hidden');
                pinSetup.classList.add('hidden');
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        qs('#admin-login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const data = await api.post('/auth/admin/login', {
                    username: qs('#admin-username').value,
                    password: qs('#admin-password').value,
                });
                session.admin.set(data.user);
                toast('Administrator signed in');
                setTimeout(() => (window.location.href = 'index.html'), 600);
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        qs('#show-bootstrap').addEventListener('click', (event) => {
            event.preventDefault();
            qs('#admin-bootstrap-form').classList.remove('hidden');
        });

        qs('#admin-bootstrap-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await api.post('/auth/admin/bootstrap', {
                    username: qs('#bootstrap-username').value,
                    password: qs('#bootstrap-password').value,
                });
                toast('Administrator created. Please sign in.');
                qs('#admin-bootstrap-form').classList.add('hidden');
            } catch (error) {
                toast(error.message, 'error');
            }
        });
    }

    /* --------------------------------------------------------------------- */
    /* Bootstrap the page                                                    */
    /* --------------------------------------------------------------------- */
    const pages = {
        home: initHome,
        lecturer: initLecturerPage,
        'add-review': initAddReview,
        login: initLogin,
    };

    document.addEventListener('DOMContentLoaded', () => {
        initNavbar();
        const init = pages[document.body.dataset.page];
        if (init) init();
    });
})();
/* =========================================================================
   Frontend interactivity and API requests
   =========================================================================
   Shared helpers plus a page initializer selected via  <body data-page="...">
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
        if (value >= 80) return 'badge-positive';
        if (value >= 50) return 'badge-neutral';
        return 'badge-negative';
    }

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
    /* Theme                                                                 */
    /* --------------------------------------------------------------------- */
    function initTheme() {
        const stored = localStorage.getItem('ngu_theme') || 'light';
        document.documentElement.setAttribute('data-theme', stored);

        qsa('[data-theme-toggle]').forEach((button) => {
            button.textContent = stored === 'dark' ? '☀' : '☾';
            button.addEventListener('click', () => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('ngu_theme', next);
                button.textContent = next === 'dark' ? '☀' : '☾';
            });
        });
    }

    /* --------------------------------------------------------------------- */
    /* Navbar                                                                */
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
                    <span class="muted" style="color:#cbd0d8;font-size:0.8rem;">${escapeHTML(user.name)}</span>
                    <button class="btn btn-sm btn-outline" data-logout>Logout</button>`;
                qs('[data-logout]', slot).addEventListener('click', () => {
                    session.logout();
                    toast('Signed out');
                    setTimeout(() => window.location.reload(), 500);
                });
            } else {
                slot.innerHTML = '<a class="btn btn-sm" href="login.html">Sign in</a>';
            }
        }
    }

    /* --------------------------------------------------------------------- */
    /* Shared: lecturer card                                                 */
    /* --------------------------------------------------------------------- */
    function renderLecturerCard(lecturer) {
        const avg = Number(lecturer.average_rating || 0).toFixed(1);
        return `
            <article class="card lecturer-card">
                <div class="lecturer-card-head">
                    <div class="avatar">${escapeHTML(initials(lecturer.name))}</div>
                    <div>
                        <h3 class="card-title">
                            <a href="lecturer.html?id=${lecturer.id}">${escapeHTML(lecturer.name)}</a>
                        </h3>
                        <div class="card-sub">${escapeHTML(lecturer.department)}</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span class="rating">${avg}</span>
                    <span class="badge ${ratingBadge(lecturer.average_rating)}">${lecturer.review_count} review${lecturer.review_count === 1 ? '' : 's'}</span>
                </div>
                <a class="btn btn-sm btn-block" href="add-review.html?lecturer_id=${lecturer.id}">Write a review</a>
            </article>`;
    }

    /* --------------------------------------------------------------------- */
    /* Page: home                                                            */
    /* --------------------------------------------------------------------- */
    async function initHome() {
        const grid = qs('#lecturer-grid');
        const searchInput = qs('#search-input');
        const deptFilter = qs('#department-filter');
        const countLabel = qs('#result-count');

        let lecturers = [];

        function render(list) {
            if (!list.length) {
                grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No lecturers match your search.</div>';
                countLabel.textContent = '0 results';
                return;
            }
            grid.innerHTML = list.map(renderLecturerCard).join('');
            countLabel.textContent = `${list.length} result${list.length === 1 ? '' : 's'}`;
        }

        function applyFilters() {
            const term = (searchInput.value || '').trim().toLowerCase();
            const dept = deptFilter.value;
            render(
                lecturers.filter((lecturer) => {
                    const matchesTerm = !term || lecturer.name.toLowerCase().includes(term);
                    const matchesDept = !dept || lecturer.department === dept;
                    return matchesTerm && matchesDept;
                })
            );
        }

        try {
            grid.innerHTML = '<div class="skeleton" style="grid-column:1/-1;"></div>'.repeat(6);
            const [data, departments] = await Promise.all([
                api.get('/lecturers'),
                api.get('/departments'),
            ]);
            lecturers = data;
            deptFilter.innerHTML =
                '<option value="">All departments</option>' +
                departments.map((d) => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join('');
            render(lecturers);
        } catch (error) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${escapeHTML(error.message)}</div>`;
        }

        searchInput.addEventListener('input', applyFilters);
        deptFilter.addEventListener('change', applyFilters);
    }

    /* --------------------------------------------------------------------- */
    /* Page: lecturer profile                                                */
    /* --------------------------------------------------------------------- */
    async function initLecturerPage() {
        const id = new URLSearchParams(window.location.search).get('id');
        const host = qs('#lecturer-profile');

        if (!id) {
            host.innerHTML = '<div class="empty-state">No lecturer selected. <a href="index.html">Browse lecturers</a>.</div>';
            return;
        }

        try {
            const lecturer = await api.get(`/lecturers/${id}`);
            document.title = `${lecturer.name} | NGU Lecturer Reviews`;
            qs('#lecturer-name').textContent = lecturer.name;
            qs('#lecturer-department').textContent = lecturer.department;
            qs('#lecturer-avatar').textContent = initials(lecturer.name);

            const stats = qs('#lecturer-stats');
            stats.innerHTML = `
                <div class="stat"><div class="stat-value">${Number(lecturer.average_rating).toFixed(1)}%</div><div class="stat-label">Average rating</div></div>
                <div class="stat"><div class="stat-value">${lecturer.review_count}</div><div class="stat-label">Total reviews</div></div>
                <div class="stat"><div class="stat-value">${lecturer.highest ?? 0}%</div><div class="stat-label">Highest score</div></div>
                <div class="stat"><div class="stat-value">${lecturer.lowest ?? 0}%</div><div class="stat-label">Lowest score</div></div>`;

            renderBars(qs('#score-distribution'), lecturer.distribution, {
                '0-20': '0-20%', '21-40': '21-40%', '41-60': '41-60%', '61-80': '61-80%', '81-100': '81-100%',
            }, 'brand');

            renderBars(qs('#sentiment-breakdown'), lecturer.sentiment, {
                positive: 'Positive', neutral: 'Neutral', negative: 'Negative',
            }, 'sentiment');

            const list = qs('#review-list');
            if (!lecturer.reviews.length) {
                list.innerHTML = '<div class="empty-state">No reviews yet. Be the first to review.</div>';
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
                    <span><strong>${escapeHTML(review.student_name || 'Anonymous')}</strong> · ${escapeHTML(review.unit)}</span>
                    <span class="review-score">${review.score}%</span>
                </div>
                <div class="review-head">
                    <span>${escapeHTML(formatDate(review.created_at))}</span>
                    <span class="badge badge-${escapeHTML(review.sentiment)}">${escapeHTML(review.sentiment)}</span>
                </div>
                ${review.comment ? `<p class="review-comment">${escapeHTML(review.comment)}</p>` : ''}
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
        const slider = qs('#score-slider');
        const readout = qs('#score-readout');
        const errorBox = qs('#form-error');

        const params = new URLSearchParams(window.location.search);
        const presetLecturer = params.get('lecturer_id');

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
                const list = dept ? data.lecturers.filter((l) => l.department === dept) : data.lecturers;
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

        slider.addEventListener('input', () => {
            readout.textContent = `${slider.value}%`;
        });

        const student = session.student.get();
        if (student) {
            qs('#reviewer-name').value = student.name || '';
            qs('#reviewer-email').value = student.email || '';
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorBox.classList.add('hidden');

            const payload = {
                lecturer_id: lecturerSelect.value,
                unit: unitSelect.value,
                score: parseInt(slider.value, 10),
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

        // Student login
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

        // Lecturer login
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

        // Admin login
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
        initTheme();
        initNavbar();
        const init = pages[document.body.dataset.page];
        if (init) init();
    });
})();

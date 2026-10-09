/* =========================================================================
   EduReview — Frontend interactivity and API requests
   Pages: home | lecturer | add-review | login (student | lecturer | admin)
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

    /* Static-site fallback --------------------------------------------------
       GitHub Pages has no Flask backend, so when `/api` is unreachable we
       switch to a bundled demo dataset (plus anything the visitor submits,
       persisted to localStorage). Responses mirror the real API shapes.    */

    const DEMO_UNITS = [
        'Intro to Computing',
        'Discrete Math',
        'Software Design',
        'Data Structures',
        'Network Security',
        'AI Principles',
    ];
    const DEMO_DEPARTMENTS = ['Computing & AI', 'Engineering', 'Leadership'];
    const DEMO_LECTURERS = [
        { id: 1, name: 'Dr. Matin', department: 'Computing & AI' },
        { id: 2, name: 'Prof. Kwesi', department: 'Computing & AI' },
        { id: 3, name: 'Dr. Owili', department: 'Engineering' },
        { id: 4, name: 'Prof. Njeri', department: 'Engineering' },
        { id: 5, name: 'Dr. Rodriguez', department: 'Leadership' },
        { id: 6, name: 'Dr. Sang', department: 'Computing & AI' },
        { id: 7, name: 'Prof. Okello', department: 'Engineering' },
        { id: 8, name: 'Dr. Amina', department: 'Leadership' },
        { id: 9, name: 'Dr. Mutua', department: 'Computing & AI' },
        { id: 10, name: 'Prof. Zhao', department: 'Engineering' },
    ];

    function demoResponsesFor(clarity, reachOut, responsiveness, officeHours, assistance, material, discipline, engagement, participation, courseComment, classComment) {
        return {
            teaching_skills: { clarity },
            accessibility: { reach_out: reachOut, responsiveness, office_hours: officeHours, assistance },
            material_quality: { helpful_clear: material },
            class_management: { maintains_discipline: discipline, engaging_activities: engagement, ensures_participation: participation },
            comments: { course_material: courseComment, class_management: classComment },
        };
    }

    const DEMO_SEED_REVIEWS = [
        { id: 1, student_name: 'Samuel Ochieng', student_email: 'samuel@ngu.edu', lecturer_id: 1, lecturer_name: 'Dr. Matin', unit: 'Data Structures', score: 92, comment: 'Explains data structures with such clarity. Best lecturer I have had this year.', sentiment: 'positive', responses: demoResponsesFor(5, 5, 4, 5, 4, 5, 4, 5, 4, 'Well-paced and practical', 'Very interactive'), created_at: '2026-09-18T09:30:00Z' },
        { id: 2, student_name: 'Faith Njoroge', student_email: 'faith@ngu.edu', lecturer_id: 1, lecturer_name: 'Dr. Matin', unit: 'Software Design', score: 78, comment: 'Course is well organized but the pace can be fast. Reach out if you fall behind.', sentiment: 'neutral', created_at: '2026-08-27T14:10:00Z' },
        { id: 3, student_name: 'Brian Kiprop', student_email: 'brian@ngu.edu', lecturer_id: 1, lecturer_name: 'Dr. Matin', unit: 'Intro to Computing', score: 85, comment: 'Very approachable during office hours and helpful with debugging assignments.', sentiment: 'positive', created_at: '2026-07-30T11:05:00Z' },
        { id: 4, student_name: 'Diana Achieng', student_email: 'diana@ngu.edu', lecturer_id: 2, lecturer_name: 'Prof. Kwesi', unit: 'Discrete Math', score: 60, comment: 'The material is thorough but lectures feel rushed and slides are dense.', sentiment: 'negative', created_at: '2026-09-05T08:45:00Z' },
        { id: 5, student_name: 'Michael Otieno', student_email: 'michael@ngu.edu', lecturer_id: 2, lecturer_name: 'Prof. Kwesi', unit: 'Discrete Math', score: 88, comment: 'Excellent grasp of the subject and very patient with questions.', sentiment: 'positive', created_at: '2026-06-20T15:20:00Z' },
        { id: 6, student_name: 'Grace Wanjiru', student_email: 'grace@ngu.edu', lecturer_id: 3, lecturer_name: 'Dr. Owili', unit: 'Network Security', score: 95, comment: 'Hands-on labs are fantastic. You actually learn by doing in this class.', sentiment: 'positive', responses: demoResponsesFor(5, 5, 5, 5, 5, 5, 5, 5, 5, 'Labs tied theory to practice', 'Well managed'), created_at: '2026-09-21T10:00:00Z' },
        { id: 7, student_name: 'Kevin Mwangi', student_email: 'kevin@ngu.edu', lecturer_id: 3, lecturer_name: 'Dr. Owili', unit: 'Network Security', score: 72, comment: 'Solid course, though some practical sessions started a little late.', sentiment: 'neutral', created_at: '2026-08-12T13:30:00Z' },
        { id: 8, student_name: 'Lynn Adhiambo', student_email: 'lynn@ngu.edu', lecturer_id: 4, lecturer_name: 'Prof. Njeri', unit: 'AI Principles', score: 55, comment: 'Hard to follow at times; more worked examples would help a lot.', sentiment: 'negative', created_at: '2026-09-02T09:15:00Z' },
        { id: 9, student_name: 'Peter Kariuki', student_email: 'peter@ngu.edu', lecturer_id: 5, lecturer_name: 'Dr. Rodriguez', unit: 'Leadership', score: 90, comment: 'Engaging discussions and genuinely cares about student growth.', sentiment: 'positive', created_at: '2026-09-10T16:40:00Z' },
        { id: 10, student_name: 'Wendy Chebet', student_email: 'wendy@ngu.edu', lecturer_id: 5, lecturer_name: 'Dr. Rodriguez', unit: 'Leadership', score: 83, comment: 'Rewarding class. The group projects were very practical.', sentiment: 'positive', created_at: '2026-08-19T12:00:00Z' },
    ];

    const DEMO_POSITIVE_WORDS = new Set([
        'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'helpful', 'clear',
        'engaging', 'knowledgeable', 'passionate', 'inspiring', 'patient', 'friendly',
        'organized', 'effective', 'best', 'wonderful', 'brilliant', 'approachable',
        'supportive', 'insightful', 'enjoy', 'enjoyed', 'like', 'loved', 'love',
        'recommend', 'understanding', 'respectful', 'motivating',
    ]);
    const DEMO_NEGATIVE_WORDS = new Set([
        'bad', 'poor', 'terrible', 'awful', 'boring', 'confusing', 'unclear', 'rude',
        'harsh', 'disorganized', 'late', 'unprepared', 'inconsistent', 'difficult',
        'unhelpful', 'disrespectful', 'monotone', 'slow', 'worst', 'hate', 'hated',
        'dislike', 'unfair', 'unapproachable', 'dismissive',
    ]);
    const DEMO_NEGATIONS = new Set([
        'not', 'no', 'never', 'cannot', "can't", 'dont', "don't", 'doesnt', "doesn't",
        'isnt', "isn't", 'wasnt', "wasn't", 'wont', "won't",
    ]);

    let demoModePromise = null;
    function demoMode() {
        if (!demoModePromise) {
            demoModePromise = new Promise((resolve) => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 3000);
                fetch(API_BASE + '/health')
                    .then((response) => resolve(!response.ok))
                    .catch(() => resolve(true))
                    .finally(() => clearTimeout(timer));
            });
        }
        return demoModePromise;
    }

    function demoStore(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || 'null');
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function demoSentiment(text) {
        const tokens = String(text || '').toLowerCase().match(/[a-z']+/g) || [];
        let positive = 0;
        let negative = 0;
        for (let i = 0; i < tokens.length; i++) {
            const negated = i > 0 && DEMO_NEGATIONS.has(tokens[i - 1]);
            if (DEMO_POSITIVE_WORDS.has(tokens[i])) {
                if (negated) { negative += 1; } else { positive += 1; }
            } else if (DEMO_NEGATIVE_WORDS.has(tokens[i])) {
                if (negated) { positive += 1; } else { negative += 1; }
            }
        }
        if (positive > negative) return 'positive';
        if (negative > positive) return 'negative';
        return 'neutral';
    }

    function demoLocalReviews() {
        return demoStore('ngu_demo_reviews', []);
    }

    function demoLocalUsers() {
        return demoStore('ngu_demo_users', []);
    }

    function demoComputeStats(reviews) {
        const total = reviews.length;
        const distribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        const sentiment = { positive: 0, neutral: 0, negative: 0 };
        if (!total) {
            return { average_rating: 0, review_count: 0, highest: 0, lowest: 0, distribution, sentiment };
        }
        const scores = reviews.map((review) => review.score);
        reviews.forEach((review) => {
            const score = review.score;
            if (score <= 20) distribution['0-20'] += 1;
            else if (score <= 40) distribution['21-40'] += 1;
            else if (score <= 60) distribution['41-60'] += 1;
            else if (score <= 80) distribution['61-80'] += 1;
            else distribution['81-100'] += 1;
            sentiment[review.sentiment || 'neutral'] += 1;
        });
        return {
            average_rating: Math.round((scores.reduce((sum, score) => sum + score, 0) / total) * 100) / 100,
            review_count: total,
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            distribution,
            sentiment,
        };
    }

    function demoReviewsFor(lecturerId) {
        return [...DEMO_SEED_REVIEWS, ...demoLocalReviews()]
            .filter((review) => review.lecturer_id === Number(lecturerId))
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    }

    function demoFail(status, message) {
        const error = new Error(message);
        error.status = status;
        throw error;
    }

    function demoAuth(path, body) {
        const payload = body || {};
        const users = demoLocalUsers();
        const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

        if (path === '/auth/signup') {
            const name = String(payload.name || '').trim();
            const email = normalizeEmail(payload.email);
            const password = String(payload.password || '');
            if (name.length < 2) demoFail(400, 'Please enter your full name.');
            if (!email.includes('@')) demoFail(400, 'Please enter a valid email address.');
            if (password.length < 6) demoFail(400, 'Password must be at least 6 characters.');
            if (users.some((user) => user.email === email)) demoFail(409, 'An account with that email already exists.');

            const user = { id: users.reduce((max, item) => Math.max(max, item.id), 0) + 1, name, email, role: 'student', password };
            users.push(user);
            localStorage.setItem('ngu_demo_users', JSON.stringify(users));
            return Promise.resolve({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        }
        if (path === '/auth/login') {
            const email = normalizeEmail(payload.email);
            const password = String(payload.password || '');
            const user = users.find((item) => item.role === 'student' && item.email === email && item.password === password);
            if (!user) demoFail(401, 'Invalid email or password.');
            return Promise.resolve({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        }
        if (path === '/auth/admin/bootstrap') {
            const email = normalizeEmail(payload.email);
            if (!users.some((item) => item.role === 'admin' && item.email === email)) {
                users.push({
                    id: users.reduce((max, item) => Math.max(max, item.id), 0) + 1,
                    name: payload.name || 'Administrator',
                    email,
                    role: 'admin',
                    password: String(payload.password || ''),
                });
                localStorage.setItem('ngu_demo_users', JSON.stringify(users));
            }
            return Promise.resolve({ success: true });
        }
        if (path === '/auth/admin/login') {
            const email = normalizeEmail(payload.email);
            const password = String(payload.password || '');
            const admin = users.find((item) => item.role === 'admin' && item.email === email && item.password === password);
            if (!admin) demoFail(401, 'Invalid admin credentials.');
            return Promise.resolve({ success: true, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
        }
        demoFail(404, `Auth endpoint not found: ${path}`);
    }

    function demoApi(path, method, body) {
        const normalized = path.split(/[?#]/)[0].replace(/\/$/, '') || '/';
        const match = normalized.match(/^\/lecturers\/(\d+)$/);

        if (method === 'GET' && normalized === '/health') {
            return Promise.resolve({ success: true, status: 'ok' });
        }
        if (method === 'GET' && normalized === '/departments') {
            return Promise.resolve(DEMO_DEPARTMENTS);
        }
        if (method === 'GET' && normalized === '/units') {
            return Promise.resolve(DEMO_UNITS);
        }
        if (method === 'GET' && normalized === '/reviews') {
            return Promise.resolve(
                [...DEMO_SEED_REVIEWS, ...demoLocalReviews()].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
            );
        }
        if (method === 'GET' && normalized.startsWith('/reviews/lecturer/')) {
            return Promise.resolve(demoReviewsFor(Number(normalized.split('/').pop())));
        }
        if (method === 'GET' && normalized === '/lecturers') {
            return Promise.resolve(DEMO_LECTURERS.map((lecturer) => Object.assign({}, lecturer, demoComputeStats(demoReviewsFor(lecturer.id)))));
        }
        if (method === 'GET' && normalized === '/academic-data') {
            return Promise.resolve({
                departments: DEMO_DEPARTMENTS,
                units: DEMO_UNITS,
                lecturers: DEMO_LECTURERS.map((lecturer) => ({ id: lecturer.id, name: lecturer.name, department: lecturer.department, has_pin: false })),
            });
        }
        if (method === 'GET' && match) {
            const lecturer = DEMO_LECTURERS.find((item) => item.id === Number(match[1]));
            if (!lecturer) demoFail(404, 'Lecturer not found.');
            const reviews = demoReviewsFor(lecturer.id);
            return Promise.resolve(Object.assign({}, lecturer, { has_pin: false }, demoComputeStats(reviews), { reviews }));
        }
        if (method === 'GET' && normalized === '/analytics/overview') {
            const reviews = [...DEMO_SEED_REVIEWS, ...demoLocalReviews()];
            const stats = demoComputeStats(reviews);
            const ranked = DEMO_LECTURERS
                .map((lecturer) => {
                    const lecturerStats = demoComputeStats(demoReviewsFor(lecturer.id));
                    return { id: lecturer.id, name: lecturer.name, department: lecturer.department, average_rating: lecturerStats.average_rating, review_count: lecturerStats.review_count };
                })
                .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0) || (b.review_count || 0) - (a.review_count || 0));
            return Promise.resolve(Object.assign({}, stats, { ranked }));
        }
        if (method === 'GET' && normalized === '/lecturers/pins' ) {
            return Promise.resolve({ success: true, pins: [] });
        }

        if (method === 'POST' && normalized === '/reviews') {
            const payload = body || {};
            const lecturer = DEMO_LECTURERS.find((item) => item.id === Number(payload.lecturer_id));
            if (!lecturer) demoFail(404, 'Lecturer not found.');
            if (!payload.unit || !DEMO_UNITS.includes(payload.unit)) demoFail(400, 'Please choose a valid unit.');
            const score = Math.round(Number(payload.score));
            if (!Number.isFinite(score) || score < 0 || score > 100) demoFail(400, 'Score must be between 0 and 100.');
            if (!payload.responses || typeof payload.responses !== 'object') demoFail(400, 'Please answer every survey question.');
            const users = demoLocalUsers();
            const student = users.find((user) => user.role === 'student' && user.email === String(payload.student_email || '').toLowerCase());
            if (!student) demoFail(401, 'Please sign in as a student to submit a review.');

            const reviews = demoLocalReviews();
            const nextId = reviews.reduce((max, review) => Math.max(max, review.id), 0) + 1;
            const review = {
                id: nextId,
                student_name: student.name,
                student_email: student.email,
                lecturer_id: lecturer.id,
                lecturer_name: lecturer.name,
                unit: payload.unit,
                score,
                comment: payload.comment || null,
                sentiment: demoSentiment(payload.comment),
                responses: payload.responses,
                created_at: new Date().toISOString(),
            };
            reviews.push(review);
            localStorage.setItem('ngu_demo_reviews', JSON.stringify(reviews));
            return Promise.resolve(review);
        }
        if (method === 'POST' && normalized.startsWith('/auth/')) {
            return demoAuth(normalized, body);
        }

        demoFail(404, `Demo endpoint not found: ${method} ${normalized}`);
    }

    async function request(path, options = {}) {
        if (await demoMode()) {
            const method = String((options && options.method) || 'GET').toUpperCase();
            let body = options && options.body;
            if (typeof body === 'string') {
                try {
                    body = JSON.parse(body);
                } catch (error) {
                    body = null;
                }
            }
            return demoApi(path, method, body);
        }

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

    function getStudent() {
        return session.student.get();
    }

    function isStudentLoggedIn() {
        return Boolean(getStudent());
    }

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
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=480&h=360&q=60',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=480&h=360&q=60',
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
        const reviewCta = isStudentLoggedIn()
            ? `href="add-review.html?lecturer_id=${lecturer.id}"`
            : `href="login.html?redirect=${encodeURIComponent(`add-review.html?lecturer_id=${lecturer.id}`)}"`;
        return `
            <article class="lecturer-card">
                <a class="lecturer-photo" href="lecturer.html?id=${lecturer.id}" aria-label="${escapeHTML(lecturer.name)}">
                    <img src="${photo}" alt="${escapeHTML(lecturer.name)}" loading="lazy" decoding="async" />
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
                    <a class="btn btn-outline btn-sm btn-block mt-auto" ${reviewCta}>${isStudentLoggedIn() ? 'Write a Review' : 'Sign in to Review'}</a>
                </div>
            </article>`;
    }

    /* --------------------------------------------------------------------- */
    /* Navbar, search & mobile menu                                          */
    /* --------------------------------------------------------------------- */
    function initNavbar() {
        const active = document.body.dataset.page;
        qsa('.nav-links a, [data-menu-link]').forEach((link) => {
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
        const backdrop = qs('[data-nav-backdrop]');
        if (toggle && panel) {
            const closeBtn = qs('[data-nav-close]', panel);

            function setMenu(open) {
                panel.classList.toggle('open', open);
                if (backdrop) backdrop.classList.toggle('open', open);
                toggle.setAttribute('aria-expanded', String(open));
                document.body.classList.toggle('menu-open', open);
                if (open) {
                    if (closeBtn) closeBtn.focus();
                } else {
                    toggle.focus();
                }
            }

            toggle.addEventListener('click', () => setMenu(!panel.classList.contains('open')));
            if (closeBtn) closeBtn.addEventListener('click', () => setMenu(false));
            if (backdrop) backdrop.addEventListener('click', () => setMenu(false));
            panel.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', (event) => {
                    const url = new URL(link.href, window.location.href);
                    const sameDocument = url.hash
                        && url.pathname === window.location.pathname
                        && url.search === window.location.search;
                    if (sameDocument) {
                        const target = document.getElementById(url.hash.slice(1));
                        if (target) {
                            event.preventDefault();
                            setMenu(false);
                            if (window.location.hash !== url.hash) {
                                history.replaceState(null, '', url.hash);
                            }
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            return;
                        }
                    }
                    setMenu(false);
                });
            });
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && panel.classList.contains('open')) setMenu(false);
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

        const departmentImages = {
            'computing & ai': 'photo-1522202176988-66273c2fd55f',
            'engineering': 'photo-1581091226825-a6a2a5aee158',
            'leadership': 'photo-1596495578065-6e0763fa1178',
        };
        const fallbackImage = 'photo-1524178232363-1fb2b075b655';

        host.innerHTML = departments
            .map((dept) => {
                const count = lecturers.filter((lecturer) => lecturer.department === dept).length;
                const imageId = departmentImages[dept.toLowerCase()] || fallbackImage;
                const src = `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=640&h=360&q=55`;
                return `
                    <a class="department-card" href="index.html?department=${encodeURIComponent(dept)}#directory">
                        <div class="department-media">
                            <img src="${src}" alt="" width="640" height="360" loading="lazy" decoding="async" />
                        </div>
                        <div class="department-body">
                            <div class="flex items-center justify-between">
                                <span class="eyebrow">School</span>
                                <span class="badge badge-brand">${count} Members</span>
                            </div>
                            <h3 class="dep-name mt-4 mb-1">${escapeHTML(dept)}</h3>
                            <p class="muted text-sm mb-0">Browse faculty, ratings and student evaluations.</p>
                        </div>
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
            photo.decoding = 'async';
            photo.fetchPriority = 'high';

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
            if (!isStudentLoggedIn()) {
                qs('#write-review-link').href = `login.html?redirect=${encodeURIComponent(`add-review.html?lecturer_id=${lecturer.id}`)}`;
                qs('#write-review-link').textContent = 'Sign in to Review';
            }
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

        const params = new URLSearchParams(window.location.search);
        const presetLecturer = params.get('lecturer_id');

        const gate = qs('#review-gate');
        const card = qs('#review-card');
        const gateLink = qs('#gate-login-link');

        const student = getStudent();

        if (!student) {
            if (card) card.classList.add('hidden');
            if (gate) {
                gate.classList.remove('hidden');
                if (gateLink) {
                    const redirect = 'add-review.html' + (presetLecturer ? `?lecturer_id=${presetLecturer}` : '');
                    gateLink.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
                }
            }
            return;
        }

        if (gate) gate.classList.add('hidden');
        if (card) card.classList.remove('hidden');
        if (!card) return;

        const identity = qs('#identity-note');
        if (identity) {
            identity.innerHTML =
                `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Submitting as ` +
                `<strong>${escapeHTML(student.name)}</strong> ` +
                `(<span class="lowercase">${escapeHTML(student.email)}</span>) — verified student account.`;
        }

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

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorBox.classList.add('hidden');

            if (!isStudentLoggedIn()) {
                errorBox.textContent = 'Please sign in as a student to submit a review.';
                errorBox.classList.remove('hidden');
                return;
            }

            function checkedValue(name) {
                const el = form.querySelector(`input[name="${name}"]:checked`);
                return el ? el.value : null;
            }

            function checkedBox(id) {
                const el = qs(`#${id}`);
                return Boolean(el && el.checked);
            }

            // Section 01 + 02: numeric ratings (all required).
            const clarity = checkedValue('clarity');
            const accessibility = {};
            ['reach_out', 'responsiveness', 'office_hours', 'assistance'].forEach((key) => {
                accessibility[key] = checkedValue(key);
            });

            // Section 03: material quality answer (required).
            const materialQuality = checkedValue('material_quality');

            const requiredRatings = [clarity, accessibility.reach_out, accessibility.responsiveness, accessibility.office_hours, accessibility.assistance];
            if (requiredRatings.some((value) => value === null)) {
                errorBox.textContent = 'Please rate teaching clarity and all four accessibility aspects to continue.';
                errorBox.classList.remove('hidden');
                return;
            }
            if (!materialQuality) {
                errorBox.textContent = 'Please answer whether the course materials were helpful and clear.';
                errorBox.classList.remove('hidden');
                return;
            }

            // Overall score = average of the five 1–5 ratings, scaled to 0–100.
            const numeric = requiredRatings.map(Number);
            const score = Math.round((numeric.reduce((sum, v) => sum + v, 0) / (numeric.length * 5)) * 100);

            const courseComment = qs('#course-comment').value.trim();
            const classComment = qs('#class-comment').value.trim();

            const responses = {
                teaching_skills: { clarity: Number(clarity) },
                accessibility: {
                    reach_out: Number(accessibility.reach_out),
                    responsiveness: Number(accessibility.responsiveness),
                    office_hours: Number(accessibility.office_hours),
                    assistance: Number(accessibility.assistance),
                },
                material_quality: { helpful_clear: materialQuality },
                class_management: {
                    maintains_discipline: checkedBox('check-discipline'),
                    engaging_activities: checkedBox('check-engagement'),
                    ensures_participation: checkedBox('check-participation'),
                },
                comments: {
                    course_material: courseComment,
                    class_management: classComment,
                },
            };

            const payload = {
                lecturer_id: lecturerSelect.value,
                unit: unitSelect.value,
                score,
                comment: [courseComment, classComment].filter(Boolean).join(' '),
                responses,
                student_name: student.name,
                student_email: student.email,
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
    /* Page: login — unified role-based portal                               */
    /* --------------------------------------------------------------------- */
    async function initLogin() {
        const params = new URLSearchParams(window.location.search);

        const ROLE_COPY = {
            student: { eyebrow: 'Student Portal', title: 'Student sign in', sub: 'Sign in to evaluate your lecturers.' },
            lecturer: { eyebrow: 'Faculty Portal', title: 'Lecturer sign in', sub: 'Access your anonymized student feedback.' },
            admin: { eyebrow: 'Admin Console', title: 'Administrator sign in', sub: 'Restricted to authorized NGU staff.' },
        };

        // Toggle between the student "login" and "signup" sub-views.
        let studentView = 'login';

        function safeRedirect() {
            const redirect = params.get('redirect') || '';
            return /^[\w-]+\.html/.test(redirect) ? redirect : 'index.html';
        }

        /* -------------------------------------------------------------- */
        /* Role switching                                                  */
        /* -------------------------------------------------------------- */
        const tabs = qsa('[role="tab"]');

        function setRole(role) {
            document.body.dataset.role = role;
            tabs.forEach((tab) => {
                const active = tab.dataset.roleTab === role;
                tab.classList.toggle('active', active);
                tab.setAttribute('aria-selected', String(active));
                tab.tabIndex = active ? 0 : -1;
            });
            qsa('[data-role-panel]').forEach((panel) => {
                panel.classList.toggle('hidden', panel.dataset.rolePanel !== role);
            });
            qsa('[data-role-brand]').forEach((block) => {
                block.classList.toggle('hidden', block.dataset.roleBrand !== role);
            });

            if (role === 'student') {
                syncStudentHeading();
            } else {
                qs('#auth-eyebrow').textContent = ROLE_COPY[role].eyebrow;
                qs('#auth-title').textContent = ROLE_COPY[role].title;
                qs('#auth-sub').textContent = ROLE_COPY[role].sub;
            }

            history.replaceState(null, '', `#${role}`);
            focusFirstField(role);
        }

        function syncStudentHeading() {
            qs('#auth-eyebrow').textContent = 'Student Portal';
            if (studentView === 'signup') {
                qs('#auth-title').textContent = 'Create student account';
                qs('#auth-sub').textContent = 'Register to start evaluating your lecturers.';
            } else {
                qs('#auth-title').textContent = 'Student sign in';
                qs('#auth-sub').textContent = 'Sign in to evaluate your lecturers.';
            }
        }

        function focusFirstField(role) {
            const panel = qs(`[data-role-panel="${role}"]`);
            const first = qs('input, select', panel);
            if (first) first.focus({ preventScroll: true });
        }

        function showStudentView(view) {
            studentView = view;
            qs('#student-login-form').classList.toggle('hidden', view !== 'login');
            qs('#student-signup-form').classList.toggle('hidden', view !== 'signup');
            qs('[data-login-switch-text]').classList.toggle('hidden', view !== 'login');
            qs('[data-signup-switch-text]').classList.toggle('hidden', view !== 'signup');
            syncStudentHeading();
            const form = qs(view === 'signup' ? '#student-signup-form' : '#student-login-form');
            const first = qs('input, select', form);
            if (first) first.focus({ preventScroll: true });
        }

        tabs.forEach((tab) => tab.addEventListener('click', () => setRole(tab.dataset.roleTab)));
        qs('.segmented').addEventListener('keydown', (event) => {
            const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            const index = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            event.preventDefault();
            tabs[next].focus();
            setRole(tabs[next].dataset.roleTab);
        });

        /* -------------------------------------------------------------- */
        /* Field validation (focus ring, red error, green success)         */
        /* -------------------------------------------------------------- */
        const hasNumber = (value) => /\d/.test(value);
        const hasUpper = (value) => /[A-Z]/.test(value);
        const strengthOk = (value) => value.length >= 8 && hasNumber(value) && hasUpper(value);

        const RULES = {
            'student-email': { required: true, message: 'Enter your email or student ID.' },
            'student-password': { required: true, message: 'Password is required.' },
            'signup-name': { required: true, message: 'Full name is required.' },
            'signup-email': { required: true, email: true, message: 'Enter a valid institutional email.' },
            'signup-student-id': { required: true, pattern: /^\d{6,12}$/, message: 'Enter your 6-12 digit student ID.' },
            'signup-department': { required: true, message: 'Choose your department.' },
            'signup-password': { required: true, message: 'Enter a password.', custom: (v) => strengthOk(v), customMessage: 'Meet the strength checklist to continue.' },
            'signup-confirm': { required: true, message: 'Confirm your password.', custom: (v) => v === qs('#signup-password').value, customMessage: 'Passwords do not match.' },
            'lecturer-email': { required: true, message: 'Enter your faculty email or ID.' },
            'lecturer-password': { required: true, message: 'Password is required.' },
            'lecturer-2fa': { optional: true, pattern: /^\d{6}$/, message: 'Enter the 6-digit code.' },
            'admin-username': { required: true, message: 'Username is required.' },
            'admin-password': { required: true, message: 'Password is required.' },
        };

        function setFieldState(field, valid, message) {
            const wrap = field.closest('.field');
            if (!wrap) return;
            wrap.classList.toggle('is-valid', valid);
            wrap.classList.toggle('is-error', !valid);
            const help = qs('.field-help', wrap);
            if (help) {
                help.textContent = message || '';
                help.classList.remove('error', 'success');
                if (message) help.classList.add(valid ? 'success' : 'error');
            }
        }

        function validateField(field) {
            const rule = RULES[field.id];
            if (!rule) return true;
            const value = field.value.trim();
            let valid = true;
            let message = '';

            if (rule.optional && !value) {
                valid = true;
            } else if (rule.required && !value) {
                valid = false;
                message = rule.message;
            } else if (value && rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                valid = false;
                message = rule.message;
            } else if (value && rule.pattern && !rule.pattern.test(value)) {
                valid = false;
                message = rule.message;
            } else if (rule.custom) {
                valid = rule.custom(value);
                if (!valid) message = rule.customMessage || rule.message;
            }
            if (valid) message = '';
            setFieldState(field, valid, message);
            return valid;
        }

        function validateForm(ids) {
            return ids.every((id) => {
                const field = qs(`#${id}`);
                if (!field || field.closest('.hidden')) return true;
                return validateField(field);
            });
        }

        // Re-validate while typing, once a field has been flagged.
        qsa('.role-panel input, .role-panel select').forEach((field) => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.closest('.field.is-error')) validateField(field);
            });
        });

        /* -------------------------------------------------------------- */
        /* Password visibility toggles                                     */
        /* -------------------------------------------------------------- */
        qsa('[data-pwd-toggle]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = qs(`#${btn.dataset.pwdToggle}`);
                const show = target.type === 'password';
                target.type = show ? 'text' : 'password';
                const icon = qs('i', btn);
                icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-regular fa-eye';
                btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
                btn.setAttribute('aria-pressed', String(show));
            });
        });

        /* -------------------------------------------------------------- */
        /* Password strength meter (signup)                                */
        /* -------------------------------------------------------------- */
        const strengthInput = qs('#signup-password');
        const strengthMeta = qs('[data-pwd-meta]');

        function evaluatePassword(value) {
            const checks = [
                { key: 'length', pass: value.length >= 8 },
                { key: 'number', pass: hasNumber(value) },
                { key: 'upper', pass: hasUpper(value) },
            ];
            checks.forEach((check) => {
                const item = qs(`[data-check="${check.key}"]`);
                if (!item) return;
                item.classList.toggle('checked', check.pass);
                const icon = qs('i', item);
                icon.className = check.pass ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle';
            });

            const score = checks.filter((c) => c.pass).length;
            const styles = [
                { width: 0, color: '#DC2626', label: 'Too weak' },
                { width: 25, color: '#DC2626', label: 'Weak' },
                { width: 50, color: '#EAB308', label: 'Fair' },
                { width: 75, color: '#22C55E', label: 'Good' },
                { width: 100, color: '#22C55E', label: 'Strong' },
            ];
            const fill = qs('[data-strength-fill]');
            const label = qs('[data-strength-label]');
            if (fill && label) {
                fill.style.width = `${styles[score].width}%`;
                fill.style.background = styles[score].color;
                label.textContent = `${styles[score].label} · ${score}/3 criteria`;
            }
        }

        strengthInput.addEventListener('focus', () => strengthMeta.classList.add('visible'));
        strengthInput.addEventListener('blur', () => {
            strengthMeta.classList.remove('visible');
            validateField(strengthInput);
        });
        strengthInput.addEventListener('input', () => evaluatePassword(strengthInput.value));

        /* -------------------------------------------------------------- */
        /* Student login / signup                                          */
        /* -------------------------------------------------------------- */
        const remembered = localStorage.getItem('ngu_remember');
        if (remembered) {
            qs('#student-email').value = remembered;
            qs('#student-remember').checked = true;
        }

        qs('#show-signup').addEventListener('click', (event) => {
            event.preventDefault();
            showStudentView('signup');
        });
        qs('#show-login').addEventListener('click', (event) => {
            event.preventDefault();
            showStudentView('login');
        });

        qs('#student-login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateForm(['student-email', 'student-password'])) return;
            const button = qs('#student-login-btn');
            button.disabled = true;
            try {
                const data = await api.post('/auth/login', {
                    email: qs('#student-email').value,
                    password: qs('#student-password').value,
                });
                if (qs('#student-remember').checked) {
                    localStorage.setItem('ngu_remember', qs('#student-email').value);
                } else {
                    localStorage.removeItem('ngu_remember');
                }
                session.student.set(data.user);
                toast(`Welcome back, ${data.user.name}`);
                setTimeout(() => (window.location.href = safeRedirect()), 600);
            } catch (error) {
                toast(error.message, 'error');
                button.disabled = false;
            }
        });

        qs('#student-signup-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const fields = ['signup-name', 'signup-email', 'signup-student-id', 'signup-department', 'signup-password', 'signup-confirm'];
            if (!validateForm(fields)) return;
            const button = qs('#student-signup-btn');
            button.disabled = true;
            try {
                await api.post('/auth/signup', {
                    name: qs('#signup-name').value,
                    email: qs('#signup-email').value,
                    password: qs('#signup-password').value,
                    // additional fields for a future account profile
                    student_id: qs('#signup-student-id').value,
                    department: qs('#signup-department').value,
                });
                toast('Account created. Please sign in.');
                showStudentView('login');
            } catch (error) {
                toast(error.message, 'error');
            } finally {
                button.disabled = false;
            }
        });

        qs('#forgot-password').addEventListener('click', (event) => {
            event.preventDefault();
            toast('Password reset is not wired — connect your provider here.', 'error');
        });

        /* -------------------------------------------------------------- */
        /* Lecturer login (2FA / SSO) — handlers are mock-ready            */
        /* -------------------------------------------------------------- */
        qsa('[data-method]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                qsa('[data-method]').forEach((b) => {
                    const active = b === btn;
                    b.classList.toggle('active', active);
                    b.setAttribute('aria-pressed', String(active));
                });
                qsa('[data-method-fields]').forEach((wrap) => {
                    wrap.classList.toggle('hidden', wrap.dataset.methodFields !== method);
                });
                qsa('[data-2fa-field]').forEach((wrap) => {
                    wrap.classList.toggle('hidden', method !== 'password');
                });
            });
        });

        qs('#lecturer-login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateForm(['lecturer-email', 'lecturer-password', 'lecturer-2fa'])) return;
            // TODO: plug your authentication API here (e.g. POST /api/lecturers/login).
            console.warn('[EduReview] mock lecturer login:', {
                identifier: qs('#lecturer-email').value,
                twoFactor: qs('#lecturer-2fa').value,
            });
            toast('Lecturer authentication is ready to connect — see the handler.', 'error');
        });

        qs('#lecturer-sso-btn').addEventListener('click', () => {
            toast('SSO is not configured — wire your identity provider here.', 'error');
        });

        qs('#forgot-faculty-password').addEventListener('click', (event) => {
            event.preventDefault();
            toast('Faculty password reset is not wired — connect your provider here.', 'error');
        });

        /* -------------------------------------------------------------- */
        /* Admin login (real endpoint)                                     */
        /* -------------------------------------------------------------- */
        qs('#admin-login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validateForm(['admin-username', 'admin-password'])) return;
            const button = qs('#admin-login-btn');
            button.disabled = true;
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
                button.disabled = false;
            }
        });

        /* -------------------------------------------------------------- */
        /* Initial state (deep links: #student, #signup, #lecturer, #admin)*/
        /* -------------------------------------------------------------- */
        const initialRole = ['lecturer', 'admin'].includes(window.location.hash.slice(1))
            ? window.location.hash.slice(1)
            : 'student';
        setRole(initialRole);
        if (initialRole === 'student' && window.location.hash === '#signup') {
            showStudentView('signup');
        }
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
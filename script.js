// ========== DATA ==========
const QUESTIONS = [
    { skill: 'confidence', q: 'How comfortable are you speaking in public?', options: ['Very uncomfortable', 'Somewhat uncomfortable', 'Comfortable', 'Very comfortable'], weights: [1,2,3,4] },
    { skill: 'communication', q: 'How often do you express your thoughts clearly?', options: ['Rarely', 'Sometimes', 'Often', 'Always'], weights: [1,2,3,4] },
    { skill: 'leadership', q: 'Do you take initiative in group projects?', options: ['Never', 'Rarely', 'Often', 'Always'], weights: [1,2,3,4] },
    { skill: 'emotional', q: 'How well do you manage stress under pressure?', options: ['Very poorly', 'Poorly', 'Well', 'Very well'], weights: [1,2,3,4] },
    { skill: 'teamwork', q: 'How well do you collaborate with others?', options: ['Very poorly', 'Poorly', 'Well', 'Very well'], weights: [1,2,3,4] },
    { skill: 'confidence', q: 'Do you believe in your own abilities?', options: ['Not at all', 'Sometimes', 'Mostly', 'Completely'], weights: [1,2,3,4] },
    { skill: 'communication', q: 'How often do you listen actively?', options: ['Rarely', 'Sometimes', 'Often', 'Always'], weights: [1,2,3,4] },
    { skill: 'leadership', q: 'Do you inspire others to take action?', options: ['Never', 'Rarely', 'Often', 'Always'], weights: [1,2,3,4] },
    { skill: 'emotional', q: 'How well do you handle criticism?', options: ['Very poorly', 'Poorly', 'Well', 'Very well'], weights: [1,2,3,4] },
    { skill: 'teamwork', q: 'Do you resolve conflicts effectively?', options: ['Never', 'Rarely', 'Often', 'Always'], weights: [1,2,3,4] }
];

const LESSONS = [
    { id: 'l1', skill: 'confidence', title: 'Speak with Confidence', videoId: 'eVFzbxmKNUw' },
    { id: 'l2', skill: 'communication', title: 'Active Listening', videoId: '7wUCyjiyXdg' },
    { id: 'l3', skill: 'leadership', title: 'Lead Like a Pro', videoId: 'hb025vn6qXk' },
    { id: 'l4', skill: 'emotional', title: 'Emotional Intelligence', videoId: 'e8JMWtwdLQ4' },
    { id: 'l5', skill: 'teamwork', title: 'Collaborate Better', videoId: 'v9aaMnAYGGI' }
];

const CHALLENGES = [
    { id: 'c1', skill: 'confidence', title: 'Record a 1‑minute intro about yourself' },
    { id: 'c2', skill: 'communication', title: 'Record a 30‑second elevator pitch' },
    { id: 'c3', skill: 'leadership', title: 'Record a 2‑minute motivational speech' }
];

// ========== STATE ==========
let currentUser = null;
let currentQuestion = 0;
let quizAnswers = [];
let currentChallengeId = null;
let cameraStream = null;

// ========== DOM REFS ==========
const loginScreen = document.getElementById('loginScreen');
const signupScreen = document.getElementById('signupScreen');
const homeScreen = document.getElementById('homeScreen');
const assessmentScreen = document.getElementById('assessmentScreen');
const resultScreen = document.getElementById('resultScreen');
const lessonsScreen = document.getElementById('lessonsScreen');
const challengesScreen = document.getElementById('challengesScreen');

// ========== AUTH ==========
document.getElementById('goToSignup').addEventListener('click', () => { loginScreen.classList.remove('active'); signupScreen.classList.add('active'); });
document.getElementById('goToLogin').addEventListener('click', () => { signupScreen.classList.remove('active'); loginScreen.classList.add('active'); });

document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    if (!name || !email || !password) return alert('Fill all fields');
    if (localStorage.getItem('user_' + email)) return alert('Email already registered');
    const user = { name, email, password, progress: 0, level: 'Beginner', tasksDone: 0, quizResults: {}, watchedVideos: [], doneChallenges: [] };
    localStorage.setItem('user_' + email, JSON.stringify(user));
    localStorage.setItem('currentUser', email);
    currentUser = user;
    showHome();
});
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const data = localStorage.getItem('user_' + email);
    if (!data) return alert('User not found');
    const user = JSON.parse(data);
    if (user.password !== password) return alert('Wrong password');
    localStorage.setItem('currentUser', email);
    currentUser = user;
    showHome();
});




document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    loginScreen.classList.add('active');
});

// ========== NAVIGATION ==========
function showHome() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    homeScreen.classList.add('active');
    document.getElementById('greetingName').textContent = currentUser.name;
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    updateHomeStats();
}

function updateHomeStats() {
    const prog = currentUser.progress || 0;
    document.getElementById('progressPercent').textContent = prog + '%';
    document.getElementById('userLevel').textContent = currentUser.level || 'Beginner';
    document.getElementById('tasksDone').textContent = currentUser.tasksDone || 0;
    checkAndShowCertificate();
}

// ========== BACK BUTTONS ==========
document.getElementById('backHomeFromAssessment').addEventListener('click', showHome);
document.getElementById('backHomeFromResult').addEventListener('click', showHome);
document.getElementById('backHomeFromLessons').addEventListener('click', showHome);
document.getElementById('backHomeFromChallenges').addEventListener('click', showHome);
document.getElementById('goToHomeFromResult').addEventListener('click', showHome);

// ========== ASSESSMENT ==========
document.getElementById('startAssessmentBtn').addEventListener('click', () => {
    currentQuestion = 0;
    quizAnswers = [];
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    assessmentScreen.classList.add('active');
    renderQuestion();
});

function renderQuestion() {
    const q = QUESTIONS[currentQuestion];
    document.getElementById('qProgress').textContent = `${currentQuestion + 1} / ${QUESTIONS.length}`;
    document.getElementById('assessmentProgress').style.width = ((currentQuestion + 1) / QUESTIONS.length * 100) + '%';
    document.getElementById('qText').textContent = q.q;
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="q" value="${idx}"> ${opt}`;
        label.addEventListener('click', () => {
            document.querySelectorAll('#optionsContainer label').forEach(l => l.classList.remove('selected'));
            label.classList.add('selected');
            const selected = document.querySelector('input[name="q"]:checked');
            if (selected) {
                quizAnswers[currentQuestion] = parseInt(selected.value);
                if (currentQuestion === QUESTIONS.length - 1) {
                    document.getElementById('submitAssessmentBtn').style.display = 'block';
                    document.getElementById('nextQuestionBtn').style.display = 'none';
                } else {
                    document.getElementById('nextQuestionBtn').style.display = 'block';
                }
            }
        });
        container.appendChild(label);
    });
    document.getElementById('nextQuestionBtn').style.display = 'none';
    document.getElementById('submitAssessmentBtn').style.display = 'none';
}


document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    if (quizAnswers[currentQuestion] === undefined) return alert('Please select an answer');
    currentQuestion++;
    renderQuestion();
});

document.getElementById('submitAssessmentBtn').addEventListener('click', () => {
    if (quizAnswers[currentQuestion] === undefined) return alert('Please select an answer');
    // حساب النتائج
    const skillScores = {};
    QUESTIONS.forEach((q, idx) => {
        const weight = q.weights[quizAnswers[idx]] || 1;
        const score = (weight / 4) * 100;
        skillScores[q.skill] = (skillScores[q.skill] || 0) + score / QUESTIONS.filter(x => x.skill === q.skill).length;
    });
    currentUser.quizResults = skillScores;
    // تحديد المستوى
    const avg = Object.values(skillScores).reduce((a, b) => a + b, 0) / Object.values(skillScores).length;
    currentUser.level = avg >= 70 ? 'Advanced' : avg >= 40 ? 'Intermediate' : 'Beginner';
    currentUser.progress = Math.round(avg);
    // حفظ
    localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
    // عرض النتيجة
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    resultScreen.classList.add('active');
    showResults(skillScores);
});

function showResults(scores) {
    const container = document.getElementById('resultContent');
    let html = `<h3>📊 Your Soft Skills Profile</h3><p>Overall Level: <strong>${currentUser.level}</strong></p>`;
    const entries = Object.entries(scores);
    const strengths = entries.filter(([k, v]) => v >= 60);
    const weaknesses = entries.filter(([k, v]) => v < 50);
    html += `<div style="margin:12px 0;"><strong>Strengths ✅</strong><br>${strengths.length ? strengths.map(([k,v]) => `${k}: ${Math.round(v)}%`).join(' • ') : 'Keep going!'}</div>`;
    html += `<div style="margin:12px 0;"><strong>Areas to improve 📈</strong><br>${weaknesses.length ? weaknesses.map(([k,v]) => `${k}: ${Math.round(v)}%`).join(' • ') : 'Great job! You are well balanced.'}</div>`;
    container.innerHTML = html;
}

// ========== LESSONS ==========
document.getElementById('viewLessonsBtn').addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    lessonsScreen.classList.add('active');
    renderLessons();
});

function renderLessons() {
    const container = document.getElementById('lessonList');
    container.innerHTML = '';
    LESSONS.forEach(lesson => {
        const watched = currentUser.watchedVideos.includes(lesson.id);
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML =`
            <h4>${lesson.title}</h4>
            <p>Skill: ${lesson.skill}</p>
            <iframe src="https://www.youtube.com/embed/${lesson.videoId}" frameborder="0" allowfullscreen></iframe>
            <button class="watch-btn ${watched ? 'watched' : ''}" data-id="${lesson.id}">${watched ? '✅ Watched' : '📺 Mark as Watched'}</button>
        `;
        container.appendChild(card);
        const btn = card.querySelector('.watch-btn');
        btn.addEventListener('click', () => {
            if (!currentUser.watchedVideos.includes(lesson.id)) {
                currentUser.watchedVideos.push(lesson.id);
                currentUser.tasksDone = (currentUser.tasksDone || 0) + 1;
                btn.textContent = '✅ Watched';
                btn.classList.add('watched');
                localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
                updateHomeStats();
            }
        });
    });
    btn.addEventListener('click', () => {
    if (!currentUser.watchedVideos.includes(lesson.id)) {
        currentUser.watchedVideos.push(lesson.id);
        currentUser.tasksDone = (currentUser.tasksDone || 0) + 1;
        btn.textContent = '✅ Watched';
        btn.classList.add('watched');
        localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
        updateHomeStats();
        // التنبيه التحفيزي
        const msg = getRandomMotivation();
        showMotivation(`You watched a lesson! ${msg.msg}, msg.emoji`);
        checkAndShowCertificate();
    }
});
}


// ========== CHALLENGES ==========
document.getElementById('viewChallengesBtn').addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    challengesScreen.classList.add('active');
    renderChallenges();
});
const MOTIVATIONAL_MESSAGES = [
    { emoji: '🌟', msg: 'Amazing! You\'re on fire!' },
    { emoji: '💪', msg: 'Keep going! You\'re doing great!' },
    { emoji: '🔥', msg: 'You\'re unstoppable!' },
    { emoji: '🎉', msg: 'Great job! One step closer!' },
    { emoji: '🚀', msg: 'You\'re building a great habit!' },
    { emoji: '💎', msg: 'Every step counts. Well done!' },
    { emoji: '🌱', msg: 'You\'re growing every day!' },
    { emoji: '🏆', msg: 'You\'re a champion!' },
    { emoji: '✨', msg: 'Keep shining! You\'re amazing!' },
    { emoji: '💫', msg: 'Focus and determination. Perfect!' }
];

function getRandomMotivation() {
    const index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    return MOTIVATIONAL_MESSAGES[index];
}


function renderChallenges() {
    const container = document.getElementById('challengeList');
    container.innerHTML = '';
    CHALLENGES.forEach(ch => {
        const done = currentUser.doneChallenges.includes(ch.id);
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML =`
            <h4>${ch.title}</h4>
            <p>Skill: ${ch.skill}</p>
            <button class="challenge-done-btn ${done ? 'done' : ''}" data-id="${ch.id}">${done ? '✅ Done' : '🎯 Start Challenge'}</button>
        `;
        container.appendChild(card);
        const btn = card.querySelector('.challenge-done-btn');
        btn.addEventListener('click', () => {
            if (done) return;
            currentChallengeId = ch.id;
            document.getElementById('cameraContainer').style.display = 'block';
            document.getElementById('challengeDoneBtn').style.display = 'block';
            document.getElementById('startCameraBtn').style.display = 'inline-block';
            document.getElementById('stopCameraBtn').style.display = 'none';
            alert('Open camera and record yourself doing the challenge. Then click "I Did It"');
        });
    });
    document.getElementById('challengeDoneBtn').addEventListener('click', () => {
    if (!currentChallengeId) return;
    if (!currentUser.doneChallenges.includes(currentChallengeId)) {
        currentUser.doneChallenges.push(currentChallengeId);
        currentUser.tasksDone = (currentUser.tasksDone || 0) + 1;
        currentUser.progress = Math.min(100, currentUser.progress + 5);
        localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
        updateHomeStats();
        // التنبيه التحفيزي
        const msg = getRandomMotivation();
        showMotivation(`Challenge completed! ${msg.msg}, msg.emoji`);
        checkAndShowCertificate();
        // ... باقي الكود
    }
});
function updateHomeStats() {
    const prog = currentUser.progress || 0;
    document.getElementById('progressPercent').textContent = prog + '%';
    document.getElementById('userLevel').textContent = currentUser.level || 'Beginner';
    document.getElementById('tasksDone').textContent = currentUser.tasksDone || 0;
    
    // تنبيهات عند نسب تقدم معينة
    if (prog === 25) showMotivation('🎯 25% done! Keep pushing!', '🔥');
    else if (prog === 50) showMotivation('⚡ Halfway there! You\'re amazing!', '⚡');
    else if (prog === 75) showMotivation('🚀 Almost there! Just 25% left!', '🚀');
    else if (prog === 100) showMotivation('🎓 YOU DID IT! Congratulations! 🎉', '🏆');
    
    checkAndShowCertificate();
}
    
}

// ========== CAMERA ==========
document.getElementById('startCameraBtn').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraStream = stream;
        const video = document.getElementById('cameraFeed');
        video.srcObject = stream;
        video.style.display = 'block';
        document.getElementById('startCameraBtn').style.display = 'none';
        document.getElementById('stopCameraBtn').style.display = 'inline-block';
    } catch (err) {
        alert('Camera access denied. Please allow camera and microphone.');
    }
});

document.getElementById('stopCameraBtn').addEventListener('click', () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
    }
    document.getElementById('cameraFeed').srcObject = null;
    document.getElementById('cameraFeed').style.display = 'none';
    document.getElementById('startCameraBtn').style.display = 'inline-block';
    document.getElementById('stopCameraBtn').style.display = 'none';
});

document.getElementById('challengeDoneBtn').addEventListener('click', () => {
    if (!currentChallengeId) return;
    if (!currentUser.doneChallenges.includes(currentChallengeId)) {
        currentUser.doneChallenges.push(currentChallengeId);
        currentUser.tasksDone = (currentUser.tasksDone || 0) + 1;
        currentUser.progress = Math.min(100, currentUser.progress + 5);
        localStorage.setItem('user_' + currentUser.email, JSON.stringify(currentUser));
        updateHomeStats();
        // إيقاف الكاميرا
        document.getElementById('stopCameraBtn').click();
        document.getElementById('cameraContainer').style.display = 'none';
        renderChallenges();
        alert('✅ Challenge completed! Well done!');
    }
});

// ========== INIT ==========
const savedEmail = localStorage.getItem('currentUser');
if (savedEmail) {
    const data = localStorage.getItem('user_' + savedEmail);
    if (data) {
        currentUser = JSON.parse(data);
        showHome();
    } else {
        loginScreen.classList.add('active');
    }
} else {
    loginScreen.classList.add('active');
}

// ============================================================
//  1. دالة التحقق: هل خلص كل حاجة؟
// ============================================================
function checkAndShowCertificate() {
    const totalLessons = LESSONS.length;
    const totalChallenges = CHALLENGES.length;
    const watched = currentUser.watchedVideos.length;
    const done = currentUser.doneChallenges.length;

    if (watched >= totalLessons && done >= totalChallenges) {
        showCertificatePopup();
    }
}

// ============================================================
//  2. دالة عرض الشهادة (تظهر تلقائياً)
// ============================================================
function showCertificatePopup() {
    const name = currentUser.name;
    const level = currentUser.level;
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>🎓 Certificate – GrowMe</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body {
                background: #f0fdf4;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: 'Georgia', 'Times New Roman', serif;
                padding: 20px;
            }
            .cert {
                background: white;
                padding: 50px 40px;
                border-radius: 16px;
                border: 6px solid #10b981;
                max-width: 650px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                color: #111827;
                position: relative;
            }
            .cert .crown {
                font-size: 56px;
                margin-bottom: 4px;
            }
            .cert .main-title {
                font-size: 26px;
                font-weight: 700;
                color: #10b981;
                letter-spacing: 1.5px;
                margin-bottom: 4px;
                text-transform: uppercase;
            }
            .cert .sub-title {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 18px;
                letter-spacing: 1px;
                border-bottom: 2px dashed #d1fae5;
                padding-bottom: 14px;
            }
            .cert .label-text {
                font-size: 18px;
                color: #374151;
                margin: 6px 0 4px 0;
                font-weight: 400;
            }
            .cert .student-name {
                font-size: 36px;
                font-weight: 700;
                color: #111827;
                margin: 4px 0 4px 0;
                letter-spacing: 1px;
            }
            .cert .completion-text {
                font-size: 18px;
                color: #374151;
                margin: 4px 0 10px 0;
                line-height: 1.6;
            }
            .cert .completion-text strong {
                color: #10b981;
                font-weight: 700;
            }
            .cert .dua {
                font-size: 15px;
                color: #6b7280;
                max-width: 450px;
                margin: 6px auto 16px auto;
                line-height: 1.6;
                font-style: italic;
            }
            .cert .signature {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                border-top: 2px solid #d1fae5;
                padding-top: 18px;
                margin-top: 10px;
                font-size: 14px;
                color: #6b7280;
            }
                .cert .signature .left {
                text-align: left;
            }
            .cert .signature .right {
                text-align: right;
            }
            .cert .signature .left .line,
            .cert .signature .right .line {
                display: block;
                width: 150px;
                border-top: 1.5px solid #10b981;
                margin: 6px 0 2px 0;
            }
            .cert .signature .left .line {
                margin-left: 0;
            }
            .cert .signature .right .line {
                margin-left: auto;
            }
            .cert .signature .label-sign {
                font-size: 12px;
                color: #9ca3af;
            }
            .cert .print-btn {
                background: #10b981;
                color: white;
                border: none;
                padding: 12px 32px;
                border-radius: 60px;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: 0.3s;
                margin-top: 18px;
                font-family: 'Segoe UI', sans-serif;
            }
            .cert .print-btn:hover {
                background: #059669;
                transform: scale(1.02);
            }
            .cert .logo-watermark {
                position: absolute;
                bottom: 12px;
                right: 20px;
                font-size: 12px;
                color: #d1fae5;
                font-weight: 700;
                letter-spacing: 2px;
                opacity: 0.5;
            }
            @media print {
                body { background: white; }
                .cert { border: 4px solid #10b981; box-shadow: none; }
                .print-btn { display: none; }
                .logo-watermark { opacity: 0.3; }
            }
        </style>
    </head>
    <body>
        <div class="cert">
            <div class="crown">🎓</div>
            <div class="main-title">Certificate of Completion</div>
            <div class="sub-title">GrowMe – Self Development Program</div>
            <div class="label-text">This certifies that</div>
            <div class="student-name">${name}</div>
            <div class="completion-text">
                has successfully completed the <strong>${level}</strong> level
            </div>
            <div class="dua">
                Through dedication and hard work, they have developed essential soft skills
                and completed all lessons and challenges.
            </div>
            <div class="signature">
                <div class="left">
                    <div class="line"></div>
                    <span class="label-sign">Instructor</span>
                </div>
                <div class="right">
                    <div class="line"></div>
                    <span class="label-sign">Date: ${date}</span>
                </div>
            </div>
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <div class="logo-watermark">🌱 GrowMe</div>
        </div>
    </body>
    </html>
    `;

    const win = window.open('', '_blank', 'width=650,height=750');
    win.document.write(html);
    win.document.close();
}

// ========== MOTIVATIONAL NOTIFICATIONS ==========
function showMotivation(message, emoji = '💪') {
    // نشيل أي تنبيه قديم
    const old = document.querySelector('.motivation-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'motivation-toast';
    toast.innerHTML = `${emoji} ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        padding: 14px 28px;
        border-radius: 60px;
        font-weight: 700;
        font-size: 18px;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 9999;
        animation: slideUp 0.4s ease;
        max-width: 90%;
        text-align: center;
        font-family: 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(toast);

    // تشغيل حركة الظهور
    if (!document.querySelector('#toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes slideUp {
                0% { opacity: 0; transform: translateX(-50%) translateY(30px); }
                100% { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @keyframes slideDown {
                0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(30px); }
            }
        `;
        document.head.appendChild(style);
    }

    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.4s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
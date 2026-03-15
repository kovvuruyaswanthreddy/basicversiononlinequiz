(() => {
    // ===== Main Portal Buttons =====
    const studentDashboard = document.getElementById("studentDashboard");
    const studentAcademicSection = document.getElementById("studentAcademicSection");
    const studentEventsSection = document.getElementById("studentEventsSection");

    const studentAcademicPortalBtn = document.getElementById("studentAcademicPortalBtn");
    const studentEventsPortalBtn = document.getElementById("studentEventsPortalBtn");
    const studentLogout = document.getElementById("studentLogout");
    const backToStudentMainBtns = document.querySelectorAll(".backToStudentMain");

    // Sub-buttons
    const takeQuizBtn = document.getElementById("takeQuizBtn");
    const takeEventQuizBtn = document.getElementById("takeEventQuizBtn");
    const viewEventResultBtn = document.getElementById("viewEventResultBtn");
    const viewResultBtn = document.getElementById("viewResultBtn");

    let studentRoll = sessionStorage.getItem("rollNumber") || "";
    let modal = null;
    let quizContainer = null;
    let examActive = false;
    let timerInterval = null;
    let remainingSeconds = 0;
    let isSubmitted = false;
    let halfTimeReached = false;
    let submitBtn = null;
    
    // --- Browser Back Button Management ---
    history.replaceState({ section: "dashboard" }, "");

    window.addEventListener("popstate", (event) => {
        if (!event.state) return;
        
        // If back button is pressed during exam, block it
        if (examActive && !isSubmitted) {
            history.pushState({ section: "exam" }, "");
            showSystemPrompt("Navigation Blocked", "You cannot go back during an active assessment. Please submit the quiz to exit.", false);
            return;
        }

        const section = event.state.section;
        if (section === "dashboard") {
            studentAcademicSection.classList.add("hidden");
            studentEventsSection.classList.add("hidden");
            studentDashboard.classList.remove("hidden");
            if(quizContainer) { quizContainer.remove(); quizContainer = null; }
            if(modal) modal.classList.add("hidden");
        } else if (section === "academic") {
            studentDashboard.classList.add("hidden");
            studentEventsSection.classList.add("hidden");
            studentAcademicSection.classList.remove("hidden");
            if(quizContainer) { quizContainer.remove(); quizContainer = null; }
        } else if (section === "events") {
            studentDashboard.classList.add("hidden");
            studentAcademicSection.classList.add("hidden");
            studentEventsSection.classList.remove("hidden");
            if(quizContainer) { quizContainer.remove(); quizContainer = null; }
        }
    });
    
    window.setStudentRoll = (roll) => studentRoll = roll;

    // Navigation
    studentAcademicPortalBtn.addEventListener("click", () => {
        studentDashboard.classList.add("hidden");
        studentAcademicSection.classList.remove("hidden");
        history.pushState({ section: "academic" }, "");
    });
    studentEventsPortalBtn.addEventListener("click", () => {
        studentDashboard.classList.add("hidden");
        studentEventsSection.classList.remove("hidden");
        history.pushState({ section: "events" }, "");
    });
    backToStudentMainBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            studentAcademicSection.classList.add("hidden");
            studentEventsSection.classList.add("hidden");
            studentDashboard.classList.remove("hidden");
            history.pushState({ section: "dashboard" }, "");
        });
    });
    studentLogout?.addEventListener("click", () => {
        // Clear self-hosted storage
        Object.keys(localStorage).forEach(k => {
            if(k.startsWith("exam_answers_")) localStorage.removeItem(k);
        });
        sessionStorage.clear();
        location.reload();
    });

    // Dashboard Filtering (Academic vs Event)
    function filterStudentDashboard() {
        if(examActive) return;
        const role = sessionStorage.getItem("role");
        const loginType = sessionStorage.getItem("studentLoginType");
        
        if (role === "student" || role === "EVENT_STUDENT") {
            // Bypass the intermediate "Academic Portal / Events Portal" choice
            studentDashboard.classList.add("hidden"); 
            
            if (loginType === "event" || role === "EVENT_STUDENT") {
                studentAcademicSection.classList.add("hidden");
                studentEventsSection.classList.remove("hidden");
            } else {
                studentEventsSection.classList.add("hidden");
                studentAcademicSection.classList.remove("hidden");
            }
            
            // Hide "Back to Principal" buttons as there is no intermediate screen anymore
            document.querySelectorAll(".backToStudentMain").forEach(b => b.style.display = "none");
        }
    }
    // Run periodically to ensure UI stays consistent
    setInterval(filterStudentDashboard, 500);

    // Helpers
    function createModal() {
        if (modal) return;
        modal = document.createElement("div");
        modal.className = "modal hidden";
        modal.innerHTML = `<div class="modal-content"><span id="modalClose" class="close">&times;</span><div class="modal-header" id="modalHeader"></div><div class="modal-body" id="modalBody"></div><div class="modal-footer" id="modalFooter"></div></div>`;
        document.body.appendChild(modal);
        modal.querySelector("#modalClose").onclick = () => modal.classList.add("hidden");
    }

    function enterFullScreen() {
        const doc = document.documentElement;
        if (doc.requestFullscreen) doc.requestFullscreen();
        else if (doc.mozRequestFullScreen) doc.mozRequestFullScreen();
        else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
        else if (doc.msRequestFullscreen) doc.msRequestFullscreen();
    }

    // Custom System Modal Helper
    function showSystemPrompt(title, message, isConfirm, onOk, onCancel) {
        createModal();
        const mh = modal.querySelector("#modalHeader");
        const mb = modal.querySelector("#modalBody");
        const mf = modal.querySelector("#modalFooter");
        const mc = modal.querySelector("#modalClose");
        
        mh.textContent = title;
        mb.innerHTML = `<div style="text-align:center; padding: 10px; font-size:16px;">${message}</div>`;
        
        mf.innerHTML = `<button class="login-btn" id="sysOk">OK</button>`;
        if(isConfirm) {
            mf.innerHTML += `<button class="back-btn" id="sysCancel">Cancel</button>`;
        }
        
        // Link 'X' button to onCancel
        mc.onclick = () => {
            modal.classList.add("hidden");
            if(onCancel) onCancel();
        };

        modal.classList.remove("hidden");
        
        document.getElementById("sysOk").onclick = () => {
            modal.classList.add("hidden");
            if(onOk) onOk();
        };
        if(isConfirm) {
            document.getElementById("sysCancel").onclick = () => {
                modal.classList.add("hidden");
                if(onCancel) onCancel();
            };
        }
    }

    // ================= ACADEMIC QUIZ =================
    takeQuizBtn.addEventListener("click", async () => {
        createModal();
        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        const modalFooter = modal.querySelector("#modalFooter");
        modalHeader.textContent = "Take Academic Quiz";
        
        // Fetch depts
        let depts = [];
        try { const r = await authFetch("/departments"); depts = await r.json(); } catch(e){}
        
        modalBody.innerHTML = `<select id="qDept"><option value="">Select Dept</option>${depts.map(d=>`<option value="${d.name}">${d.name}</option>`).join("")}</select>
        <select id="qYear"><option value="">Select Year</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
        <select id="qSec"><option value="">Select Section</option>${["A","B","C","D","E","F","G","H","I","J"].map(s=>`<option value="${s}">${s}</option>`)}</select>`;
        modalFooter.innerHTML = `<button class="login-btn" id="fQuizzes">Fetch Quizzes</button>`;
        modal.classList.remove("hidden");

        document.getElementById("fQuizzes").onclick = async () => {
            const dept = document.getElementById("qDept").value;
            const year = document.getElementById("qYear").value;
            const sec = document.getElementById("qSec").value;
            
            const userDept = sessionStorage.getItem("department");
            const userYear = sessionStorage.getItem("year");
            const userSec = sessionStorage.getItem("section");
            
            if (dept !== userDept || year !== userYear || sec !== userSec) {
                showSystemPrompt("Invalid Data", "The selected department, year, or section does not match your profile.", false);
                return;
            }

            const r = await authFetch(`/quiz/active?rollNumber=${studentRoll}&department=${dept}&year=${year}&section=${sec}`);
            const quizzes = await r.json();
            if (!quizzes || quizzes.length === 0) {
                modalBody.innerHTML = `<p style="text-align:center; color:#666; font-weight:500; margin-top:20px;">No active quizzes found.</p>`;
            } else {
                modalBody.innerHTML = `<ul class="quiz-list">${quizzes.map(q=>`<li data-id="${q.quiz.quizId}" data-name="${q.quiz.quizName}" data-dur="${q.durationMinutes}">${q.quiz.quizName}</li>`).join("")}</ul>`;
            }
            modalFooter.innerHTML = "";
            modalBody.querySelectorAll("li").forEach(li => {
                li.onclick = async () => {
                    const qid = li.dataset.id;
                    const qName = li.dataset.name;
                    const qDur = li.dataset.dur;
                    
                    // Check if already attempted
                    const att = await authFetch(`/results/student/attempted?rollNumber=${studentRoll}&quizId=${qid}`).then(r => r.json());
                    if (att) return showSystemPrompt("Already Attempted", "You have already submitted this assessment. One attempt is allowed per student.", false);

                    showSystemPrompt("Start Assessment", `Do you want to start Quiz: ${qName}?`, true, () => {
                        enterFullScreen();
                        modal.classList.add("hidden");
                        startQuestions(qid, qName, qDur, `/quiz/${qid}/questions/for-student?department=${dept}&year=${year}&section=${sec}`, "/results/submit");
                    });
                };
            });
        };
    });

    viewResultBtn.addEventListener("click", () => {
        createModal();
        modal.querySelector("#modalHeader").textContent = "Academic Assessment Results";
        const roll = studentRoll || sessionStorage.getItem("rollNumber");
        if(!roll) return showSystemPrompt("Error", "Session data missing. Please re-login.", false);
        
        authFetch(`/results/student/all?rollNumber=${roll}`).then(r => r.ok ? r.json() : []).then(data => {
            if(!data.length) {
                modal.querySelector("#modalBody").innerHTML = "<p style='text-align:center;'>No academic results found or published yet.</p>";
            } else {
                modal.querySelector("#modalBody").innerHTML = `
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Quiz Name</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(r => `
                                <tr>
                                    <td>${r.quiz.quizName}</td>
                                    <td>${r.score}/${r.totalMarks}</td>
                                    <td style="color:${r.passFail === 'Pass' ? 'green' : 'red'}">${r.passFail}</td>
                                    <td><button class="login-btn" style="padding: 5px 10px; font-size: 12px;" onclick="viewAcademicKey('${r.quiz.quizId}', '${encodeURIComponent(r.answers)}', '${encodeURIComponent(r.quiz.quizName)}')">View Key</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>`;
            }
            modal.querySelector("#modalFooter").innerHTML = "";
            modal.classList.remove("hidden");
        });
    });

    window.viewAcademicKey = (qid, encodedAnswers, encodedQuizName) => {
        const studentAnswers = JSON.parse(decodeURIComponent(encodedAnswers) || "{}");
        const quizName = encodedQuizName ? decodeURIComponent(encodedQuizName) : qid;
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        const dept  = sessionStorage.getItem("department") || user.department;
        const year  = sessionStorage.getItem("year") || user.year;
        const sec   = sessionStorage.getItem("section") || user.section;
        const sName = user.name || "Student";

        authFetch(`/quiz/${qid}/key?department=${dept}&year=${year}&section=${sec}`).then(async r => {
            if (!r.ok) {
                const err = await r.text();
                showSystemPrompt("Access Denied", err, false);
                return;
            }
            const questions = await r.json();
            localStorage.setItem("quiz_key_data", JSON.stringify({
                quizName: quizName || qid,
                quizId: qid,
                studentName: sName,
                rollNumber: studentRoll,
                questions,
                studentAnswers
            }));
            window.open("/quiz-key.html", "_blank");
        });
    };

    // ================= EVENT QUIZ =================
    takeEventQuizBtn.addEventListener("click", async () => {
        createModal();
        const res = await authFetch(`/event/student/events?rollNumber=${studentRoll}`);
        const events = await res.json();
        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        modalHeader.textContent = "Registered Events";
        if (!events || events.length === 0) {
            modalBody.innerHTML = `<p style="text-align:center; color:#666; font-weight:500; margin-top:20px;">No registered events found.</p>`;
        } else {
            modalBody.innerHTML = `<ul class="quiz-list">${events.map(e=>`<li data-eid="${e.eventId}">${e.eventName}</li>`).join("")}</ul>`;
        }
        modal.querySelector("#modalFooter").innerHTML = "";
        modal.classList.remove("hidden");
        
        modalBody.querySelectorAll("li").forEach(li => {
            li.onclick = async () => {
                const eid = li.dataset.eid;
                const r2 = await authFetch(`/event/active-quizzes?eventId=${eid}&studentRollNumber=${studentRoll}`);
                const qz = await r2.json();
                modalHeader.textContent = `Quizzes for ${eid}`;
                if (!qz || qz.length === 0) {
                    modalBody.innerHTML = `<p style="text-align:center; color:#666; font-weight:500; margin-top:20px;">No active quizzes found for this event.</p>`;
                } else {
                    modalBody.innerHTML = `<ul class="quiz-list">${qz.map(q=>`<li data-qid="${q.quizId}" data-dur="${q.durationMinutes}">${q.quizId} (${q.durationMinutes}m)</li>`).join("")}</ul>`;
                }
                modalBody.querySelectorAll("li").forEach(l2 => {
                    l2.onclick = async () => {
                        const qid = l2.dataset.qid;
                        const qDur = l2.dataset.dur;
                        
                        // Check if already attempted
                        const att = await authFetch(`/event/student/attempted?eventId=${eid}&quizId=${qid}&rollNumber=${studentRoll}`).then(r => r.json());
                        if (att) return showSystemPrompt("Already Attempted", "You have already submitted this event assessment. One attempt is allowed per student.", false);

                        showSystemPrompt("Start Event Assessment", `Start Event Quiz: ${qid}?`, true, () => {
                            enterFullScreen();
                            modal.classList.add("hidden");
                            startQuestions(qid, qid, qDur, `/event/${eid}/quiz/${qid}/questions?rollNumber=${studentRoll}`, "/event/submit-result", eid);
                        });
                    };
                });
            };
        });
    });

    viewEventResultBtn.addEventListener("click", () => {
        createModal();
        modal.querySelector("#modalHeader").textContent = "Event Assessment Results";
        authFetch(`/event/student/all-results?rollNumber=${studentRoll}`).then(r => r.json()).then(data => {
            if(!data.length) {
                modal.querySelector("#modalBody").innerHTML = "<p style='text-align:center;'>No event results found or published yet.</p>";
            } else {
                modal.querySelector("#modalBody").innerHTML = `
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Event ID</th>
                                <th>Quiz ID</th>
                                <th>Score</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(r => `
                                <tr>
                                    <td>${r.eventId}</td>
                                    <td>${r.quizId}</td>
                                    <td>${r.score}/${r.totalMarks}</td>
                                    <td style="color:${r.passFail === 'PASS' ? 'green' : 'red'}">${r.passFail}</td>
                                    <td><button class="login-btn" style="padding: 5px 10px; font-size: 12px;" onclick="viewEventKey('${r.eventId}', '${r.quizId}', '${encodeURIComponent(r.answers)}')">View Key</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>`;
            }
            modal.querySelector("#modalFooter").innerHTML = "";
            modal.classList.remove("hidden");
        });
    });

    window.viewEventKey = (eid, qid, encodedAnswers) => {
        const studentAnswers = JSON.parse(decodeURIComponent(encodedAnswers) || "{}");
        const sName = JSON.parse(sessionStorage.getItem("user") || "{}").name || "Student";

        authFetch(`/event/quiz-key?eventId=${eid}&quizId=${qid}`).then(async r => {
            if (!r.ok) {
                const err = await r.text();
                showSystemPrompt("Access Denied", err, false);
                return;
            }
            const questions = await r.json();
            localStorage.setItem("quiz_key_data", JSON.stringify({
                quizName: qid,
                quizId: qid,
                studentName: sName,
                rollNumber: studentRoll,
                questions,
                studentAnswers
            }));
            window.open("/quiz-key.html", "_blank");
        });
    };


    let examPaused = false;
    let blurCount = 0;

    // ================= COMMON QUIZ ENGINE =================
    async function startQuestions(quizId, quizName, durationMinutes, fetchUrl, submitUrl, eventId = null, isResume = false) {
        // 1. Preparation Countdown (30s) - Skip if resuming
        if (isResume) {
            runExam();
            return;
        }
        createModal();
        const mh = modal.querySelector("#modalHeader");
        const mb = modal.querySelector("#modalBody");
        const mf = modal.querySelector("#modalFooter");
        mh.textContent = "Assesment Preparation";
        mb.innerHTML = `<p style='text-align:center;'>Get ready! The exam starts in:</p><div style="font-size:60px; font-weight:bold; color:#ff6600; text-align:center;" id="pCount">30</div>
        <p style='margin-top:20px; color:#666; font-size:14px; text-align:center;'>Ensure you are in a quiet place and do not switch tabs.</p>`;
        mf.innerHTML = "";
        modal.classList.remove("hidden");

        let pTime = 30;
        const pInt = setInterval(() => {
            pTime--;
            const el = document.getElementById("pCount");
            if(el) el.textContent = pTime;
            if(pTime <= 0) {
                clearInterval(pInt);
                modal.classList.add("hidden");
                runExam();
            }
        }, 1000);

        async function runExam() {
            try {
                // Fetch student name from session
                let studentName = "Student";
                try {
                    const savedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
                    studentName = savedUser.name || "Student";
                } catch(e){}

                const res = await authFetch(fetchUrl);
                const questions = await res.json();
                if(!questions.length) return alert("No questions found!");

                examActive = true; 
                isSubmitted = false; 
                halfTimeReached = false; 
                blurCount = 0; 
                examPaused = false;
                history.pushState({ section: "exam" }, "");
                
                const sessionKey = "active_exam_session";
                let savedSession = null;
                try {
                    savedSession = JSON.parse(localStorage.getItem(sessionKey) || "null");
                } catch(e){}

                if (savedSession && savedSession.quizId === quizId) {
                    // Resuming
                    const now = Date.now();
                    remainingSeconds = Math.floor((savedSession.endTime - now) / 1000);
                    if (remainingSeconds <= 0) {
                        alert("Exam time has expired.");
                        localStorage.removeItem(sessionKey);
                        return;
                    }
                } else {
                    // New session
                    remainingSeconds = durationMinutes * 60;
                    const endTime = Date.now() + (remainingSeconds * 1000);
                    localStorage.setItem(sessionKey, JSON.stringify({
                        quizId, quizName, durationMinutes, fetchUrl, submitUrl, eventId, endTime
                    }));
                }
                const totalSecs = durationMinutes * 60;

                quizContainer = document.createElement("div");
                quizContainer.className = "overlay-center";
                quizContainer.innerHTML = `
                    <div class="quiz-container">
                        <div class="quiz-header">
                            <span class="quiz-title">MITS ONLINE QUIZ</span>
                            <span id="networkStatus" class="net-status online">● ONLINE</span>
                        </div>
                        <div class="quiz-info">
                            <div class="quiz-info-item"><strong>Student Name</strong><span>${studentName}</span></div>
                            <div class="quiz-info-item"><strong>Roll Number</strong><span>${studentRoll}</span></div>
                            <div class="quiz-info-item"><strong>Quiz Name</strong><span>${quizName}</span></div>
                            <div class="quiz-info-item"><strong>Quiz ID</strong><span>${quizId}</span></div>
                            <div class="timer-box">
                                <div class="timer-label">TIME REMAINING</div>
                                <span id="quizTimer">00:00</span>
                            </div>
                        </div>
                        <div class="quiz-body">
                            <div class="question-area">
                                <div class="question-scroll" id="questionArea"></div>
                                <div class="quiz-controls">
                                    <div class="left-buttons">
                                        <button class="login-btn" id="prevQ" style="padding:12px 30px;">Previous</button>
                                        <button class="login-btn" id="nextQ" style="padding:12px 30px;">Next</button>
                                    </div>
                                    <div class="right-buttons">
                                        <button class="login-btn submit-btn" id="subQ" disabled style="padding:12px 40px; font-weight:800;">Locked</button>
                                    </div>
                                </div>
                            </div>
                            <div class="question-nav" id="questionNav">
                                <h3 style="color:#4a148c; font-weight:900; border-bottom:2px solid #e1bee7; padding-bottom:12px; font-size:18px; text-transform:uppercase; letter-spacing:1px;">Question Navigation</h3>
                                <div class="question-grid" id="qGrid" style="margin-top:20px;"></div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(quizContainer);

                const seenQuestions = new Set();

                // Protection Logic
                let violationInProgress = false;
                const handleViolation = (msg, isModal = false) => {
                    if (!examActive || isSubmitted || violationInProgress) return;
                    violationInProgress = true;
                    blurCount++;
                    
                    if (blurCount >= 3) {
                        if (isModal) {
                            showSystemPrompt("Exam Terminated", `Maximum violations reached (${blurCount}/3). Your exam is being submitted.`, false, () => {
                                violationInProgress = false;
                                submitQuiz();
                            });
                        } else {
                            alert(`⚠️ Maximum violations reached (${blurCount}/3). Your exam is being submitted.`);
                            violationInProgress = false;
                            submitQuiz();
                        }
                        return;
                    }

                    if (isModal) {
                        showSystemPrompt("Security Violation", `${msg} (Violation ${blurCount}/3)`, false, () => {
                            violationInProgress = false;
                            enterFullScreen();
                        }, () => {
                            // If user clicks 'X' (into mark), force submit and termination
                            violationInProgress = false;
                            submitQuiz();
                        });
                    } else {
                        alert(`⚠️ WARNING: ${msg} (Violation ${blurCount}/3)`);
                        violationInProgress = false;
                        enterFullScreen();
                    }
                };

                window.onblur = () => {
                    handleViolation("Tab switching detected. This activity is monitored.");
                };

                function checkNet() {
                    if(!examActive) return;
                    const online = navigator.onLine;
                    const ns = document.getElementById("networkStatus");
                    const prevBtn = document.getElementById("prevQ");
                    const nextBtn = document.getElementById("nextQ");
                    const subBtn = document.getElementById("subQ");
                    const navBtns = document.querySelectorAll(".nav-circle");
                    const options = document.querySelectorAll(".option-card input");

                    if(ns) {
                        ns.textContent = online ? "● ONLINE" : "● OFFLINE";
                        ns.className = "net-status " + (online ? "online" : "offline");
                    }

                    if(!online) {
                        if(!examPaused) {
                            showSystemPrompt("Internet Lost", "Your internet connection is lost. The exam is frozen until the connection is restored. Your current progress is saved locally.", false);
                        }
                        examPaused = true;
                        if(prevBtn) prevBtn.disabled = true;
                        if(nextBtn) nextBtn.disabled = true;
                        if(subBtn) subBtn.disabled = true;
                        navBtns.forEach(b => b.classList.add("disabled"));
                        options.forEach(o => o.disabled = true);
                    } else {
                        if(examPaused) {
                            // Connection restored logic
                            examPaused = false;
                            if(prevBtn) prevBtn.disabled = false;
                            if(nextBtn) nextBtn.disabled = false;
                            if(subBtn && halfTimeReached) {
                                subBtn.disabled = false;
                                subBtn.textContent = "Submit";
                            }
                            navBtns.forEach(b => b.classList.remove("disabled"));
                            options.forEach(o => o.disabled = false);
                        }
                    }
                }
                setInterval(checkNet, 2000);

                // Security: Disable Copy, Paste, Right Click
                const preventActions = (e) => {
                    if (examActive) {
                        e.preventDefault();
                        showSystemPrompt("Action Disabled", "Copying, pasting, and right-clicking are disabled during the assessment.", false);
                        return false;
                    }
                };
                document.addEventListener("copy", preventActions);
                document.addEventListener("paste", preventActions);
                document.addEventListener("cut", preventActions);
                document.addEventListener("contextmenu", preventActions);

                let currentIdx = 0;
                
                // Load from localStorage if exists
                const localKey = `exam_answers_${studentRoll}_${quizId}`;
                const savedLocal = localStorage.getItem(localKey);
                const quizAnswers = savedLocal ? JSON.parse(savedLocal) : {};
                
                const qTimer = document.getElementById("quizTimer");

                // Timer
                timerInterval = setInterval(() => {
                    if(examPaused) return;
                    remainingSeconds--;
                    if(remainingSeconds <= 0) {
                        clearInterval(timerInterval);
                        showSystemPrompt("Time Up", "Your exam time has ended. Click OK to submit assessment.", false, () => {
                            submitQuiz();
                        });
                    }

                    const mins = Math.floor(remainingSeconds/60);
                    const secs = remainingSeconds%60;
                    if(qTimer) qTimer.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
                    
                    if(!halfTimeReached && (totalSecs - remainingSeconds) >= (totalSecs / 2)) {
                        halfTimeReached = true;
                        const sb = document.getElementById("subQ");
                        if(sb) { sb.disabled = false; sb.textContent = "Submit"; }
                    }
                }, 1000);

                function showQuestion(idx) {
                    const q = questions[idx];
                    seenQuestions.add(idx);
                    
                    const nb = document.querySelector(`[data-idx="${idx}"]`);
                    if(nb && !nb.classList.contains("answered")) nb.classList.add("seen");

                    const type = q.multiple ? "checkbox" : "radio";
                    const qArea = document.getElementById("questionArea");
                    
                    const qText = (q.questionText || "").replace(/\\n/g, "\n");
                    const marks = q.marks || 1;
                    const negMarks = q.negativeMarks || 0;

                    qArea.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h3 style='color:#6a0dad;'>Question ${idx+1}</h3>
                            <div style="font-size:14px; font-weight:600; color:#4a148c; background:#e1bee7; padding:4px 10px; border-radius:15px;">
                                Marks: ${marks} | Negative: -${negMarks}
                            </div>
                        </div>
                        <p class="question-text" style="white-space: pre-wrap; margin-bottom: 20px; font-size:18px; line-height:1.6; color:#2c3e50;">${qText}</p>
                        <div class="quiz-options">
                            <label class="option-card"><input type="${type}" name="opt" value="option1"> ${q.option1 || q.options?.option1}</label>
                            <label class="option-card"><input type="${type}" name="opt" value="option2"> ${q.option2 || q.options?.option2}</label>
                            <label class="option-card"><input type="${type}" name="opt" value="option3"> ${q.option3 || q.options?.option3}</label>
                            <label class="option-card"><input type="${type}" name="opt" value="option4"> ${q.option4 || q.options?.option4}</label>
                        </div>
                    `;

                    // Highlight active nav button
                    document.querySelectorAll(".nav-circle").forEach(b => b.classList.remove("active"));
                    const activeBtn = document.querySelector(`[data-idx="${idx}"]`);
                    if(activeBtn) activeBtn.classList.add("active");

                    const qKey = q.questionId || q.id;
                    const saved = quizAnswers[qKey];
                    if(saved) {
                        saved.split(",").forEach(v => {
                            const input = qArea.querySelector(`input[value="${v.trim()}"]`);
                            if(input) input.checked = true;
                        });
                        qArea.querySelectorAll(".option-card").forEach(card => {
                            if(card.querySelector("input").checked) card.classList.add("selected");
                        });
                    }

                    qArea.querySelectorAll("input").forEach(i => {
                        i.onchange = () => {
                            if(examPaused) return showSystemPrompt("Offline", "You are offline! Assessment paused.", false);
                            const card = i.closest(".option-card");
                            if (type === "radio") {
                                qArea.querySelectorAll(".option-card").forEach(c => c.classList.remove("selected"));
                                if(i.checked) card.classList.add("selected");
                            } else {
                                if(i.checked) card.classList.add("selected"); else card.classList.remove("selected");
                            }
                            const checked = Array.from(qArea.querySelectorAll("input:checked")).map(el => el.value);
                            quizAnswers[qKey] = checked.join(",");
                            // Save to local
                            localStorage.setItem(localKey, JSON.stringify(quizAnswers));

                            if(checked.length) {
                                nb.classList.add("answered");
                                nb.classList.remove("seen");
                            } else {
                                nb.classList.remove("answered");
                                nb.classList.add("seen");
                            }
                        };
                    });
                }

                document.getElementById("prevQ").onclick = () => { 
                    if(examPaused) return;
                    if(currentIdx > 0) { currentIdx--; showQuestion(currentIdx); } 
                };
                document.getElementById("nextQ").onclick = () => { 
                    if(examPaused) return;
                    if(currentIdx < questions.length - 1) { currentIdx++; showQuestion(currentIdx); } 
                };
                document.getElementById("subQ").onclick = () => { 
                    if(examPaused) return;
                    showSystemPrompt("Confirm Submission", "Are you sure you want to finalize and submit the assessment?", true, () => {
                        submitQuiz();
                    });
                };

                // Escape Key Protection
                const escHandler = (e) => {
                    if (examActive) {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            return false;
                        }
                    }
                };
                window.addEventListener("keydown", escHandler, true);

                // Exit Fullscreen Monitoring
                const fsHandler = () => {
                    if (!document.fullscreenElement && examActive && !isSubmitted) {
                        handleViolation("you are out of full screen model click ok to continue.", true);
                    }
                };
                document.addEventListener("fullscreenchange", fsHandler);

                const g = document.getElementById("qGrid");
                g.innerHTML = "";
                questions.forEach((q, i) => {
                    const b = document.createElement("button"); b.textContent = i+1; b.className = "nav-circle"; b.dataset.idx = i;
                    b.onclick = () => { 
                        if(examPaused) return;
                        currentIdx = i; showQuestion(i); 
                    };
                    const qKey = q.questionId || q.id;
                    if(quizAnswers[qKey]) b.classList.add("answered");
                    g.appendChild(b);
                });

                showQuestion(0);

                async function submitQuiz() {
                    if(isSubmitted) return; isSubmitted = true;
                    examActive = false;
                    clearInterval(timerInterval);
                    window.onblur = null;
                    document.removeEventListener("copy", preventActions);
                    document.removeEventListener("paste", preventActions);
                    document.removeEventListener("cut", preventActions);
                    document.removeEventListener("contextmenu", preventActions);
                    window.removeEventListener("keydown", escHandler);
                    document.removeEventListener("fullscreenchange", fsHandler);
                    localStorage.removeItem(localKey);
                    localStorage.removeItem("active_exam_session");
                    const payload = { rollNumber: studentRoll, quizId, answers: quizAnswers };
                    if(eventId) payload.eventId = eventId;
                    try {
                        const r = await authFetch(submitUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload)});
                        if(r.ok) {
                            showSystemPrompt("Success", "Assessment submitted successfully!", false, () => {
                                quizContainer.remove();
                                if(document.fullscreenElement) document.exitFullscreen();
                            });
                        } else {
                            showSystemPrompt("Error", "Submission failed. Please try again.", false, () => {
                                isSubmitted = false;
                            });
                        }
                    } catch(e) {
                        showSystemPrompt("Network Error", "Network error during submission. Please check connection.", false, () => {
                            isSubmitted = false;
                        });
                    }
                }
            } catch(e) { alert("X: " + e.message); }
        }
    }

    // --- Session Recovery Check ---
    (function resumeCheck() {
        const sessionKey = "active_exam_session";
        const saved = localStorage.getItem(sessionKey);
        if (saved) {
            try {
                const s = JSON.parse(saved);
                const timeLeft = Math.floor((s.endTime - Date.now()) / 1000);
                if (timeLeft > 5) { // At least 5 seconds left
                    // Delay slightly to ensure role/user info is loaded from sessionStorage
                    setTimeout(() => {
                        studentRoll = sessionStorage.getItem("studentRoll") || studentRoll;
                        startQuestions(s.quizId, s.quizName, s.durationMinutes, s.fetchUrl, s.submitUrl, s.eventId, true);
                    }, 500);
                } else {
                    localStorage.removeItem(sessionKey);
                }
            } catch(e) {
                localStorage.removeItem(sessionKey);
            }
        }
    })();

})();
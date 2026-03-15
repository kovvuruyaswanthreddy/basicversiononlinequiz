(() => {
  // ===== Elements =====
  const facultyDashboard = document.getElementById("facultyDashboard");
  const facultyAcademicSection = document.getElementById("facultyAcademicSection");
  const facultyEventSection = document.getElementById("facultyEventSection");
  
  const academicExamsMenuBtn = document.getElementById("academicExamsMenuBtn");
  const manageEventMenuBtn = document.getElementById("manageEventMenuBtn");
  const facultyLogout = document.getElementById("facultyLogout");


  // Academic Cards
  const uploadStudentBtn = document.getElementById("uploadStudentBtn");
  const addQuizBtn = document.getElementById("addQuizBtn");
  const activateQuizBtn = document.getElementById("activateQuizBtn");
  const viewClassResultsBtn = document.getElementById("viewClassResultsBtn");
  const publishResultBtn = document.getElementById("publishResultBtn");

  // Event Cards
  const createEventBtn = document.getElementById("createEventBtn");
  const uploadEventStudentsBtn = document.getElementById("uploadEventStudentsBtn");
  const addEventQuestionsBtn = document.getElementById("addEventQuestionsBtn");
  const activateEventQuizBtn = document.getElementById("activateEventQuizBtn");
  const viewEventResultsBtn = document.getElementById("viewEventResultsBtn");

  const facultyContainer = facultyDashboard.parentElement;
  let departmentsList = "";

  // ===== Department Loader =====
  async function loadDepartments() {
      try {
          const res = await authFetch("/departments");
          if (res.ok) {
              const depts = await res.json();
              departmentsList = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
          }
      } catch (err) { console.error("DEPT LOAD ERROR", err); }
  }
  loadDepartments();

  // ===== Navigation =====
  academicExamsMenuBtn.addEventListener("click", () => {
      facultyDashboard.classList.add("hidden");
      facultyAcademicSection.classList.remove("hidden");
      history.pushState({ section: "facultyAcademic" }, "");
  });

  manageEventMenuBtn.addEventListener("click", () => {
      facultyDashboard.classList.add("hidden");
      facultyEventSection.classList.remove("hidden");
      history.pushState({ section: "facultyEvents" }, "");
  });

  window.addEventListener("popstate", (event) => {
      if (!event.state) return;

      const section = event.state.section || event.state.screen;
      if (section === "dashboard") {
          facultyAcademicSection.classList.add("hidden");
          facultyEventSection.classList.add("hidden");
          facultyDashboard.classList.remove("hidden");
      } else if (section === "facultyAcademic") {
          facultyDashboard.classList.add("hidden");
          facultyEventSection.classList.add("hidden");
          facultyAcademicSection.classList.remove("hidden");
      } else if (section === "facultyEventResults") {
          // If the user navigates forward into event results (unlikely but handled)
      } else if (section === "facultyEvents") {
          facultyDashboard.classList.add("hidden");
          facultyAcademicSection.classList.add("hidden");
          facultyEventSection.classList.remove("hidden");
          const rs = document.getElementById("eventResultsContainer");
          if(rs) rs.remove();
      }
  });

  facultyLogout?.addEventListener("click", () => location.reload());

  // ===== Utility: Create Modal =====
  function createModal(title, contentHTML, submitCallback) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    const modal = document.createElement("div");
    modal.className = "modal-content";
    modal.innerHTML = `<h3>${title}</h3>${contentHTML}<div class="modal-message" id="modalMsg"></div>`;
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit";
    submitBtn.onclick = () => submitCallback(modal, overlay);
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function showModalMessage(modal, text, type = "info") {
    const msgBox = modal.querySelector("#modalMsg");
    if(msgBox) {
        msgBox.textContent = text;
        msgBox.className = "modal-message " + type;
    }
  }

  // ============== ACADEMIC LOGIC ==============

  uploadStudentBtn.addEventListener("click", () => {
    createModal("Upload Academic Student Excel", `<input type="file" id="studentExcelFile" accept=".xlsx,.xls">`, (modal, overlay) => {
        const fileInput = modal.querySelector("#studentExcelFile");
        if (!fileInput.files[0]) return showModalMessage(modal, "Please select file", "error");
        const fd = new FormData(); fd.append("file", fileInput.files[0]);
        authFetch("/upload/students", { method: "POST", body: fd })
          .then(res => res.text()).then(data => { showModalMessage(modal, data, "success"); setTimeout(() => document.body.removeChild(overlay), 2000); })
          .catch(err => showModalMessage(modal, "Error: " + err, "error"));
    });
  });

  addQuizBtn.addEventListener("click", () => {
    createModal("Add Academic Quiz", `<input type="text" id="qName" placeholder="Quiz Name"><input type="text" id="qId" placeholder="Quiz ID">`, (modal, overlay) => {
        const name = modal.querySelector("#qName").value.trim();
        const id = modal.querySelector("#qId").value.trim();
        if (!name || !id) return showModalMessage(modal, "Fill all", "error");
        authFetch(`/quiz/create?quizId=${id}&quizName=${encodeURIComponent(name)}`, { method: "POST" }).then(async res => {
            if (!res.ok) return showModalMessage(modal, await res.text(), "error");
            document.body.removeChild(overlay);
            createModal(`Upload Questions for ${name}`, `<input type="file" id="qFile" accept=".xlsx,.xls">`, (m2, o2) => {
                const fi = m2.querySelector("#qFile");
                if (!fi.files[0]) return showModalMessage(m2, "Select file", "error");
                const fd = new FormData(); fd.append("file", fi.files[0]); fd.append("quizId", id);
                authFetch("/upload/questions", { method: "POST", body: fd }).then(r => r.text()).then(d => {
                    showModalMessage(m2, d, "success"); setTimeout(() => o2.remove(), 2000);
                });
            });
        });
    });
  });

  activateQuizBtn.addEventListener("click", () => {
    createModal("Activate Academic Quiz", `
        <input type="text" id="actQId" placeholder="Quiz ID">
        <select id="actSec"><option value="">Select Section</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option><option value="I">I</option><option value="J">J</option></select>
        <select id="actDept"><option value="">Select Dept</option>${departmentsList}</select>
        <select id="actYear"><option value="">Year</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
        <input type="number" id="actDur" placeholder="Duration (mins)">
        <select id="actStat"><option value="true">Activate</option><option value="false">Deactivate</option></select>
    `, (modal, overlay) => {
        const qid = modal.querySelector("#actQId").value;
        const sec = modal.querySelector("#actSec").value;
        const dept = modal.querySelector("#actDept").value;
        const year = modal.querySelector("#actYear").value;
        const dur = modal.querySelector("#actDur").value || 0;
        const stat = modal.querySelector("#actStat").value;
        authFetch(`/quiz/activate?quizId=${qid}&section=${sec}&department=${dept}&year=${year}&active=${stat}&durationMinutes=${dur}`, {method:"POST"})
          .then(async r => { const m = await r.text(); showModalMessage(modal, m, r.ok?"success":"error"); if(r.ok) setTimeout(()=>overlay.remove(), 2000); });
    });
  });

  publishResultBtn.addEventListener("click", () => {
    createModal("Publish Academic Result", `<input type="text" id="pQid" placeholder="Quiz ID"><select id="pSec"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option><option value="I">I</option><option value="J">J</option></select><select id="pDept">${departmentsList}</select><select id="pYear"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select><select id="pStat"><option value="true">Publish</option><option value="false">Unpublish</option></select>`, (modal, overlay) => {
        const qid = modal.querySelector("#pQid").value;
        authFetch(`/quiz/${qid}/publish-result?section=${modal.querySelector("#pSec").value}&department=${modal.querySelector("#pDept").value}&year=${modal.querySelector("#pYear").value}&publish=${modal.querySelector("#pStat").value}`, {method:"POST"})
          .then(async r => { const m = await r.text(); showModalMessage(modal, m, r.ok?"success":"error"); if(r.ok) setTimeout(()=>overlay.remove(), 2000); });
    });
  });

  viewClassResultsBtn.addEventListener("click", () => {
    createModal("View Class Results", `
        <div style="text-align:left; margin-bottom:15px;">
          <label style="display:block; font-size:12px; font-weight:700; color:#666; margin-bottom:4px;">QUIZ IDENTIFIER</label>
          <input type="text" id="fQid" placeholder="Enter Quiz ID (e.g. 23-CSE-JAVA-01)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px; text-align:left;">
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:#666; margin-bottom:4px;">DEPARTMENT</label>
            <select id="fDept" style="width:100%; padding:8px; border-radius:8px;">
               <option value="">All Departments</option>
               ${departmentsList}
            </select>
          </div>
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:#666; margin-bottom:4px;">YEAR</label>
            <select id="fYear" style="width:100%; padding:8px; border-radius:8px;">
               <option value="">All Years</option>
               <option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:#666; margin-bottom:4px;">SECTION</label>
            <select id="fSec" style="width:100%; padding:8px; border-radius:8px;">
               <option value="">All Sections</option>
               <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option><option value="I">I</option><option value="J">J</option>
            </select>
          </div>
          <div>
            <label style="display:block; font-size:11px; font-weight:700; color:#666; margin-bottom:4px;">SORT BY</label>
            <select id="fSort" style="width:100%; padding:8px; border-radius:8px;">
               <option value="rank">Rank / Score</option>
               <option value="roll">Roll Number</option>
            </select>
          </div>
        </div>
    `, (modal, overlay) => {
        const qid = modal.querySelector("#fQid").value.trim();
        if(!qid) return showModalMessage(modal, "Please enter a Quiz ID", "error");

        const dept = modal.querySelector("#fDept").value;
        const year = modal.querySelector("#fYear").value;
        const sec = modal.querySelector("#fSec").value;
        const sort = modal.querySelector("#fSort").value;

        let query = `quizId=${encodeURIComponent(qid)}&sortBy=${sort}`;
        if(dept) query += `&department=${encodeURIComponent(dept)}`;
        if(year) query += `&year=${year}`;
        if(sec) query += `&section=${sec}`;

        // Open in new tab for full-page experience
        window.open(`class-results.html?${query}`, '_blank');
        overlay.remove();
    });
  });

  // ============== EVENT LOGIC ==============

  createEventBtn.addEventListener("click", () => {
    createModal("Create Event", `<input type="text" id="eId" placeholder="Event ID"><input type="text" id="eName" placeholder="Event Name">`, (modal, overlay) => {
        const id = modal.querySelector("#eId").value;
        const name = modal.querySelector("#eName").value;
        const facultyEmail = sessionStorage.getItem("facultyEmail");
        authFetch(`/event/create?eventId=${id}&eventName=${encodeURIComponent(name)}&facultyEmail=${facultyEmail}`, {method:"POST"})
          .then(async r => { const m = await r.text(); showModalMessage(modal, r.ok?"Event Created":m, r.ok?"success":"error"); if(r.ok) setTimeout(()=>overlay.remove(), 2000); });
    });
  });

  uploadEventStudentsBtn.addEventListener("click", () => {
    createModal("Upload Event Students", `<input type="text" id="eIdSt" placeholder="Event ID"><input type="file" id="eStFile">`, (modal, overlay) => {
        const id = modal.querySelector("#eIdSt").value;
        const fi = modal.querySelector("#eStFile");
        const fd = new FormData(); fd.append("file", fi.files[0]); fd.append("eventId", id); fd.append("facultyEmail", sessionStorage.getItem("facultyEmail"));
        authFetch("/event/upload-students", {method:"POST", body:fd}).then(r => r.text()).then(d => { showModalMessage(modal, d, "success"); setTimeout(()=>overlay.remove(), 2000); });
    });
  });

  addEventQuestionsBtn.addEventListener("click", () => {
    createModal("Add Event Questions", `<input type="text" id="eIdQ" placeholder="Event ID"><input type="text" id="eQid" placeholder="Quiz ID"><input type="file" id="eQFile">`, (modal, overlay) => {
        const eid = modal.querySelector("#eIdQ").value;
        const qid = modal.querySelector("#eQid").value;
        const fi = modal.querySelector("#eQFile");
        const fd = new FormData(); fd.append("file", fi.files[0]); fd.append("eventId", eid); fd.append("quizId", qid);
        authFetch("/event/upload-questions", {method:"POST", body:fd}).then(r => r.text()).then(d => { showModalMessage(modal, d, "success"); setTimeout(()=>overlay.remove(), 2000); });
    });
  });

  activateEventQuizBtn.addEventListener("click", () => {
    createModal("Activate Event Quiz", `<input type="text" id="aeId" placeholder="Event ID"><input type="text" id="aeQid" placeholder="Quiz ID"><input type="number" id="aeDur" placeholder="Duration"><select id="aeStat"><option value="true">Activate</option><option value="false">Deactivate</option></select>`, (modal, overlay) => {
        const eid = modal.querySelector("#aeId").value;
        const qid = modal.querySelector("#aeQid").value;
        const dur = modal.querySelector("#aeDur").value;
        const stat = modal.querySelector("#aeStat").value;
        authFetch(`/event/activate-quiz?eventId=${eid}&quizId=${qid}&active=${stat}&durationMinutes=${dur}`, {method:"POST"})
          .then(async r => { const m = await r.text(); showModalMessage(modal, m, r.ok?"success":"error"); if(r.ok) setTimeout(()=>overlay.remove(), 2000); });
    });
  });

  viewEventResultsBtn.addEventListener("click", () => {
      createModal("View Event Results", `<input type="text" id="veId" placeholder="Event ID"><input type="text" id="veQid" placeholder="Quiz ID">`, (modal, overlay) => {
        const eid = modal.querySelector("#veId").value;
        const qid = modal.querySelector("#veQid").value;
        authFetch(`/event/results?eventId=${eid}&quizId=${qid}`).then(r => r.json()).then(data => {
            overlay.remove(); facultyEventSection.classList.add("hidden");
            const rs = document.createElement("div");
            rs.id = "eventResultsContainer";
            rs.innerHTML = `<h3>Ranking for ${eid}</h3><table class="results-table"><thead><tr><th>Rank</th><th>Roll</th><th>Name</th><th>Score</th><th>Time</th></tr></thead><tbody>${data.map((r,i)=>`<tr><td>${i+1}</td><td>${r.studentRollNumber}</td><td>${r.studentName || 'Unknown'}</td><td>${r.score}</td><td>${new Date(r.submissionTime).toLocaleString()}</td></tr>`).join("")}</tbody></table>`;
            facultyContainer.appendChild(rs);
            history.pushState({ section: "facultyEventResults" }, "");
        });
     });
  });

  const publishEventResultBtn = document.getElementById("publishEventResultBtn");
  publishEventResultBtn.addEventListener("click", () => {
    createModal("Publish Event Results", 
      `<input type="text" id="peId" placeholder="Event ID">
       <input type="text" id="peQid" placeholder="Quiz ID">
       <select id="peStat"><option value="true">Publish</option><option value="false">Hide</option></select>`, 
      (modal, overlay) => {
        const eid = modal.querySelector("#peId").value;
        const qid = modal.querySelector("#peQid").value;
        const pub = modal.querySelector("#peStat").value;
        authFetch(`/event/publish-results?eventId=${eid}&quizId=${qid}&publish=${pub}`, {method:"POST"})
          .then(async r => { const m = await r.text(); showModalMessage(modal, m, r.ok?"success":"error"); if(r.ok) setTimeout(()=>overlay.remove(), 2000); });
      });
  });

})();

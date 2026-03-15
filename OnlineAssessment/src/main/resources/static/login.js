const roleCards = document.querySelectorAll(".role-card[data-role]");
const roleSelection = document.getElementById("roleSelection");
const loginSection = document.getElementById("loginSection");
const loginTitle = document.getElementById("loginTitle");
const studentFields = document.getElementById("studentFields");
const facultyFields = document.getElementById("facultyFields");
const adminFields = document.getElementById("adminFields");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const dashboard = document.getElementById("dashboard");
const welcomeMsg = document.getElementById("welcomeMsg");
const studentDashboard = document.getElementById("studentDashboard");
const facultyDashboard = document.getElementById("facultyDashboard");
const adminDashboard = document.getElementById("adminDashboard");

let selectedRole = null;
let loggedInUser = null;

// -------------------- ROLE CARD SELECTION --------------------
roleCards.forEach(card => {
    card.addEventListener("click", () => {
        selectedRole = card.dataset.role;

        loginSection.classList.add("show");
        loginError.textContent = "";

        studentFields.style.display = "none";
        facultyFields.style.display = "none";
        adminFields.style.display = "none";

        if(selectedRole === "student") studentFields.style.display = "block";
        if(selectedRole === "faculty") facultyFields.style.display = "block";
        if(selectedRole === "admin") adminFields.style.display = "block";

        loginTitle.textContent = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`;

        history.pushState({ screen: "login", role: selectedRole }, "");

        // 👇 Add this line to scroll smoothly to the login box
        setTimeout(() => {
            loginSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    });
});

window.addEventListener("popstate", (e) => {
    const state = e.state;
    if (!state) return;

    if (state.screen === "roleSelection") {
        loginSection.classList.remove("show");
        selectedRole = null;
        loginError.textContent = "";
        studentFields.querySelectorAll("input").forEach(i => i.value = "");
        facultyFields.querySelectorAll("input").forEach(i => i.value = "");
        adminFields.querySelectorAll("input").forEach(i => i.value = "");
        
        dashboard.classList.add("hidden");
        roleSelection.style.display = "block";
    } else if (state.screen === "login") {
        roleSelection.style.display = "block";
        loginSection.classList.add("show");
        dashboard.classList.add("hidden");
        selectedRole = state.role;
        loginTitle.textContent = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`;
        studentFields.style.display = "none";
        facultyFields.style.display = "none";
        adminFields.style.display = "none";
        if(selectedRole === "student") studentFields.style.display = "block";
        if(selectedRole === "faculty") facultyFields.style.display = "block";
        if(selectedRole === "admin") adminFields.style.display = "block";
    }
});


// -------------------- LOGIN --------------------
loginBtn.addEventListener("click", async () => {
    loginError.textContent = "";
    let url = "";
    let payload = {};

    if(selectedRole === "student") {
        const roll = document.getElementById("studentRoll").value.trim();
        const pass = document.getElementById("studentPassword").value.trim();
        const type = document.querySelector('input[name="studentLoginType"]:checked').value;
        if(!roll || !pass) { loginError.textContent = "Please fill all fields!"; return; }
        
        if (type === "event") {
            payload = { rollNumber: roll, password: pass };
            url = "/event/student/login";
        } else {
            payload = { studentRollNumber: roll, password: pass };
            url = "/student/validate";
        }

    } else if(selectedRole === "faculty") {
        const email = document.getElementById("facultyEmail").value.trim();
        const pass = document.getElementById("facultyPassword").value.trim(); // updated
        if(!email || !pass) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { email: email, password: pass }; // updated payload
        url = "/faculty/validate";

    } else if(selectedRole === "admin") {
        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value.trim();
        if(!username || !password) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { username: username, password: password };
        url = "/admin/validate";

    } else { 
        loginError.textContent = "Please select a role!"; 
        return; 
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if(res.ok){
			
			const responseData = await res.json();

			    // 1️⃣ Save JWT token
			    sessionStorage.setItem("token", responseData.token);

			    // 2️⃣ Remove token from user object
			    delete responseData.token;

			    // 3️⃣ Save user & role
			    loggedInUser = responseData;
			    sessionStorage.setItem("user", JSON.stringify(loggedInUser));
			    sessionStorage.setItem("role", selectedRole);

                if (selectedRole === "student") {
                    const type = document.querySelector('input[name="studentLoginType"]:checked').value;
                    sessionStorage.setItem("studentLoginType", type);
                    // Standardize keys for feature access
                    sessionStorage.setItem("department", responseData.department || "");
                    sessionStorage.setItem("year", responseData.year || "");
                    sessionStorage.setItem("section", responseData.section || "");
                }
                
                if (responseData.rollNumber) {
                    sessionStorage.setItem("rollNumber", responseData.rollNumber);
                } else if (responseData.studentRollNumber) {
                    sessionStorage.setItem("rollNumber", responseData.studentRollNumber);
                }

			    loginError.style.color = "green";
			    loginError.textContent = "Login Successful!";


            // -------------------- SET STUDENT ROLL FOR STUDENT.JS --------------------
			if (
			    selectedRole === "student" &&
			    typeof window.setStudentRoll === "function"
			) {
			    window.setStudentRoll(loggedInUser.rollNumber);
			}


            setTimeout(() => {
                loginSection.classList.remove("show");
                loginError.textContent = "";
                roleSelection.style.display = "none"; // hide roles
                showDashboard();
                history.pushState({ screen: "dashboard" }, "");
            }, 500);

        } else {
            loginError.style.color = "red";
            loginError.textContent = await res.text();
        }
    } catch(err) {
        loginError.style.color = "red";
        loginError.textContent = "Server error: " + err.message;
    }
});

// -------------------- SHOW DASHBOARD --------------------
function showDashboard(){
	    dashboard.classList.remove("hidden");

		if (selectedRole === "student" || selectedRole === "EVENT_STUDENT") {
		    welcomeMsg.innerHTML = `Welcome, <span class="student-name">${loggedInUser.name || "Student"}</span> <span style="font-size: 16px; font-weight: 400; color: #666; display: block; margin-top: 4px;">(Student)</span>`;
		} 
		else if (selectedRole === "faculty") {
		    welcomeMsg.innerHTML = `Welcome, <span class="faculty-name">${loggedInUser.facultyName || "Faculty"}</span> <span style="font-size: 16px; font-weight: 400; color: #666; display: block; margin-top: 4px;">(Faculty)</span>`;
		} 
		else {
		    welcomeMsg.innerHTML = `Welcome, <span style="color: #6a0dad; font-weight: 800;">Administrator</span>`;
		}


    studentDashboard.classList.add("hidden");
    facultyDashboard.classList.add("hidden");
    adminDashboard.classList.add("hidden");

    if(selectedRole === "student" || selectedRole === "EVENT_STUDENT") studentDashboard.classList.remove("hidden");
    if(selectedRole === "faculty") facultyDashboard.classList.remove("hidden");
    if(selectedRole === "admin") adminDashboard.classList.remove("hidden");

    // Profile Handlers
    const profileBtn = document.getElementById("profileBtn");
    const profileDropdown = document.getElementById("profileDropdown");
    const viewProfileDetails = document.getElementById("viewProfileDetails");
    const viewHelpLink = document.getElementById("viewHelpLink");
    const profileLogout = document.getElementById("profileLogout");

    profileBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => profileDropdown?.classList.add("hidden"));

    viewProfileDetails?.addEventListener("click", () => {
        const user = loggedInUser;
        let detailsHtml = "";
        if (selectedRole === "student" || selectedRole === "EVENT_STUDENT") {
            detailsHtml = `
                <div style="text-align:left; line-height:1.8;">
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Roll No:</strong> ${user.rollNumber}</p>
                    <p><strong>Dept:</strong> ${user.department}</p>
                    <p><strong>Year:</strong> ${user.year}</p>
                    <p><strong>Section:</strong> ${user.section}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                </div>`;
        } else if (selectedRole === "faculty") {
            detailsHtml = `
                <div style="text-align:left; line-height:1.8;">
                    <p><strong>Name:</strong> ${user.facultyName}</p>
                    <p><strong>ID:</strong> ${user.facultyId}</p>
                    <p><strong>Dept:</strong> ${user.department}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                </div>`;
        } else {
            detailsHtml = `<p><strong>Role:</strong> Administrator</p>`;
        }
        showProfileModal("My Profile Details", detailsHtml);
    });

    // Help Logic
    if (selectedRole === "student" || selectedRole === "EVENT_STUDENT") {
        viewHelpLink.style.display = "none";
    }

    viewHelpLink?.addEventListener("click", () => {
        if (selectedRole === "faculty") {
            window.open("faculty_help.html", "_blank");
        } else if (selectedRole === "admin") {
            window.open("admin_help.html", "_blank");
        }
    });

    profileLogout?.addEventListener("click", logout);

    // Logout handlers (Old ones)
    document.getElementById("studentLogout")?.addEventListener("click", logout);
    document.getElementById("facultyLogout")?.addEventListener("click", logout);
    document.getElementById("adminLogout")?.addEventListener("click", logout);
}

function showProfileModal(title, bodyHtml) {
    let m = document.getElementById("profileModal");
    if(!m) {
        m = document.createElement("div");
        m.id = "profileModal";
        m.className = "modal hidden";
        m.innerHTML = `
            <div class="modal-content">
                <h2 id="pmTitle" style="color:#6a0dad;"></h2>
                <div id="pmBody" style="margin:20px 0;"></div>
                <button class="modal-btn" onclick="document.getElementById('profileModal').classList.add('hidden')">Close</button>
            </div>`;
        document.body.appendChild(m);
    }
    document.getElementById("pmTitle").textContent = title;
    document.getElementById("pmBody").innerHTML = bodyHtml;
    m.classList.remove("hidden");
}

// -------------------- LOGOUT --------------------
function logout(){
    loggedInUser = null;
    selectedRole = null;
	sessionStorage.clear();

    dashboard.classList.add("hidden");
    roleSelection.style.display = "block"; // show roles again
    history.pushState({ screen: "roleSelection" }, "");
}
window.addEventListener("load", () => {
    const savedRole = sessionStorage.getItem("role");
    const savedUser = sessionStorage.getItem("user");

    if(savedRole && savedUser) {
        selectedRole = savedRole;
        loggedInUser = JSON.parse(savedUser);

        // If it's student, reapply roll number
		if (
		    selectedRole === "student" &&
		    loggedInUser.rollNumber &&
		    typeof window.setStudentRoll === "function"
		) {
		    window.setStudentRoll(loggedInUser.rollNumber);
		}


        roleSelection.style.display = "none";
        showDashboard();
        history.replaceState({ screen: "dashboard" }, "");
    } else {
        history.replaceState({ screen: "roleSelection" }, "");
    }
});
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("toggle-password")) {
    const inputId = e.target.dataset.target;
    const input = document.getElementById(inputId);

    if (input.type === "password") {
      input.type = "text";
    } else {
      input.type = "password";
      e.target.classList.remove("active");
    }
  }
});





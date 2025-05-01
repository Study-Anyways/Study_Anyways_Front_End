// script.js
const firebaseConfig = {
  apiKey: "AIzaSyARz0wMYTzHd210VBMP35ypRiAUqQPMcqg",
  authDomain: "study-anyways.firebaseapp.com",
  projectId: "study-anyways",
  storageBucket: "study-anyways.firebasestorage.app",
  messagingSenderId: "809106708396",
  appId: "1:809106708396:web:afe134e93a46fb30e08c09",
  measurementId: "G-J21BS34MY1"

};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("You have successfully signed up! Be proud of yourself."))
    .catch((err) => alert(err.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Logging in successful！");
      window.location.href = "index.html";
    })
    .catch((err) => alert(err.message));
}

// Google 登录函数
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      alert("Google logging in successful！");
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Google logging in failed:", error);
      alert("logging in failed, please try again.");
    });
}


function generatePlan() {
  const topic = document.getElementById("topic").value;
  const time = document.getElementById("time").value;
  const depth = document.getElementById("depth").value;

  if (!topic || !time || !depth) {
    alert("Please fill in all the fields!");
    return;
  }

  const resultDiv = document.getElementById("result");
  resultDiv.innerText = "Generating your plan. Please wait...";

  fetch("https://YOUR_FUNCTION_URL_HERE", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ topic, time, depth })
  })
    .then(res => res.json())
    .then(data => {
      if (data.choices && data.choices[0].message) {
        resultDiv.innerText = data.choices[0].message.content;
      } else {
        resultDiv.innerText = "Generation failed. Please try again.";
      }
    })
    .catch(err => {
      console.error("Error generating plan:", err);
      resultDiv.innerText = "Something went wrong. Please try again.";
    });
}

// 监听用户登录状态，动态切换按钮和功能
firebase.auth().onAuthStateChanged((user) => {
  const authBtn = document.getElementById("auth-btn");
  const saveSection = document.getElementById("save-section");

  if (user) {
    // 登录状态
    authBtn.innerText = "Logout";
    authBtn.onclick = () => {
      firebase.auth().signOut().then(() => {
        alert("You are logged out");
        window.location.reload();
      });
    };
    saveSection.style.display = "block"; // 显示保存按钮
  } else {
    // 未登录状态
    authBtn.innerText = "Login";
    authBtn.onclick = () => {
      window.location.href = "login.html";
    };
    saveSection.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-theme");
  if (!toggleBtn) return;

  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  };

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
});

function savePlan() {
  alert("📝 This will be saved to your learning history (coming soon)");
}
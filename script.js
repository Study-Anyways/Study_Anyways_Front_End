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

// 注册
function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("You have successfully signed up! Be proud of yourself."))
    .catch((err) => alert(err.message));
}

// 登录
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Logging in successful!");
      window.location.href = "index.html";
    })
    .catch((err) => alert(err.message));
}

// Google 登录
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(() => {
      alert("Google login successful!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Google login failed:", error);
      alert("Google login failed. Please try again.");
    });
}

// 生成学习计划
function generatePlan() {
  const topic = document.getElementById("topic").value;
  const time = document.getElementById("time").value;
  const depth = document.getElementById("depth").value;
  const resultDiv = document.getElementById("result");
  const spinner = document.getElementById("spinner");

  if (!topic || !time || !depth) {
    alert("Please fill in all the fields!");
    return;
  }

  resultDiv.innerText = "";
  spinner.style.display = "block";

  const user = firebase.auth().currentUser;

  if (!user) {
    alert("Please log in to generate and save your study plan.");
    spinner.style.display = "none";
    return;
  }

  // ✅ 获取用户 token 和 uid
  user.getIdToken().then((token) => {
    return fetch("https://us-central1-study-anyways.cloudfunctions.net/generatePlan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ 附加身份验证
      },
      body: JSON.stringify({ topic, time, depth, uid: user.uid }) // ✅ 传 uid
    });
  })
  .then(res => res.json())
  .then(data => {
    spinner.style.display = "none";

    if (data.message) {
      resultDiv.innerText = data.message;
    } else if (data.choices && data.choices[0].message) {
      resultDiv.innerText = data.choices[0].message.content;
    } else {
      resultDiv.innerText = "Generation failed. Please try again.";
    }
  })
  .catch(err => {
    console.error("Error generating plan:", err);
    spinner.style.display = "none";
    resultDiv.innerText = "Something went wrong. Please try again.";
  });
}

// 登录状态切换
firebase.auth().onAuthStateChanged((user) => {
  const authBtn = document.getElementById("auth-btn");
  const saveSection = document.getElementById("save-section");

  if (user) {
    authBtn.innerText = "Logout";
    authBtn.onclick = () => {
      firebase.auth().signOut().then(() => {
        alert("You are logged out");
        window.location.reload();
      });
    };
    if (saveSection) saveSection.style.display = "block";
  } else {
    authBtn.innerText = "Login";
    authBtn.onclick = () => {
      window.location.href = "login.html";
    };
    if (saveSection) saveSection.style.display = "none";
  }
});

// 夜间模式切换
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-theme");
  if (!toggleBtn) return;

  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  };

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
});

// 保存计划（预留）
function savePlan() {
  const user = firebase.auth().currentUser;
  const topic = document.getElementById("topic").value;
  const time = document.getElementById("time").value;
  const depth = document.getElementById("depth").value;
  const result = document.getElementById("result").innerText;

  if (!user) {
    alert("Please log in to save your plan.");
    return;
  }

  if (!result || result === "Generating your plan. Please wait...") {
    alert("No plan to save yet.");
    return;
  }

  firebase.firestore().collection("history").add({
    uid: user.uid,
    topic: topic,
    time: time,
    depth: depth,
    response: result,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert("✅ Plan saved to your history!");
  })
  .catch((err) => {
    console.error("Failed to save plan:", err);
    alert("❌ Failed to save your plan.");
  });
}

// ✅ 加载历史记录
function loadHistory() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please log in to view history.");
    return;
  }

  const historyList = document.getElementById("history-list");
  const historySection = document.getElementById("history-section");
  historyList.innerHTML = "Loading...";

  firebase.firestore().collection("history")
    .where("uid", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get()
    .then((querySnapshot) => {
      historyList.innerHTML = "";
      if (querySnapshot.empty) {
        historyList.innerHTML = "<li class='list-group-item'>No history found.</li>";
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const item = document.createElement("li");
          item.className = "list-group-item";
          item.innerText = `📝 ${data.topic} — ${data.response.substring(0, 80)}...`;
          historyList.appendChild(item);
        });
      }
      historySection.style.display = "block";
    })
    .catch((err) => {
      console.error("Failed to load history:", err);
      historyList.innerHTML = "<li class='list-group-item'>Error loading history.</li>";
    });
}
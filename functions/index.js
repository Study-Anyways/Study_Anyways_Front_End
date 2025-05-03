function generatePlan() {
  const input = collectStudyInput();
  const validationError = validateInput(input);
  if (validationError) {
    alert(validationError);
    return;
  }
  const resultDiv = document.getElementById("result");
  const spinner = document.getElementById("spinner");

  resultDiv.innerText = "";
  spinner.style.display = "block";

  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please log in first.");
    spinner.style.display = "none";
    return;
  }

  user.getIdToken()
    .then(token => {
      const payload = {
        topic: input.topic,
        time: input.totalDuration,
        depth: input.goal,
        uid: user.uid,
        details: input.details,
        dailyHours: input.dailyHours,
        responseStyle: input.responseStyle,
        resources: input.resources,
        learningStyles: input.learningStyles
      };

      const prompt = `\nCreate a detailed, structured, and inspiring study plan for the topic "${payload.topic}".\n\nDetails provided: ${payload.details}.\nThe student has "${payload.time}" total time, aiming to study "${payload.dailyHours}" hours per day.\nThey want to reach the "${payload.depth}" level of understanding.\n\nPreferred response style: ${payload.responseStyle}.\nCurrent resources: ${payload.resources}.\nLearning style(s): ${payload.learningStyles?.join(", ") || "not specified"}.\n\nBreak the plan into daily (or hourly) chunks if needed.\nBe practical and motivational. Keep the user's needs and context in mind.\n`;

      console.log("Sending payload:", JSON.stringify(payload, null, 2));
      console.log("Generated prompt:", prompt);

      return fetch("https://us-central1-study-anyways.cloudfunctions.net/generatePlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    })
    .then(async res => {
      spinner.style.display = "none";
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }

      if (contentType.includes("application/json")) {
        return res.json();
      } else {
        const text = await res.text();
        return { message: text };
      }
    })
    .then(data => {
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
      resultDiv.innerText = "Something went wrong: " + err.message;
    });
}

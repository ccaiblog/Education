export function showQuestionOverlay({ title, questions, onComplete }) {
  const root = document.getElementById("hud-root");
  const container = document.createElement("div");
  container.className = "quiz-overlay";

  const form = document.createElement("form");
  form.className = "quiz-panel";
  form.innerHTML = `<h2>${title}</h2><p class='sub'>Answer to earn boosts. Explanations unlock after submit.</p>`;

  questions.forEach((q, index) => {
    const wrap = document.createElement("div");
    wrap.className = "quiz-item";
    const opts = q.options
      .map(
        (option, optIdx) =>
          `<label><input type='radio' name='q${index}' value='${optIdx}' required/> <span>${option}</span></label>`,
      )
      .join("");

    wrap.innerHTML = `<h3>${index + 1}. ${q.question}</h3><div class='options'>${opts}</div><p class='explanation hidden'></p>`;
    form.appendChild(wrap);
  });

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "cta";
  submit.textContent = "Submit Answers";
  form.appendChild(submit);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    let correct = 0;

    [...form.querySelectorAll(".quiz-item")].forEach((item, idx) => {
      const selected = Number(data.get(`q${idx}`));
      const question = questions[idx];
      const explanation = item.querySelector(".explanation");
      explanation.classList.remove("hidden");
      if (selected === question.answer) {
        correct += 1;
        item.classList.add("correct");
        explanation.textContent = `✔ Correct. ${question.explanation}`;
      } else {
        item.classList.add("wrong");
        explanation.textContent = `✖ Not quite. ${question.explanation}`;
      }
    });

    submit.textContent = "Continue";
    submit.onclick = () => {
      container.remove();
      onComplete({ correct, total: questions.length });
    };
  });

  container.appendChild(form);
  root.appendChild(container);
}

export function showLeaderboardOverlay(rows, playerRank) {
  const root = document.getElementById("hud-root");
  const container = document.createElement("div");
  container.className = "leaderboard-chip";
  container.innerHTML = `<h3>Global Sprint Board</h3>
    <ol>${rows
      .map((row) => `<li class='${row.name === "YOU" ? "you" : ""}'><span>${row.name}</span><b>${row.score}</b></li>`)
      .join("")}</ol>
      <p>Your rank: <b>#${playerRank}</b></p>`;

  root.appendChild(container);
  setTimeout(() => container.remove(), 7000);
}

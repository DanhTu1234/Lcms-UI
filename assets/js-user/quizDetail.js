const quizId = new URLSearchParams(window.location.search).get("id");

document.addEventListener("DOMContentLoaded", () => {
  loadQuizDetail();
});

async function loadQuizDetail() {
  if (!quizId) {
    alert("Không tìm thấy quiz!");
    return;
  }

  try {
    const response = await axios.get(`http://localhost:8080/SpringMVC-study/api/quizz/${quizId}`);
    const quiz = response.data;

    renderQuizDetail(quiz);
  } catch (error) {
    console.error(error);
  }
}

function renderQuizDetail(quiz) {
  document.getElementById("quizTitle").textContent = quiz.title;
  document.getElementById("quizDescription").textContent = quiz.description || "Không có mô tả";
  document.getElementById("quizDuration").textContent = quiz.duration;

  const container = document.getElementById("questions-container");
  container.innerHTML = "";

  quiz.questions.forEach((q, index) => {
    const div = document.createElement("div");
    div.classList.add("question-box");

    let answersHTML = "";
    q.answers.forEach(ans => {
      const cls = ans.is_correct ? "correct" : "incorrect";
      answersHTML += `
        <div class="answer-item ${cls}">
          ${ans.answer_text}
          ${ans.is_correct ? '<i class="bi bi-check-circle text-success ms-2"></i>' : ''}
        </div>`;
    });

    // Hiển thị ảnh nếu có
    let imageHTML = "";
    if (q.media_url) {
      imageHTML = `
        <div class="text-center my-2">
          <img src="${q.media_url}" 
               alt="Question Image" 
               class="question-img rounded shadow-sm" 
               style="max-height: 180px; cursor: pointer;">
        </div>
      `;
    }

    div.innerHTML = `
      <h6><strong>Câu ${index + 1}:</strong> ${q.content}</h6>
      ${imageHTML}
      <div class="mt-2">${answersHTML}</div>
    `;

    container.appendChild(div);
  });
}

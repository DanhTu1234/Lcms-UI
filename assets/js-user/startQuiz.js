const questionArea = document.querySelector(".col-md-8.content");
const sidebar = document.querySelector(".sidebar");
const questionCountLabel = document.querySelector(".sidebar small span");
// Lấy quizId từ URL
const quizId = new URLSearchParams(window.location.search).get("id");

let quizData = null;       // Danh sách câu hỏi
let currentIndex = 0;     // Câu hỏi hiện tại
let userAnswers = [];     // Lưu đáp án người dùng
let attemptId = null;     // Lưu attemptId
let startTime = null;

// Hàm tạo attempt mới
async function createAttempt() {
  try {
    startTime = new Date();

    const response = await axios.post(
      "http://localhost:8080/SpringMVC-study/api/attemp/start",
      { quizId: quizId }
    );
    attemptId = response.data.attemptId;
    console.log("Attempt ID:", attemptId);
  } catch (error) {
    console.error("Lỗi khi tạo attempt:", error);
    showAlert("Không thể bắt đầu bài quiz!", "danger");
  }
}

// Hàm tải dữ liệu câu hỏi
async function loadQuiz() {
  try {
    const response = await axios.get(`http://localhost:8080/SpringMVC-study/api/quizz/${quizId}`);
    quizData = response.data;
    //userAnswers = new Array(quizData.questions.length).fill(null);
    userAnswers = quizData.questions.map(q => (q.question_type === "multiple" ? [] : null));

    renderQuestion();
    renderSidebar();
    // Bắt đầu đồng hồ đếm ngược
    const totalTime = quizData.duration * 60;
    startTimer(totalTime);

  } catch (error) {
    console.error(error);
    showAlert("Không thể tải câu hỏi, vui lòng thử lại!", "danger");
  }
}

// Hàm hiển thị câu hỏi hiện tại
function renderQuestion() {
  const q = quizData.questions[currentIndex];
  const isMultiple = q.question_type === "multiple";
  const inputType = isMultiple ? "checkbox" : "radio";

  questionArea.innerHTML = `
    <h4 class="mb-3">Quiz: ${quizData.title}</h4>
    <h5 class="mt-3">Câu hỏi ${currentIndex + 1}: ${q.content}</h5>
    ${q.media_url ? `<img src="${q.media_url}" class="question-image" alt="Question image">`: ""}

    ${q.answers.map((a) => {
      const checked = isMultiple
        ? (Array.isArray(userAnswers[currentIndex]) && userAnswers[currentIndex].includes(a.id) ? "checked" : "")
        : (userAnswers[currentIndex] === a.id ? "checked" : "");

      return `
        <div class="form-check">
          <input class="form-check-input" type="${inputType}" 
                 name="q${q.id}" id="opt${a.id}" value="${a.id}" ${checked}>
          <label class="form-check-label" for="opt${a.id}">
            ${a.answer_text}
          </label>
        </div>
      `;
    }).join("")}

    <div class="d-flex justify-content-between mt-4">
      <div>
        <button class="btn btn-secondary btn-nav" onclick="prevQuestion()">Prev</button>
        <button class="btn btn-primary btn-nav" onclick="nextQuestion()">Next</button>
      </div>
      
      <div>
        <button class="btn btn-outline-danger btn-nav" onclick="clearAnswer()">Clear</button>
        <button class="btn btn-warning btn-nav text-white" onclick="finishQuiz()">Finish</button>
      </div>
    </div>
  `;

  // Gắn sự kiện chọn đáp án
  document.querySelectorAll(`input[name="q${q.id}"]`).forEach((input) => {
    input.addEventListener("change", (e) => {
      const answerId = parseInt(e.target.value);

      if (isMultiple) {
        if (e.target.checked) {
          if (!userAnswers[currentIndex].includes(answerId)) {
            userAnswers[currentIndex].push(answerId);
          }
        } else {
          userAnswers[currentIndex] = userAnswers[currentIndex].filter(id => id !== answerId);
        }
      } else {
        userAnswers[currentIndex] = answerId;
      }

      renderSidebar();
    });
  });
}


function startTimer(duration) {
  const timerDisplay = document.getElementById("timer");
  let time = duration;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    if (time <= 0) {
      clearInterval(timerInterval);
      showAlert("Hết thời gian! Bài làm sẽ được nộp.");
      finishQuiz(); // tự động nộp bài
    }

    time--;
  }, 1000);
}

// Hàm xoá câu trả lời hiện tại
function clearAnswer() {
  const q = quizData.questions[currentIndex];
  const isMultiple = q.question_type === "multiple";
  userAnswers[currentIndex] = isMultiple ? [] : null;

  document.querySelectorAll(`input[name="q${q.id}"]`).forEach(r => (r.checked = false));
  renderSidebar();
}

// Hàm chuyển câu hỏi
function nextQuestion() {
  if (currentIndex < quizData.questions.length - 1) {
    currentIndex++;
    renderQuestion(currentIndex);
  } else {
    showAlert("Đây là câu cuối cùng!", "warning");
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion(currentIndex);
  } else {
    showAlert("Đây là câu đầu tiên!", "warning");
  }
}

// Sidebar hiển thị số thứ tự câu
function renderSidebar() {
  const listHTML = quizData.questions.map((q, i) => {
    let btnClass = "circle-btn default"; 

    if (userAnswers[i] !== null && !(Array.isArray(userAnswers[i]) && userAnswers[i].length === 0)) {
      btnClass = "circle-btn answered"; 
    }
    if (i === currentIndex) {
      btnClass = "circle-btn active"; 
    }

    return `<button class="${btnClass}" onclick="jumpToQuestion(${i})">${i + 1}</button>`;
  }).join("");

  const container = sidebar.querySelector(".d-flex.flex-wrap");
  if (container) container.innerHTML = listHTML;

  const doneCount = userAnswers.filter(ans => ans !== null && !(Array.isArray(ans) && ans.length === 0)).length;
  if (questionCountLabel)
    questionCountLabel.innerHTML = `${doneCount}/${quizData.questions.length}`;
}

//Hàm điều hướng đến câu hỏi cụ thể
function jumpToQuestion(i) {
  currentIndex = i;
  renderQuestion(i);
}

// Định dạng thời gian làm bài (mm:ss)
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Kết thúc quiz
async function finishQuiz() {
  let endTime = new Date();
  let durationSeconds = Math.floor((endTime - startTime) / 1000);

  const unanswered = userAnswers.filter(ans => ans === null || (Array.isArray(ans) && ans.length === 0)).length;
  if (unanswered > 0) {
    if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`)) return;
  }

  // Chuẩn bị dữ liệu gửi lên backend
  const payload = {
    quizId: quizData.id,
    attemptId: attemptId,
    durationSecond: durationSeconds,
    answers: quizData.questions.map((q, i) => ({
      questionId: q.id,
      answerId: q.question_type === "multiple"
        ? userAnswers[i]  
        : [userAnswers[i]]        
    }))
  };

  try {
    // Gửi dữ liệu qua API submit
    const response = await axios.post(
      "http://localhost:8080/SpringMVC-study/api/attemp/submit",
      payload
    );

    const data = response.data;
    const durationFormatted = formatDuration(durationSeconds);

    // Hiển thị kết quả vào modal
    document.getElementById("totalQuestions").textContent = data.totalQuestions;
    document.getElementById("correctCount").textContent = data.correctCount;
    document.getElementById("timeTaken").textContent = durationFormatted;
    const modal = new bootstrap.Modal(document.getElementById("resultModal"));
    modal.show();
    // Xử lý nút "Hiển thị đáp án"
    document.getElementById("btnReviewAnswers").onclick = () => {
      modal.hide();
      window.location.href = `reviewQuiz.html?attemptId=${data.attemptId}`;
    };
    //Khóa quiz sau khi nộp
    disableQuizUI();

  } catch (error) {
    console.error(error);
    showAlert("Gửi kết quả thất bại, vui lòng thử lại!", "danger");
  }
}

function disableQuizUI() {
  document.querySelectorAll("input[type=radio]").forEach(r => (r.disabled = true));

  document.querySelectorAll(".btn-nav").forEach(btn => (btn.disabled = true));

  if (typeof timerInterval !== "undefined") clearInterval(timerInterval);
}

document.addEventListener("DOMContentLoaded", async () => {
  await createAttempt();
  await loadQuiz();
});


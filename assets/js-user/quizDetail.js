const questionArea = document.querySelector(".col-md-8.content");
const sidebar = document.querySelector(".sidebar .d-flex.flex-wrap");
const questionCountLabel = document.querySelector(".sidebar small span");
// Lấy quizId từ URL
const quizId = new URLSearchParams(window.location.search).get("id");

let questions = [];       // Danh sách câu hỏi
let currentIndex = 0;     // Câu hỏi hiện tại
let userAnswers = {};     // Lưu đáp án người dùng

// Hàm tải dữ liệu câu hỏi
async function loadQuestions() {
  try {
    const response = await axios.get(`http://localhost:8080/SpringMVC-study/api/question/${quizId}`);
    questions = response.data;

    if (!questions.length) {
      questionArea.innerHTML = `
        <div class="text-center mt-4 text-muted">
          <i class="bi bi-folder2-open fs-2"></i>
          <p>Chưa có câu hỏi nào trong quiz này.</p>
        </div>`;
      return;
    }

    renderQuestion(currentIndex);
    renderSidebar();

  } catch (error) {
    console.error(error);
    showAlert("Không thể tải câu hỏi, vui lòng thử lại!", "danger");
  }
}

// Hàm hiển thị câu hỏi theo index
function renderQuestion(index) {
  const q = questions[index];
  questionArea.innerHTML = `
    <h4 class="mb-3">Quiz: ${q.quiz.title}</h4>
    <img src="${q.image || 'https://i.pinimg.com/736x/61/62/2e/61622ec8899cffaa687a8342a84ea525.jpg'}"
         class="question-image" alt="Question image">
    <h5 class="mt-3">Câu hỏi ${index + 1}: ${q.content}</h5>

    ${["option_a","option_b","option_c","option_d"].map((optKey, i) => `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="q${q.id}" id="opt${i}" value="${i}" ${userAnswers[q.id] == i ? "checked" : ""}>
        <label class="form-check-label" for="opt${i}">
          ${q[optKey]}
        </label>
      </div>`).join("")
    }

    <div class="d-flex justify-content-between mt-4">
      <button class="btn btn-secondary btn-nav" onclick="prevQuestion()">Prev</button>
      <div>
        <button class="btn btn-primary btn-nav" onclick="nextQuestion()">Next</button>
        <button class="btn btn-warning btn-nav text-white" onclick="finishQuiz()">Finish</button>
      </div>
    </div>
  `;

  // Bắt sự kiện chọn đáp án
  document.querySelectorAll(`input[name="q${q.id}"]`).forEach(radio => {
    radio.addEventListener("change", (e) => {
      userAnswers[q.id] = parseInt(e.target.value);
      renderSidebar(); // cập nhật trạng thái câu đã làm
    });
  });
}

// Hàm chuyển câu hỏi
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
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
  sidebar.innerHTML = questions.map((q, i) => `
    <button class="circle-btn ${i === currentIndex ? 'active' : ''} ${userAnswers[q.id] !== undefined ? 'answered' : ''}"
            onclick="jumpToQuestion(${i})">${i + 1}</button>
  `).join("");

  const doneCount = Object.keys(userAnswers).length;
  questionCountLabel.innerHTML = `${doneCount}/${questions.length}`;
}

//Hàm điều hướng đến câu hỏi cụ thể
function jumpToQuestion(i) {
  currentIndex = i;
  renderQuestion(i);
}

// Kết thúc quiz
function finishQuiz() {
  const unanswered = questions.length - Object.keys(userAnswers).length;
  if (unanswered > 0) {
    if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`)) return;
  }

  console.log("User Answers:", userAnswers);
  showAlert("Bài làm của bạn đã được nộp!", "success");

  // Gửi kết quả về server
  // axios.post("http://localhost:8080/SpringMVC-study/api/submit", userAnswers);
}

document.addEventListener("DOMContentLoaded", loadQuestions);


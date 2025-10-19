document.addEventListener("DOMContentLoaded", () => {
    initPage();
});

function initPage() {
    const quizSelect = document.getElementById("quizSelect");
    const addQuestionBtn = document.getElementById("addQuestionBtn");
    const questionsContainer = document.getElementById("questions-container");
    const saveBtn = document.getElementById("saveBtn");

    loadQuizList();

    addQuestionBtn.addEventListener("click", () => addQuestion(questionsContainer));
    questionsContainer.addEventListener("click", (e) => handleAnswerEvents(e));
    document.addEventListener("change", (e) => handleImagePreview(e));
    saveBtn.addEventListener("click", () => saveQuestions(quizSelect, questionsContainer));
}

// Load danh sách quiz
async function loadQuizList() {
    try {
        const { data } = await axios.get("http://localhost:8080/SpringMVC-study/api/quizz");
        const select = document.getElementById("quizSelect");
        select.innerHTML = '<option value="">Chọn bài quiz</option>';

        data.forEach((quiz) => {
            const opt = document.createElement("option");
            opt.value = quiz.id;
            opt.textContent = quiz.title;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Lỗi tải danh sách quiz:", err);
        showAlert("Không thể tải danh sách quiz!", "danger");
    }
}

// Tạo câu hỏi mới
function addQuestion(container) {
    const questionBox = createQuestionBox();
    container.appendChild(questionBox);
}

function createQuestionBox() {
    const div = document.createElement("div");
    div.classList.add("question-box");
    div.innerHTML = `
        <button class="btn btn-sm btn-outline-danger remove-question">× Xóa câu hỏi</button>
        <input type="text" class="form-control mb-2 question-text" placeholder="Nhập nội dung câu hỏi">
        <div class="d-flex align-items-center mb-3">
            <input type="file" class="form-control w-50 question-image">
            <img src="" alt="" class="question-img d-none preview-img" />
        </div>
        <div class="answers-container">
            ${createAnswerItem()}
            ${createAnswerItem()}
            ${createAnswerItem()}
            ${createAnswerItem()}
        </div>
    `;
    return div;
}

function createAnswerItem() {
    return `
        <div class="answer-item d-flex align-items-center gap-2 mb-2">
            <input type="checkbox" class="form-check-input me-2" title="Đáp án đúng?">
            <input type="text" class="form-control" placeholder="Answer">
            <button class="btn btn-outline-primary btn-sm add-answer">+</button>
            <button class="btn btn-outline-danger btn-sm remove-answer">-</button>
        </div>
    `;
}

// Xử lý sự kiện thêm, xóa đáp án và câu hỏi
function handleAnswerEvents(e) {
    if (e.target.classList.contains("remove-question")) {
        e.target.closest(".question-box").remove();
    }

    if (e.target.classList.contains("add-answer")) {
        const container = e.target.closest(".answers-container");
        container.insertAdjacentHTML("beforeend", createAnswerItem());
    }

    if (e.target.classList.contains("remove-answer")) {
        const container = e.target.closest(".answers-container");
        if (container.querySelectorAll(".answer-item").length > 2) {
            e.target.closest(".answer-item").remove();
        } else {
            showAlert("Phải có ít nhất 2 đáp án!", "danger");
        }
    }
}

// Xử lý preview ảnh câu hỏi
function handleImagePreview(e) {
    if (e.target.classList.contains("question-image")) {
        const file = e.target.files[0];
        const img = e.target.closest(".d-flex").querySelector(".preview-img");
        if (file) {
            img.src = URL.createObjectURL(file);
            img.classList.remove("d-none");
        }
    }
}

// Lưu dl câu hỏi
async function saveQuestions(quizSelect, container) {
    const quizId = quizSelect.value;
    if (!quizId) {
        showAlert("Vui lòng chọn bài Quiz trước khi lưu!", "danger");
        return;
    }

    const questionBoxes = container.querySelectorAll(".question-box");
    const questions = collectQuestions(quizId, questionBoxes);

    if (questions.length === 0) {
        showAlert("Bạn chưa nhập câu hỏi nào hợp lệ!", "danger");
        return;
    }

    try {
        const response = await axios.post(
            "http://localhost:8080/SpringMVC-study/api/question",
            questions,
            { headers: { "Content-Type": "application/json" } }
        );
        showAlert("Lưu câu hỏi thành công!", "success");
        console.log(response.data);
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        showAlert("Lỗi khi lưu câu hỏi!", "danger");
    }
}

// Thu thập dl câu hỏi lưu vào biến questions
function collectQuestions(quizId, questionBoxes) {
    const questions = [];

    questionBoxes.forEach((box) => {
        const content = box.querySelector(".question-text").value.trim();
        const answers = box.querySelectorAll(".answer-item");

        const options = [];
        let correctOption = "";

        answers.forEach((ans, idx) => {
            const text = ans.querySelector("input[type='text']").value.trim();
            const isCorrect = ans.querySelector("input[type='checkbox']").checked;

            if (text !== "") options.push(text);
            if (isCorrect) correctOption = String.fromCharCode(65 + idx);
        });

        if (content && options.length >= 2) {
            questions.push({
                quiz_id: quizId,
                content: content,
                option_a: options[0] || "",
                option_b: options[1] || "",
                option_c: options[2] || "",
                option_d: options[3] || "",
                correct_option: correctOption
            });
        }
    });

    return questions;
}


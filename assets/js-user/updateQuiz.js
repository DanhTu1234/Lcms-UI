const quizId = new URLSearchParams(window.location.search).get("id");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const container = document.getElementById("questions-container");
const updateBtn = document.getElementById("updateBtn");

document.addEventListener("kc-ready", () => {
    loadQuizData(quizId);
    initPage();
});

function initPage() {
    addQuestionBtn.addEventListener("click", () => addQuestion(container));
    container.addEventListener("click", (e) => handleAnswerEvents(e));
    updateBtn.addEventListener("click", () => updateQuiz(quizId));
}

// Tạo câu hỏi mới
function addQuestion(container) {
    const questionBox = createQuestionBox();
    container.appendChild(questionBox);
    questionBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function createQuestionBox(question = { content: "", question_type: "", answers: [] }) {
    const div = document.createElement("div");
    div.classList.add("question-box");
    div.dataset.questionId = question.id || "";

    const type = question.question_type;
    const content = question.content;

    div.innerHTML = `
        <input type="hidden" class="question-id" value="${question.id || ""}">
        <button class="btn btn-sm btn-outline-danger remove-question">× Xóa câu hỏi</button>
        <select class="form-select mb-2 question-type">
            <option value="">Chọn loại câu hỏi</option>
            <option value="single" ${type === "single" ? "selected" : ""}>Single Choice</option>
            <option value="multiple" ${type === "multiple" ? "selected" : ""}>Multiple Choice</option>
            <option value="true_false" ${type === "true_false" ? "selected" : ""}>True / False</option>
        </select>
        <input type="text" class="form-control mb-2 question-text" placeholder="Nhập nội dung câu hỏi" value="${content}">
        <div class="image-upload-box mb-3 text-center border rounded p-3 bg-light position-relative">
            <input type="file" class="question-image d-none" accept="image/*">
            
            <div class="image-preview-container">
                ${question.media_url
                    ? `<img src="${question.media_url}" class="preview-img rounded" style="max-height: 150px;">`
                    : `<p class="text-muted m-0">Chưa có ảnh</p>`}
            </div>

            <div class="mt-2 d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-sm btn-primary select-image-btn">Chọn ảnh</button>
                ${question.media_url 
                    ? `<button type="button" class="btn btn-sm btn-outline-danger remove-image-btn">Xóa ảnh</button>`
                    : ""}
            </div>
        </div>
        <div class="answers-container"></div>
    `;

    //Xử lý ảnh
    const fileInput = div.querySelector(".question-image");
    const selectImageBtn = div.querySelector(".select-image-btn");
    const removeImageBtn = div.querySelector(".remove-image-btn");
    const previewContainer = div.querySelector(".image-preview-container");

    selectImageBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewContainer.innerHTML = `
                    <img src="${event.target.result}" class="preview-img rounded" style="max-height: 150px;">
                `;
                // Thêm nút xóa nếu chưa có
                if (!div.querySelector(".remove-image-btn")) {
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "btn btn-sm btn-outline-danger remove-image-btn";
                    removeBtn.textContent = "Xóa ảnh";
                    removeBtn.addEventListener("click", () => {
                        previewContainer.innerHTML = `<p class="text-muted m-0">📷 Chưa có ảnh</p>`;
                        fileInput.value = "";
                        removeBtn.remove();
                    });
                    selectImageBtn.insertAdjacentElement("afterend", removeBtn);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Xóa ảnh cũ
    if (removeImageBtn) {
        removeImageBtn.addEventListener("click", () => {
            previewContainer.innerHTML = `<p class="text-muted m-0">Chưa có ảnh</p>`;
            fileInput.value = "";
            removeImageBtn.remove();
        });
    }

    const answersContainer = div.querySelector(".answers-container");
    const typeSelect = div.querySelector(".question-type");
    // Khi thay đổi loại câu hỏi, hiển thị đáp án mặc định
    typeSelect.addEventListener("change", (e) => {
        const selectedType = e.target.value;
        renderDefaultAnswers(answersContainer, selectedType);
    });

    // Hiển thị dl đáp án
    if(question.answers && question.answers.length > 0) {
        question.answers.forEach((ans) => {
            answersContainer.insertAdjacentHTML("beforeend", createAnswerItem(ans));
        });
    }else {
        // Nếu mới thêm, hiển thị mặc định theo loại
        renderDefaultAnswers(answersContainer, type);
    }
    return div;
}

function createAnswerItem(answer = {}) {
    const { id = "", answer_text = "", is_correct = false } = answer;
    return `
        <div class="answer-item d-flex align-items-center gap-2 mb-2">
            <input type="hidden" class="answer-id" value="${id}">
            <input type="checkbox" class="form-check-input me-2" title="Đáp án đúng?" ${is_correct ? "checked" : ""}>
            <input type="text" class="form-control" placeholder="Answer" value="${answer_text}">
            <button class="btn btn-outline-primary btn-sm add-answer">+</button>
            <button class="btn btn-outline-danger btn-sm remove-answer">-</button>
        </div>
    `;
}

const fileInput = div.querySelector(".question-image");
const previewImg = div.querySelector(".preview-img");
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    }
});

function renderDefaultAnswers(container, type) {
  if (type === "true_false") {
    container.innerHTML = `
      ${createAnswerItem("True", true)}
      ${createAnswerItem("False", false)}
    `;
  } else if (type === "single" || type === "multiple") {
    container.innerHTML = `
      ${createAnswerItem()}
      ${createAnswerItem()}
      ${createAnswerItem()}
      ${createAnswerItem()}
    `;
  } else {
    container.innerHTML = "";
  }
}

// Xử lý sự kiện thêm, xóa đáp án và câu hỏi
function handleAnswerEvents(e) {
    if (e.target.classList.contains("remove-question")) {
        if (confirm("Bạn có chắc muốn xóa câu hỏi này không?")) {
            e.target.closest(".question-box").remove();
        }
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

// Hàm tải dữ liệu quiz để hiển thị
async function loadQuizData(quizId) {
  try {
    const response = await axios.get(`http://localhost:8444/api/quizz/${quizId}`);
    const quiz = response.data;

    // Gán thông tin quiz vào form
    document.getElementById("quizName").value = quiz.title;
    document.getElementById("quizDescription").value = quiz.description;
    document.getElementById("quizDuration").value = quiz.duration;

    container.innerHTML = "";

    // Hiển thị danh sách câu hỏi
    quiz.questions.forEach((q) => {
        const questionBox = createQuestionBox(q);
        container.appendChild(questionBox);
    });
  } catch (error) {
    console.error(error);
    showAlert("Không tải được dữ liệu quiz!", "danger");
  }
}

// Lưu dl câu hỏi
async function updateQuiz(quizId) {
    const title = document.getElementById("quizName").value.trim();
    const description = document.getElementById("quizDescription").value.trim();
    const duration = parseInt(document.getElementById("quizDuration").value.trim());
    const questions = collectQuestions(document.querySelectorAll(".question-box"));
    if (!title || !duration) {
        showAlert("Vui lòng nhập đầy đủ Quiz trước khi lưu!", "danger");
        return;
    }

    if (questions.length === 0) {
        showAlert("Bạn chưa nhập câu hỏi nào hợp lệ!", "danger");
        return;
    }

    // Upload ảnh nếu có thay đổi
    for (let i = 0; i < questionBoxes.length; i++) {
        const box = questionBoxes[i];
        const fileInput = box.querySelector(".question-image");
        const file = fileInput.files[0];

        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await axios.post("http://localhost:8444/api/quizz/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                // Gán media_url mới từ AWS
                questions[i].media_url = res.data;
            } catch (error) {
                console.error("Lỗi upload ảnh:", error);
                showAlert(`Lỗi khi upload ảnh cho câu hỏi ${i + 1}`, "danger");
                return;
            }
        } else {
            // Nếu không chọn ảnh mới → giữ ảnh cũ (nếu có)
            const oldImg = box.querySelector(".preview-img");
            if (oldImg && oldImg.src) {
                questions[i].media_url = oldImg.src;
            } else {
                questions[i].media_url = null;
            }
        }
    }

    try {
        await axios.put(`http://localhost:8444/api/quizz/${quizId}`,
            {
                title,
                description,
                duration,
                questions
            },
            { headers: { "Content-Type": "application/json" } }
        );
        showAlert("Cập nhật quiz thành công!", "success");
        setTimeout(() => window.location.href = "/user/manageQuiz.html", 1500);
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        showAlert("Lỗi khi cập nhật quiz!", "danger");
    }
}

// Thu thập dl câu hỏi lưu vào biến questions
function collectQuestions(questionBoxes) {
    const questions = [];
    let valid = true;

    questionBoxes.forEach((box, index) => {
        const questionidInput = box.querySelector(".question-id");
        const questionId = questionidInput && questionidInput.value ? parseInt(questionidInput.value) : null;
        const content = box.querySelector(".question-text").value.trim();
        const type = box.querySelector(".question-type").value;
        const answerItems = box.querySelectorAll(".answer-item");

        const answers  = [];
        let correctCount = 0;

        answerItems.forEach((ans) => {
            const answerIdInput = ans.querySelector(".answer-id");
            const answerId = answerIdInput && answerIdInput.value ? parseInt(answerIdInput.value) : null;
            const text = ans.querySelector("input[type='text']").value.trim();
            const isCorrect = ans.querySelector("input[type='checkbox']").checked;

            if (text !== "") {
                answers.push({ id: answerId, answer_text: text, is_correct: isCorrect });
                if (isCorrect) correctCount++;
            }
        });

        if (!content) {
            showAlert(`Câu hỏi ${index + 1} chưa nhập nội dung!`, "danger");
            valid = false;
            return;
        }

        if (!type) {
            showAlert(`Câu hỏi ${index + 1} chưa chọn loại câu hỏi!`, "danger");
            valid = false;
            return;
        }

        if (answers.length < 2) {
            showAlert(`Câu hỏi ${index + 1} phải có ít nhất 2 đáp án!`, "danger");
            valid = false;
            return;
        }

        if (type === "single" && correctCount !== 1) {
            showAlert(`Câu hỏi ${index + 1}: Single Choice phải có đúng 1 đáp án đúng!`, "danger");
            valid = false;
            return;
        }
        if (type === "multiple" && correctCount < 2) {
            showAlert(`Câu hỏi ${index + 1}: Multiple Choice phải có ít nhất 2 đáp án đúng!`, "danger");
            valid = false;
            return;
        }
        if (type === "true_false" && correctCount !== 1) {
            showAlert(`Câu hỏi ${index + 1} (True/False) chỉ được có 1 đáp án đúng!`, "danger");
            valid = false;
            return;
        }

        questions.push({
            id: questionId,
            content: content,
            question_type: type,
            answers: answers
        });
    });

    if (valid) {
        return questions;
    } else {
        return [];
    }
}

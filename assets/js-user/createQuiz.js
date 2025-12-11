document.addEventListener("kc-ready", () => {
    initPage();
});

function initPage() {
    const addQuestionBtn = document.getElementById("addQuestionBtn");
    const questionsContainer = document.getElementById("questions-container");
    const saveBtn = document.getElementById("saveBtn");

    addQuestionBtn.addEventListener("click", () => addQuestion(questionsContainer));
    questionsContainer.addEventListener("click", (e) => handleAnswerEvents(e));
    document.addEventListener("change", (e) => handleImagePreview(e));
    saveBtn.addEventListener("click", () => saveQuiz(questionsContainer));
}

// Tạo câu hỏi mới
function addQuestion(container) {
    const questionBox = createQuestionBox();
    container.appendChild(questionBox);
    questionBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function createQuestionBox() {
    const div = document.createElement("div");
    div.classList.add("question-box");
    div.innerHTML = `
        <button class="btn btn-sm btn-outline-danger remove-question">× Xóa câu hỏi</button>

        <select class="form-select mb-2 question-type">
            <option value="">Chọn loại câu hỏi</option>
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
            <option value="true_false">True / False</option>
        </select>

        <input type="text" class="form-control mb-2 question-text" placeholder="Nhập nội dung câu hỏi">
        <div class="image-upload-box mb-3 text-center border rounded p-3 bg-light position-relative">
            <input type="file" class="question-image d-none" accept="image/*">
            <div class="image-preview-container">
                <p class="text-muted m-0">Chưa có ảnh</p>
            </div>
            <div class="mt-2 d-flex justify-content-center gap-2">
                <button type="button" class="btn btn-sm btn-primary select-image-btn">Chọn ảnh</button>
            </div>
        </div>
        <div class="answers-container"></div>
    `;

    // --- XỬ LÝ ẢNH ---
    const fileInput = div.querySelector(".question-image");
    const selectImageBtn = div.querySelector(".select-image-btn");
    const previewContainer = div.querySelector(".image-preview-container");

    // Khi nhấn "Chọn ảnh"
    selectImageBtn.addEventListener("click", () => fileInput.click());

    // Khi chọn ảnh xong
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewContainer.innerHTML = `
                    <img src="${event.target.result}" class="preview-img rounded" 
                         style="max-height: 150px; cursor: pointer;">
                `;
                // Thêm nút Xóa
                if (!div.querySelector(".remove-image-btn")) {
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "btn btn-sm btn-outline-danger remove-image-btn";
                    removeBtn.textContent = "Xóa ảnh";
                    removeBtn.addEventListener("click", () => {
                        previewContainer.innerHTML = `<p class="text-muted m-0">Chưa có ảnh</p>`;
                        fileInput.value = "";
                        removeBtn.remove();
                    });
                    selectImageBtn.insertAdjacentElement("afterend", removeBtn);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Khi chọn loại câu hỏi, hiển thị giao diện đáp án tương ứng
    const typeSelect = div.querySelector(".question-type");
    typeSelect.addEventListener("change", (e) => {
        const type = e.target.value;
        const answersContainer = div.querySelector(".answers-container");

        if (type === "true_false") {
        answersContainer.innerHTML = `
            ${createAnswerItem("True")}
            ${createAnswerItem("False")}
        `;
        } else if (type === "single" || type === "multiple") {
        answersContainer.innerHTML = `
            ${createAnswerItem()}
            ${createAnswerItem()}
            ${createAnswerItem()}
            ${createAnswerItem()}
        `;
        }
    });

    return div;
}

function createAnswerItem(defaultValue = "") {
  return `
    <div class="answer-item d-flex align-items-center gap-2 mb-2">
      <input type="checkbox" class="form-check-input me-2" title="Đáp án đúng?">
      <input type="text" class="form-control" placeholder="Answer" value="${defaultValue}">
      <button class="btn btn-outline-primary btn-sm add-answer">+</button>
      <button class="btn btn-outline-danger btn-sm remove-answer">-</button>
    </div>
  `;
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
        const questionType = e.target
            .closest(".question-box")
            .querySelector(".question-type").value;

        if (questionType === "true_false") {
            showAlert("Loại True/False chỉ có 2 đáp án!", "warning");
            return;
        }
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
async function saveQuiz(container) {
    const title = document.getElementById("quizName").value.trim();
    const description = document.getElementById("quizDescription").value.trim();
    const duration = parseInt(document.getElementById("quizDuration").value.trim());
    if (!title || !duration) {
        showAlert("Vui lòng nhập đầy đủ Quiz trước khi lưu!", "danger");
        return;
    }

    const questionBoxes = container.querySelectorAll(".question-box");
    const questions = collectQuestions(questionBoxes);

    if (questions.length === 0) {
        showAlert("Bạn chưa nhập câu hỏi nào hợp lệ!", "danger");
        return;
    }

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

                questions[i].media_url = res.data;
            } catch (error) {
                console.error("Lỗi upload ảnh:", error);
                showAlert(`Lỗi khi upload ảnh cho câu hỏi ${i + 1}`, "danger");
                return;
            }
        }
    }

    const quiz = {
        title: title,
        description: description,
        duration: duration,
        questions: questions,
    };

    try {
        await axios.post("http://localhost:8444/api/quizz",
            quiz,
            { headers: { "Content-Type": "application/json" } }
        );      
        showAlert("Tạo quiz thành công!", "success");
        setTimeout(() => window.location.href = "/user/manageQuiz.html", 1000);
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        showAlert("Lỗi khi tạo quiz!", "danger");
    }
}

// Thu thập dl câu hỏi lưu vào biến questions
function collectQuestions(questionBoxes) {
    const questions = [];
    let valid = true;

    questionBoxes.forEach((box, index) => {
        const content = box.querySelector(".question-text").value.trim();
        const type = box.querySelector(".question-type").value;
        const answerItems = box.querySelectorAll(".answer-item");

        const answers = [];
        let correctCount = 0;

        answerItems.forEach((ans) => {
            const text = ans.querySelector("input[type='text']").value.trim();
            const isCorrect = ans.querySelector("input[type='checkbox']").checked;

            if (text !== "") {
                answers.push({
                    answer_text: text,
                    is_correct: isCorrect
                });
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

        // Nếu hợp lệ thì push vào danh sách câu hỏi
        questions.push({
            content: content,
            question_type: type,
            answers: answers,
        });
    });

    if (valid) {
        return questions;
    } else {
        return [];
    }
}



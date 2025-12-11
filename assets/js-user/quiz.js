const quizGrid = document.getElementById("quizGrid");

async function loadQuiz() {
    try{
        const response = await axios.get(`http://localhost:8444/api/quizz`);
        const quizzes = response.data;
        quizGrid.innerHTML = ''; //Xóa nội dung cũ

        if (quizzes.length == 0) {
            quizGrid.innerHTML = `
                <div class="text-center w-100 mt-4 text-muted">
                    <i class="bi bi-folder2-open fs-2"></i>
                    <p>Chưa có quiz nào trong thư mục này.</p>
                </div>`;
            return;
        }
        quizzes.forEach(quiz => {
            const quizHtml =`
                <div class="col-lg-4 col-md-4 mb-4">
                    <div class="card quiz-card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title fw-bold text-primary mb-0">${quiz.title}</h5>
                                <span class="quiz-duration">
                                    <i class="bi bi-clock me-1"></i>${quiz.duration}m
                                </span>
                            </div>
                            
                            <p class="card-text text-muted flex-grow-1">
                                ${quiz.description}
                            </p>
                            
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <small class="text-muted">
                                        <i class="bi bi-question-circle me-1"></i>
                                        20 questions
                                    </small>
                                    <small class="text-muted">
                                        <i class="bi bi-person me-1"></i>
                                        Beginner
                                    </small>
                                </div>
                                
                                <button class="btn start-quiz-btn text-white w-100" data-quiz-id="${quiz.id}">
                                    <i class="bi bi-play-circle me-2"></i>Start Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            quizGrid.insertAdjacentHTML('beforeend', quizHtml);
            });
            document.querySelectorAll('.start-quiz-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const quizId = e.currentTarget.getAttribute('data-quiz-id');
                    window.location.href = `startQuiz.html?id=${quizId}`;
                });
            });
        
    }catch(error){
        console.error("Lỗi khi tải danh sách quiz:", error);
        showAlert("Không thể tải danh sách quiz!", "danger");
    }
}

document.addEventListener("kc-ready", () => {
    loadQuiz();
});
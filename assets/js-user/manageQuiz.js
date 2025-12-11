const quizGrid = document.getElementById('quiz-table-body');

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}


async function loadQuiz(){
    try {
        const response = await axios.get(`http://localhost:8444/api/quizz`);
        const quizzes = response.data;
        quizGrid.innerHTML = '';
        if (quizzes.length == 0) {
            quizGrid.innerHTML = `
                <div class="text-center w-100 mt-4 text-muted">
                    <i class="bi bi-folder2-open fs-2"></i>
                    <p>Chưa có quiz nào được tạo</p>
                </div>`;
            return;
        }
        quizzes.forEach((quiz, index) => {   
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${quiz.title}</td>
                    <td>${quiz.description}</td>
                    <td>${quiz.duration} phút</td>
                    <td>${formatDate(quiz.created_at)}</td>
                    <td>
                        <a href="quizDetail.html?id=${quiz.id}" class="btn btn-sm btn-info">Xem</a>
                        <a href="updateQuiz.html?id=${quiz.id}" class="btn btn-sm btn-warning">Sửa</a>
                        <button class="btn btn-sm btn-danger" onclick="deleteQuiz(${quiz.id})">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                </tr>`;
            quizGrid.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        showAlert("Không thể tải danh sách quiz!", "danger");
    }
}

async function deleteQuiz(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa quiz này?")) return;

    try {
        await axios.delete(`http://localhost:8444/api/quizz/${id}`);
        showAlert("Đã xóa quiz thành công!", "success");
        setTimeout(loadQuiz, 1000);
    } catch (error) {
        console.error("Lỗi khi xóa quiz:", error);
        showAlert("Không thể xóa quiz!", "danger");
    }
}

document.addEventListener('kc-ready', () => {
    loadQuiz();
});
const dropArea = document.querySelector('.upload-area');
const fileList = document.getElementById('file-container');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('upload-progress');
const uploadModalEl = document.getElementById('uploadModal');
const uploadModalInstance = new bootstrap.Modal(uploadModalEl);

//Hàm lấy icon file theo định dạng
function getFileIcon(type) {
    if (!type || typeof type !== "string") return "text";
    type = type.toLowerCase();

    if (type === "application/pdf") return "pdf";
    if (type.includes("word") || type.includes("wordprocessingml")) return "word";
    if (type.includes("excel") || type.includes("spreadsheetml")) return "excel";
    if (type.includes("powerpoint") || type.includes("presentationml")) return "ppt";
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "play";
    return "text";
}


//Hàm định dạng kích thước file
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

//Hàm tải danh sách tài liệu
async function loadDocuments() {

    try {
        const response = await axios.get(`http://localhost:8444/api/documents`);
        const documents = response.data;

        fileList.innerHTML = ''; //Xóa nội dung cũ

        if (documents.length == 0) {
            fileList.innerHTML = `
                <div class="text-center w-100 mt-4 text-muted">
                    <i class="bi bi-folder2-open fs-2"></i>
                    <p>Chưa có tài liệu nào trong thư mục này.</p>
                </div>`;
            return;
        }

        documents.forEach(doc => {
            const fileHtml = `
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="file-item">
                        <div class="form-check mb-2">
                            <input class="form-check-input file-checkbox" type="checkbox" value="${doc.id}">
                        </div>
                        <div class="file-icon">
                            <i class="bi bi-file-earmark-${getFileIcon(doc.file_type)}"></i>
                        </div>
                        <div class="file-name">${doc.display_name}</div>
                        <div class="file-meta">${formatFileSize(doc.file_size)} • ${new Date().toLocaleDateString()}</div>
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="previewFile('${doc.file_name}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button onclick="downloadFile('${doc.file_name}')" class="btn btn-sm btn-outline-success me-1">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteFile('${doc.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            fileList.insertAdjacentHTML('beforeend', fileHtml);

        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách tài liệu:", error);
        showAlert("Không thể tải danh sách tài liệu!", "danger");
    }
}

function displaySelectedFiles(files){
    if(!files || files.length === 0) {
        dropArea.innerHTML = `
            <i class="bi bi-cloud-upload"></i>
            <h5>Drag & Drop files here</h5>
            <p class="text-muted">or click to browse</p>`;
        return;    
    }

    dropArea.innerHTML='';
    const filelist = document.createElement('ul');
    filelist.className='list-unstyled p-3 text-start';

    for (const file of files) {
        const listItem = document.createElement('li');
        listItem.className = 'd-flex align-items-center mb-2 file-preview-item';
        listItem.innerHTML = `<i class="bi bi-file-earmark-${getFileIcon(file.type)} fs-4 me-3"></i>
                                <div class="flex-grow-1">
                                    <div class="fw-bold text-truncate">${file.name}</div>
                                    <div class="text-muted small">${formatFileSize(file.size)}</div>
                                </div>`;
        filelist.appendChild(listItem);                        
    }
    dropArea.appendChild(filelist);

}

//Hàm upload file 
async function uploadFiles() {
    const files = fileInput.files;

    if (files.length === 0) {
        showAlert('Vui lòng chọn tệp để tải lên.', 'warning');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]); // 'files' phải khớp với tên tham số @RequestParam bên Spring
    }

    try {
        if(progressContainer) progressContainer.style.display = 'block'; // Hiển thị thanh tiến trình

        await axios.post('http://localhost:8444/api/documents', formData,{
            onUploadProgress: progressEvent => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (progressContainer) {
                    progressContainer.style.width = `${percentCompleted}%`;
                    progressContainer.textContent = `${percentCompleted}%`;
                }
            }
        });
        showAlert("Upload thành công!", "success");
        uploadModalInstance.hide();
        loadDocuments(); // Tải lại danh sách
    } catch (error) {
        console.error(error);
        showAlert("Upload thất bại!", "danger");
    }finally {
        // Ẩn thanh tiến trình sau 2 giây
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
            if (progressContainer) {
                progressContainer.style.width = '0%';
                progressContainer.textContent = '';
            }
        }, 2000);
    }
}

//Hàm xem trước file
async function previewFile(fileName) {
    try {
        const res = await axios.get(`http://localhost:8444/api/documents/${fileName}/preview`);
        const downloadUrl = res.data;
        window.open(downloadUrl, "_blank"); // mở link S3 tạm thời trong tab mới
    } catch (error) {
        console.error("Lỗi khi mở file", error);
        showAlert("Không thể mở!", "danger");
    }
}

//Hàm tải file
async function downloadFile(fileName) {
    const confirmDownload = confirm(`Bạn có chắc muốn tải xuống tài liệu không?`);
    if (!confirmDownload) {
        showAlert("Đã hủy tải xuống.", "warning");
        return;
    }
    try {
        const res = await axios.get(`http://localhost:8444/api/documents/${fileName}/download`);
        window.location.href = res.data;
    } catch (error) {
        console.error("Lỗi khi tạo link tải:", error);
        showAlert("Không thể tạo link tải file!", "danger");
    }
}

// Delete file
async function deleteFile(id) {
    if (confirm(`Bạn có chắc muốn xóa tài liệu này không?`)) {
        try{
            await axios.delete(`http://localhost:8444/api/documents/${id}`);
            showAlert('Xóa tài liệu thành công', 'success');
            loadDocuments(); 
        }catch(error){
            console.error("Lỗi khi xóa tài liệu:", error);
            showAlert("Không thể xóa tài liệu!", "danger");
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();

    // Xử lý khi click nút upload trong modal
    if (fileInput) {
        fileInput.addEventListener('change', () => displaySelectedFiles(fileInput.files));
    }

    // Xử lý kéo thả file
    if (dropArea) {
        // Ngăn chặn hành vi mặc định của trình duyệt
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        // Thêm/loại bỏ lớp CSS khi kéo thả
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('dragging'));
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragging'));
        });
        // Xử lý khi thả file
        dropArea.addEventListener('drop', event => {
            const files = event.dataTransfer.files;
            fileInput.files = files; // Sync with the file input
            displaySelectedFiles(files);
        });
    }

    // Reset modal
    uploadModalEl.addEventListener('hidden.bs.modal', () => {
        fileInput.value = '';
        displaySelectedFiles(null);
    });
});
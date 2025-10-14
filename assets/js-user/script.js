const dropArea = document.querySelector('.upload-area');
const fileList = document.getElementById('file-container');
const fileInput = document.getElementById('fileInput');
const alertContainer = document.getElementById("alert-container");
const progressContainer = document.getElementById('upload-progress');
const uploadModalEl = document.getElementById('uploadModal');
const uploadModalInstance = new bootstrap.Modal(uploadModalEl);

//Hàm hiển thị thông báo
function showAlert(message, type = "info") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show mt-2`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    //setTimeout(() => alert.remove(), 5000);
}

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
        const response = await axios.get(`http://localhost:8080/SpringMVC-study/api/documents`);
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

        await axios.post('http://localhost:8080/SpringMVC-study/api/documents', formData,{
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
        const res = await axios.get(`http://localhost:8080/SpringMVC-study/api/documents/${fileName}/preview`);
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
        const res = await axios.get(`http://localhost:8080/SpringMVC-study/api/documents/${fileName}/download`);
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
            await axios.delete(`http://localhost:8080/SpringMVC-study/api/documents/${id}`);
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

// Filter Functionality
function initializeFilters() {
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.addEventListener('input', applyFilters);
    });
    
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const fileType = document.getElementById('fileTypeFilter')?.value || '';
    const courseFilter = document.getElementById('courseFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    
    const fileItems = document.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        const fileMeta = item.querySelector('.file-meta').textContent.toLowerCase();
        
        let show = true;
        
        // Search filter
        if (searchTerm && !fileName.includes(searchTerm)) {
            show = false;
        }
        
        // File type filter
        if (fileType && !fileMeta.includes(fileType)) {
            show = false;
        }
        
        // Course filter
        if (courseFilter && !fileMeta.includes(courseFilter)) {
            show = false;
        }
        
        // Date filter
        if (dateFilter) {
            const fileDate = new Date(item.querySelector('.file-meta').textContent.split(' • ')[1]);
            const filterDate = new Date(dateFilter);
            if (fileDate < filterDate) {
                show = false;
            }
        }
        
        item.closest('.col-md-3').style.display = show ? 'block' : 'none';
    });
}

// View Toggle Functionality
function initializeViewToggle() {
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    const fileContainer = document.getElementById('file-container');
    
    if (gridBtn && listBtn && fileContainer) {
        gridBtn.addEventListener('click', () => {
            fileContainer.className = 'row';
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        });
        
        listBtn.addEventListener('click', () => {
            fileContainer.className = 'list-view';
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        });
    }
}

// Modal Functionality
function initializeModals() {
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.classList.contains('alert-dismissible')) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    });
}

// Initialize tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize progress bars
function initializeProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar[data-animate="true"]');
    progressBars.forEach(bar => {
        const width = bar.getAttribute('aria-valuenow');
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width + '%';
        }, 500);
    });
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

// Export to Moodle
function exportToMoodle() {
    const courseSelect = document.getElementById('courseSelect');
    const sectionSelect = document.getElementById('sectionSelect');
    const selectedFiles = getSelectedFiles();
    
    if (!courseSelect.value) {
        showAlert('Please select a course', 'warning');
        return;
    }
    
    if (selectedFiles.length === 0) {
        showAlert('Please select at least one file to export', 'warning');
        return;
    }
    
    // Show export progress
    showExportProgress(selectedFiles.length);
    
    // Simulate export process
    setTimeout(() => {
        addToExportHistory(selectedFiles, courseSelect.value, sectionSelect.value);
        showAlert('Files exported successfully to Moodle', 'success');
        hideExportProgress();
    }, 3000);
}

// Get selected files
function getSelectedFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Show export progress
function showExportProgress(fileCount) {
    const progressModal = new bootstrap.Modal(document.getElementById('exportProgressModal'));
    document.getElementById('exportProgressText').textContent = `Exporting ${fileCount} file(s) to Moodle...`;
    progressModal.show();
}

// Hide export progress
function hideExportProgress() {
    const progressModal = bootstrap.Modal.getInstance(document.getElementById('exportProgressModal'));
    if (progressModal) {
        progressModal.hide();
    }
}

// Add to export history
function addToExportHistory(files, course, section) {
    const historyTable = document.getElementById('exportHistoryTable');
    if (!historyTable) return;
    
    const tbody = historyTable.querySelector('tbody');
    files.forEach(file => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${file}</td>
            <td>${course}</td>
            <td>${section}</td>
            <td>${new Date().toLocaleString()}</td>
            <td><span class="status-badge status-success">Completed</span></td>
        `;
        tbody.insertBefore(row, tbody.firstChild);
    });
}

// Search courses
function searchCourses() {
    const searchInput = document.getElementById('courseSearch');
    const courseSelect = document.getElementById('courseSelect');
    
    if (!searchInput || !courseSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const options = courseSelect.querySelectorAll('option');
    
    options.forEach(option => {
        if (option.value === '') return;
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Select all files
function selectAllFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    const selectAllBtn = document.getElementById('selectAllBtn');
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('fileTypeFilter').value = '';
    document.getElementById('courseFilter').value = '';
    document.getElementById('dateFilter').value = '';
    
    applyFilters();
}

// Save metadata
function saveMetadata() {
    const form = document.getElementById('metadataForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'course'];
    let isValid = true;
    
    requiredFields.forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    if (!isValid) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    // Simulate save
    showAlert('Metadata saved successfully', 'success');
    
    // Reset form
    form.reset();
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Dashboard statistics
function updateDashboardStats() {
    // This would typically fetch data from an API
    const stats = {
        totalDocuments: 156,
        storageUsed: '2.3 GB',
        exportedDocuments: 89
    };
    
    document.getElementById('totalDocuments').textContent = stats.totalDocuments;
    document.getElementById('storageUsed').textContent = stats.storageUsed;
    document.getElementById('exportedDocuments').textContent = stats.exportedDocuments;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('dashboard-page')) {
        updateDashboardStats();
    }
});

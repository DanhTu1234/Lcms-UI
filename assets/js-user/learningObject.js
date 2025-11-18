document.addEventListener("DOMContentLoaded", function () {
    const folderTree  = document.querySelector(".folder-tree");
    const folderNameInput = document.getElementById("folderName");
    const createFolderBtn  = document.getElementById("createFolderBtn");
    const createFolderModal = new bootstrap.Modal(document.getElementById("createFolderModal"));
    const uploadVersionModal = new bootstrap.Modal(document.getElementById("uploadVersionModal"));
    const versionBtn = document.querySelector(".btnVersion");
    const uploadBtn = document.getElementById("uploadBtn");
    const uploadModal = new bootstrap.Modal(document.getElementById("uploadModal"));
    const uploadForm = document.getElementById("uploadForm");
    let currentFolderId = null; // Lưu ID thư mục đang chọn

    async function loadFolders() {
      try {
        const res = await axios.get("http://localhost:8080/SpringMVC-study/api/folders");
        renderFolderTree(res.data);
      } catch (error) {
        showAlert("Không thể tải thư mục!", "danger");
        console.error(error);
      }
    }    

    function renderFolderTree(data) {
      folderTree.innerHTML = `
        <ul>
          <li class="root-folder expanded selected" data-id="root">
            <button class="folder-btn fw-bold">
              <i class="bi bi-folder2-open toggle-icon"></i>
              <span class="folder-name">Thư mục của tôi</span>
            </button>
            <div class="children">${buildFolderHTML(data)}</div>
          </li>
        </ul>
      `;
    }

    function buildFolderHTML(folders) {
      if (!folders || folders.length === 0) return "";
      let html = "<ul>";
      for (const f of folders) {
        const hasChildren = f.children && f.children.length > 0;
        html += `
          <li data-id="${f.id}" class="${hasChildren ? "expanded" : ""}">
            <button class="folder-btn">
              <i class="bi ${hasChildren ? "bi-folder2-open" : "bi-folder2"} toggle-icon"></i>
              <span class="folder-name">${f.name}</span>
            </button>
            ${hasChildren ? `<div class="children">${buildFolderHTML(f.children)}</div>` : ""}
          </li>`;
      }
      html += "</ul>";
      return html;
    }

    // Xử lý click trên cây thư mục
    folderTree.addEventListener("click", function (e) {
      const folderBtn = e.target.closest(".folder-btn");
      if (!folderBtn) return;

      const targetLi = folderBtn.closest("li");

      // Bỏ chọn tất cả
      folderTree.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
      targetLi.classList.add("selected");

      // Mở/đóng thư mục
      toggleFolder(targetLi);

      const folderId = targetLi.dataset.id;
      if (folderId && folderId !== "root") {
        currentFolderId = folderId; // Lưu thư mục đang chọn
        loadLearningObjects(folderId);
      }
    });

    function toggleFolder(li) {
      const icon = li.querySelector(".toggle-icon");
      const children = li.querySelector(".children");
      if (!children) return;

      const isCollapsed = li.classList.toggle("collapsed");

      // Ẩn/hiện thư mục con
      children.style.display = isCollapsed ? "none" : "block";

      // Đổi icon
      if (icon) {
        icon.classList.toggle("bi-folder2-open", !isCollapsed);
        icon.classList.toggle("bi-folder2", isCollapsed);
      }
    }
    
    //Mở modal tạo thư mục
    createFolderBtn.addEventListener("click", function () {
      folderNameInput.value = "";
      createFolderModal.show();
    });  

    // Xử lý post tạo thư mục mới
    const createBtn = document.querySelector("#createFolderModal .btn-primary");
    createBtn.addEventListener("click", async function () {
      const name = folderNameInput.value.trim();
      if (!name) {
        folderNameInput.classList.add("is-invalid");
        return;
      }
      folderNameInput.classList.remove("is-invalid");

      // Lấy thư mục cha hiện được chọn
      const selectedFolder = document.querySelector(".folder-tree .selected");
      const parentId = selectedFolder && selectedFolder.dataset.id !== "root" ? Number(selectedFolder.dataset.id) : null;

      try {
        await axios.post("http://localhost:8080/SpringMVC-study/api/folders", {
          name: name,
          parentId: parentId,
        });

        createFolderModal.hide();
        loadFolders();
      } catch (error) {
        console.error("Lỗi khi tạo thư mục:", error);
        showAlert("Không thể tải thư mục!", "danger");
      }
    });  

    async function loadLearningObjects(folderId) {
      const tableBody = document.querySelector("#learningObjects tbody");
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">
        <div class="spinner-border text-primary me-2" role="status"></div>Đang tải...
      </td></tr>`;

      try {
        const res = await axios.get(`http://localhost:8080/SpringMVC-study/api/folders/learningObjects/${folderId}`);
        renderLearningObjects(res.data);
      } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-danger">Không thể tải learning objects.</td></tr>`;
      }
    }

    function renderLearningObjects(objects) {
      const tableBody = document.querySelector("#learningObjects tbody");

      if (!objects || objects.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Không có Learning Object nào trong thư mục này.</td></tr>`;
        return;
      }

      let html = "";
      for (const lo of objects) {
        html += `
          <tr>
            <td>
              <button class="btn btn-sm btn-outline-secondary toggle-btn me-2" data-id="${lo.id}">
                <i class="bi bi-chevron-down"></i>
              </button>
              <i class="bi bi-file-earmark-text me-2 text-primary me-2"></i>
              ${lo.title}
            </td>
            <td><span class="badge bg-success">${lo.loVersion.version_number}</span></td>
            <td>${new Date(lo.updatedAt).toLocaleDateString()}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary btnVersion">
                <i class="bi bi-plus-circle"></i> Upload phiên bản mới
              </button>
            </td>
          </tr>

          <tr id="versionRow-${lo.id}" class="version-row" style="display:none;">
            <td colspan="4" id="versions-container-${lo.id}">
              <div class="text-center text-muted py-2">Nhấn để tải danh sách phiên bản...</div>
            </td>
          </tr>
        `;
      }

      tableBody.innerHTML = html;
    }

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".toggle-btn");
      if (!btn) return;
      const loId = btn.dataset.id;
      toggleVersions(loId);
    });

    async function toggleVersions(loId) {
      const row = document.getElementById(`versionRow-${loId}`);
      const container = document.getElementById(`versions-container-${loId}`);
      const isVisible = row.style.display === "table-row";

      // Ẩn/hiện hàng
      row.style.display = isVisible ? "none" : "table-row";
      if (isVisible) return;

      // Gọi API lấy danh sách version
      container.innerHTML = `<div class="text-center text-muted">Đang tải danh sách phiên bản...</div>`;

      try {
        const res = await axios.get(`http://localhost:8080/SpringMVC-study/api/learningObjects/${loId}`);
        renderVersions(loId, res.data);
      } catch (error) {
        console.error("Lỗi khi tải phiên bản:", error);
        container.innerHTML = `<div class="text-danger text-center">Không thể tải danh sách phiên bản.</div>`;
      }
    }

    function renderVersions(loId, versions) {
      const container = document.getElementById(`versions-container-${loId}`);

      if (!versions || versions.length === 0) {
        container.innerHTML = `<div class="text-center text-muted">Chưa có phiên bản nào.</div>`;
        return;
      }

      let html = `
        <table class="table table-sm align-middle mb-0">
          <thead class="table-secondary">
            <tr>
              <th>Phiên bản</th>
              <th>Tên tài liệu</th>
              <th>Kích thước</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const v of versions) {
        html += `
          <tr>
            <td>${v.version_number}</td>
            <td><a href="#">${v.file_name}</a></td>
            <td>${v.file_size_bytes}MB</td>
            <td>${new Date(v.createdAt).toLocaleDateString()}</td>
            <td>
              <span class="badge bg-${v.status === "active" ? "success" : "secondary"}">${v.status==="active" ? "Đang sử dụng" : "Lưu trữ"}</span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-info me-1 btnPreview" title="Xem nội dung" data-filename="${v.file_name}">
                <i class="bi bi-eye"></i>
              </button>

              <!-- Nút tải xuống -->
              <button class="btn btn-sm btn-outline-primary me-1 btnDownload" title="Tải xuống" data-filename="${v.file_name}">
                <i class="bi bi-download"></i>
              </button>
              ${
                v.status === "active"
                  ? `<button class='btn btn-sm btn-outline-secondary disabled' title='Đang sử dụng'><i class="bi bi-check2-circle"></i></button>`
                  : `
                    <button class="btn btn-sm btn-outline-success" title="Kích hoạt phiên bản này"><i class="bi bi-check2-circle"></i></button>
                    <button class="btn btn-sm btn-outline-danger" title="Xóa phiên bản"><i class="bi bi-trash"></i></button>
                  `
              }
            </td>
          </tr>
        `;
      }

      html += `</tbody></table>`;
      container.innerHTML = html;
    }

    uploadBtn.addEventListener("click", function () {
      uploadModal.show();
    });

    // Xử lý khi nhấn nút "Upload File" trong modal
    document.getElementById("uploadFileBtn").addEventListener("click", uploadFile);

    // Xử lý sự kiện upload
    async function uploadFile() {
      const loTitle = document.getElementById("loTitle");
      const loVersion = document.getElementById("loVersion");
      const loDescription = document.getElementById("loDescription");
      const fileInput = document.getElementById("fileInput");

      if (!loTitle.value || !loVersion.value || !fileInput.files.length) {
        showAlert("Vui lòng nhập đầy đủ thông tin và chọn file!", "danger");
        return;
      }

      const formData = new FormData();
      formData.append("title", loTitle.value);
      formData.append("version", loVersion.value);
      formData.append("description", loDescription.value);
      formData.append("file", fileInput.files[0]);
      formData.append("folderId", currentFolderId);

      try {
        const res = await axios.post(
          "http://localhost:8080/SpringMVC-study/api/learning-objects/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        showAlert("Tải lên thành công!", "success");
        uploadModal.hide();
        document.getElementById("uploadForm").reset();
        loadLearningObjects(currentFolderId);
      } catch (error) {
        console.error("Lỗi upload:", error);
        showAlert("Không thể tải file lên. Vui lòng thử lại!", "danger");
      }
    }

    // Mở modal upload version mới
    function openUploadVersionModal(loId) {
      document.getElementById("learningObjectId").value = loId;
      document.getElementById("uploadVersionForm").reset();
      const uploadVersionModal = new bootstrap.Modal(document.getElementById("uploadVersionModal"));
      uploadVersionModal.show();
    }

    // Lắng nghe click vào nút "New Version"
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".btnVersion");
      if (btn) {
        const loId = btn.closest("tr").querySelector(".toggle-btn").dataset.id;
        openUploadVersionModal(loId);
      }
    });

    // Xử lý upload version mới
    document.getElementById("uploadVersionForm").addEventListener("submit", async function (e) {
      e.preventDefault();

      const loId = document.getElementById("learningObjectId").value;
      const version = document.getElementById("version").value.trim();
      const fileInput = document.getElementById("file");

      if (!version || !fileInput.files.length) {
        showAlert("Vui lòng nhập phiên bản và chọn tệp!", "danger");
        return;
      }

      const formData = new FormData();
      formData.append("version", version);
      formData.append("file", fileInput.files[0]);

      try {
        const res = await axios.post(
          `http://localhost:8080/SpringMVC-study/api/learning-objects/uploadVersion/${loId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        showAlert("Tải lên phiên bản mới thành công!", "success");
        const modal = bootstrap.Modal.getInstance(document.getElementById("uploadVersionModal"));
        modal.hide();

        // Reset form
        document.getElementById("uploadVersionForm").reset();

        // Cập nhật lại danh sách phiên bản
        toggleVersions(loId); 
        toggleVersions(loId); 
      } catch (error) {
        console.error("Lỗi upload version:", error);
        showAlert("Không thể tải lên phiên bản mới!", "danger");
      }
    });

    document.addEventListener("click", function(e) {
      const previewBtn = e.target.closest(".btnPreview");
      const downloadBtn = e.target.closest(".btnDownload");

      if (previewBtn) {
        previewFile(previewBtn.dataset.filename);
      } else if (downloadBtn) {
        downloadFile(downloadBtn.dataset.filename);
      }
    });

    //Hàm xem trước file
    async function previewFile(fileName) {
        try {
            const res = await axios.get(`http://localhost:8080/SpringMVC-study/api/learning-objects/preview/${fileName}`);
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
            const res = await axios.get(`http://localhost:8080/SpringMVC-study/api/learning-objects/download/${fileName}`);
            window.location.href = res.data;
        } catch (error) {
            console.error(error);
            showAlert("Không thể tạo link tải file", "danger");
        }
    }

    loadFolders();

});

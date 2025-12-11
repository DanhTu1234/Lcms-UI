window.onload = initKeycloak;

const keycloak = new Keycloak({
    url: "http://localhost:8080",
    realm: "demo-realm",
    clientId: "Lcms_client"
});

// Khởi chạy
function initKeycloak() {
    keycloak.init({ 
        onLoad: "login-required"
    }).then(authenticated => {
        if (authenticated) {
            setupAxiosInterceptors();
            syncUserToBackend().then(() => {
                loadUserProfile();
                document.dispatchEvent(new Event("kc-ready"));
            });
            
        }
    }).catch(err => console.error(err));
}

function setupAxiosInterceptors() {
    axios.interceptors.request.use(async config => {
        // Kiểm tra token, nếu còn dưới 30s thì refresh
        if (keycloak.token) {
            try {
                await keycloak.updateToken(30); 
                config.headers.Authorization = `Bearer ${keycloak.token}`;
            } catch (error) {
                console.error(error);
                keycloak.logout({
                    redirectUri: window.location.origin + "/user/index.html"
                });
            }
        }
        return config;
    }, error => {
        return Promise.reject(error);
    });
}

function syncUserToBackend() {
    return axios.post("http://localhost:8444/api/auth/sync-user", 
        {
            sub: keycloak.tokenParsed.sub,
            username: keycloak.tokenParsed.preferred_username,
            email: keycloak.tokenParsed.email,
            fullname: keycloak.tokenParsed.name
        })
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error(error);
        });
}

function loadUserProfile() {
    axios.get("http://localhost:8444/api/auth/me")
        .then(res => {
            const user = res.data;
            console.log(user);
            displayUserMenu(user);
        })
        .catch(err => console.error("Lỗi lấy user:", err));
}

function displayUserMenu(user) {
    const nameElement = document.getElementById("userFullname");
    if (nameElement) {
        nameElement.textContent = user.fullname || "Name";
    }
}

function logout() {
    keycloak.logout({
        redirectUri: window.location.origin + "/user/index.html"
    });
}
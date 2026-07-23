console.log("程式開始執行了。");

// 1. 導入 Firebase 模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBarB2bsX_71xnJ3lE27vnRaw7x3SJL5G0",
    authDomain: "eatnote666.firebaseapp.com",
    projectId: "eatnote666",
    storageBucket: "eatnote666.firebasestorage.app",
    messagingSenderId: "447349086123",
    appId: "1:447349086123:web:92e0de98fb4712fd8824ee"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 存放所有資料的陣列
let allRecords = [];
let currentEditId = null;

const userArea = document.getElementById("userArea");
const userDropdown = document.getElementById("userDropdown");
const logoutBtn = document.getElementById("logoutBtn");
const modal = document.getElementById("modal");
const loginBtn = document.getElementById("loginBtn");
const saveBtn = document.getElementById("saveBtn");
const addRecordBtn = document.getElementById("addRecordBtn");
const closeModal = document.getElementById("closeModal");
const listElement = document.getElementById('cardList');
const loginMessage = document.getElementById("loginMessage");

// 監聽登入狀態切換
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 已登入顯示頭像
        const initial = user.email ? user.email[0].toUpperCase() : 'U';
        userArea.innerHTML = `<div class="avatar" id="avatarBtn">${initial}</div>`;

        // 隱藏提示文字
        loginMessage.classList.add("hidden");

        // 顯示新增按鈕
        addRecordBtn.style.display = "block";

        // 綁定點及頭像顯示下拉選單
        document.getElementById("avatarBtn").addEventListener("click", () => {
           userDropdown.classList.toggle("hidden"); 
        });

        console.log("使用者已登入:", user.displayName);

        await fetchFoodRecords();
        
    } else {
        // 未登入顯示登入按鈕
        userArea.innerHTML = `<button id="loginBtn">登入</button>`;

        // 顯示提示文字
        loginMessage.classList.remove("hidden");

        // 隱藏新增按鈕
        addRecordBtn.style.display = "none";

        document.getElementById("loginBtn").addEventListener("click", () => {
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            signInWithPopup(auth, provider).catch(console.error);
        });

        userDropdown.classList.add("hidden");
        console.log("使用者已登出");
        allRecords = [];
        renderCards([]);
    }
});

// 登出功能
logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
        userDropdown.classList.add("hidden"); // 登出後關閉選單
        allRecords = [];
        renderCards([]);

    console.log("已手動登出並清空資料");
    }).catch((error) => {
        console.error("登出失敗:", error);
    });
});

// 讀取該使用者的所有食物紀錄
async function fetchFoodRecords() {
    const user = auth.currentUser;
    if (!user) return ;

    const q = query(collection(db, "users", user.uid, "foods"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    allRecords = [];
    querySnapshot.forEach((doc) => {
        allRecords.push({ id: doc.id, ...doc.data() });
    });
    renderCards(allRecords); // 初始渲染全部
}

// 渲染卡片的通用函式
function renderCards(dataArray) {
    listElement.innerHTML = "";
    
    dataArray.forEach((data) => {
        const card = document.createElement('div');
        card.className = 'card';

        const starDisplay = '★'.repeat(data.rating || 0) + '☆'.repeat(5 - (data.rating || 0));
        
        // 取得該類別對應的圖示
        const iconSvg = getCategoryIcon(data.foodType);

        card.innerHTML = `
            <div class="cardHeader">
                <span class="typeIcon">${iconSvg}</span>
                <h3>${data.foodName}</h3>
            </div>
            <p class="cardShop">${data.shopName}</p>
            <div class="cardRating">${starDisplay}</div>
            <p class="cardcomment">${data.comment}</p>
        `;

        // 點擊卡片觸發詳情視窗
        card.addEventListener('click', () => {
            showDetail(data);
        });

        listElement.appendChild(card);
    });
}

// 圖示對照表
function getCategoryIcon(type) {
    const icons = {
        '飲料': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cup-soda-icon lucide-cup-soda"><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></svg>',
        '飯': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bean-icon lucide-bean"><path d="M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z"/><path d="M5.341 10.62a4 4 0 1 0 5.279-5.28"/></svg>',
        '麵': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-soup-icon lucide-soup"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M19.5 12 22 6"/><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"/><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"/><path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62"/></svg>',
        '早餐': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sandwich-icon lucide-sandwich"><path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"/><path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"/><path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"/><path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"/><rect width="20" height="4" x="2" y="11" rx="1"/></svg>',
        '其他': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };
    return icons[type] || icons['其他'];
}

// 顯示詳細資料
function showDetail(data) {
    const detailModal = document.getElementById('detailModal');

    detailModal.innerHTML = `
        <div class="detailModalBox">
            <div class="modalHeader">
                <h2 id="detailTitle">詳細紀錄</h2>
                <div id="closeDetailModal" class="closeDetailBtn">✖</div>
            </div>
            <div class="detailScrollArea">
                <p><strong>店家：　</strong> ${data.shopName}</p>
                <p><strong>日期：　</strong> ${data.date}</p>
                <p><strong>類型：　</strong> ${data.foodType || '無'}</p>
                <p><strong>價格：　</strong> $ ${data.price || '0'}</p>
                <p><strong>評分：　</strong> ${'★'.repeat(data.rating || 0)}</p>
                <p class="commentDisplay"><strong>感想：</strong></p>
                <p >${data.comment || '無'}</p>
                ${data.url ? `<p class="urlDisplay"><strong>連結：</strong><br><a href="${data.url}" target="_blank" class="urlLink">${data.url}</a></p>` : ''}
            </div>
            <button id="editBtn" title="編輯紀錄">✎</button>
        </div>
    `;
    
    // 重新綁定關閉按鈕事件 (因為上面的 HTML 被重置了)
    document.getElementById("closeDetailModal").addEventListener("click", () => {
        detailModal.style.display = "none";
    });

    // 處理編輯按鈕綁定 
    document.getElementById("editBtn").addEventListener("click", () => {
        detailModal.style.display = "none";
        document.getElementById("modal").style.display = "block";
        
        currentEditId = data.id; 
        document.getElementById("date").value = data.date || "";
        document.getElementById("shopName").value = data.shopName || "";
        document.getElementById("foodName").value = data.foodName || "";
        document.getElementById("foodType").value = data.foodType || "";
        document.getElementById("price").value = data.price || "";
        document.getElementById("comment").value = data.comment || "";
        document.getElementById("url").value = data.url || "";

        document.querySelectorAll('input[name="rating"]').forEach(radio => radio.checked = false);
        if (data.rating) {
            const radioBtn = document.querySelector(`input[name="rating"][value="${data.rating}"]`);
            if (radioBtn) radioBtn.checked = true;
        }
    });
    
    detailModal.style.display = "block";
}

// 搜尋與篩選邏輯
function applyFilters() {
    const keyword = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    const filtered = allRecords.filter(item => {
        const matchKeyword = item.foodName.toLowerCase().includes(keyword) || item.shopName.toLowerCase().includes(keyword);
        const matchCategory = (category === "all") || (item.foodType === category);
        return matchKeyword && matchCategory;
    });
    renderCards(filtered);
}

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);

// 新增紀錄中的儲存按鈕
saveBtn.addEventListener("click", async () => {
    const selectedRating = document.querySelector('input[name="rating"]:checked');

    const record = {
        date: document.getElementById("date").value,
        shopName: document.getElementById("shopName").value,
        foodName: document.getElementById("foodName").value,
        foodType: document.getElementById("foodType").value,
        price: Number(document.getElementById("price").value),
        comment: document.getElementById("comment").value,
        rating: selectedRating ? Number(selectedRating.value) : 0,
        url: document.getElementById("url").value
    };

    // 簡單驗證
    if (!record.foodName || !record.shopName) {
        alert("請填寫必要的名稱欄位。");
        return;
    }

    if (currentEditId) {
        // 如果 currentEditId 有值，代表是「編輯模式」 -> 執行更新
        const docRef = doc(db, "users", auth.currentUser.uid, "foods", currentEditId);
        await updateDoc(docRef, record);
        alert("修改成功！");
    } else {
        // 如果沒有值，代表是「新增模式」 -> 執行新增
        await addDoc(collection(db, "users", auth.currentUser.uid, "foods"), { ...record, createdAt: new Date().toISOString() });
    }

    // 儲存後重置狀態與視窗
    currentEditId = null;
    modal.style.display = "none";

    // 清空表單欄位，避免下次打開還有舊資料
    document.querySelectorAll("input, textarea").forEach(input => { if(input.type !== "radio") input.value = ""; });
    
    fetchFoodRecords(); // 儲存後重新抓一次資料
});



// 打開新增紀錄視窗
addRecordBtn.addEventListener("click", () =>{
    currentEditId = null; // 強制重置 ID
    
    // 清空舊表單資料
    document.querySelectorAll("input, textarea").forEach(input => { if(input.type !== "radio") input.value = ""; });
    modal.style.display = "block";
});

// 關閉視窗
closeModal.addEventListener("click", () =>{
    modal.style.display = "none";
});

// 點擊背景也關閉視窗
window.addEventListener("click", (event) =>{
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
});

// 關閉詳細資料視窗
document.getElementById("closeDetailModal").addEventListener("click", () => {
    document.getElementById("detailModal").style.display = "none";
});

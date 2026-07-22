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

// 監聽登入狀態切換
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 已登入顯示頭像
        const initial = user.email ? user.email[0].toUpperCase() : 'U';
        userArea.innerHTML = `<div class="avatar" id="avatarBtn">${initial}</div>`;

        // 綁定點及頭像顯示下拉選單
        document.getElementById("avatarBtn").addEventListener("click", () => {
           userDropdown.classList.toggle("hidden"); 
        });

        console.log("使用者已登入:", user.displayName);

        await fetchFoodRecords();
        
    } else {
        // 未登入顯示登入按鈕
        userArea.innerHTML = `<button id="loginBtn">登入</button>`;

        document.getElementById("loginBtn").addEventListener("click", () => {
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            signInWithPopup(auth, provider).catch(console.error);
        });

        userDropdown.classList.add("hidden");
        console.log("使用者已登出");
        allRecords = [];
        renderFoodList([]);
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
    const listElement = document.getElementById('cardList');
    listElement.innerHTML = "";
    
    dataArray.forEach((data) => {
        const card = document.createElement('div');
        card.className = 'card';

        const starDisplay = '★'.repeat(data.rating || 0) + '☆'.repeat(5 - (data.rating || 0));
        
        card.innerHTML = `
            <h3>${data.foodName}</h3>
            <p class="cardFood">${data.shopName}</p>
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

// 顯示詳細資料
function showDetail(data) {
    const detailModal = document.getElementById('detailModal');

    detailModal.innerHTML = `
        <div class="detailModalBox">
            <div id="closeDetailModal" style="text-align: right; cursor: pointer; font-size: 20px;">✖</div>
            <div class="detailScrollArea">
                <p><strong>店家：</strong> ${data.shopName}</p>
                <p><strong>日期：</strong> ${data.date}</p>
                <p><strong>類型：</strong> ${data.foodType || '無'}</p>
                <p><strong>價格：</strong> $ ${data.price || '0'}</p>
                <p><strong>評分：</strong> ${'★'.repeat(data.rating || 0)}</p>
                <hr>
                <p><strong>心得感想：</strong></p>
                <p style="padding: 10px; border-radius: 5px;">${data.comment || '無心得'}</p>
                ${data.url ? `<p><strong>連結：</strong><br><a href="${data.url}" target="_blank" style="word-break: break-all; color: #561c24;">${data.url}</a></p>` : ''}
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



// 打開視窗
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
    if(event.target == modal){
        modal.style.display = "none";
    }
});

// 關閉詳細資料視窗
document.getElementById("closeDetailModal").addEventListener("click", () => {
    document.getElementById("detailModal").style.display = "none";
});

// 點擊背景關閉
window.addEventListener("click", (event) => {
    const detailModal = document.getElementById("detailModal");
    if (event.target == detailModal) {
        detailModal.style.display = "none";
    }
});

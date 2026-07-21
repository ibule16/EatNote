console.log("程式開始執行了。");

// 1. 導入 Firebase 模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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

const loginBtn = document.getElementById("loginBtn");
const saveBtn = document.getElementById("saveBtn");

// Firebase 功能函式
// 儲存單筆食物資料到該使用者的子集合 "foods"
async function saveFoodRecord(record) {
    const user = auth.currentUser;
    if (!user) {
        alert("請先登入才能儲存。");
        return;
    }

    try {
        // 在 users 底下該用戶的 foods 集合中新增一筆文件
        await addDoc(collection(db, "users", user.uid, "foods"), {
            ...record,
            createdAt: new Date().toISOString()
        });
        console.log("資料已成功儲存至 Firestore");
        alert("儲存成功。");
    } catch (e) {
        console.error("儲存失敗:", e);
        alert("儲存失敗，請檢查網路或權限。");
    }
}

// 讀取該使用者的所有食物紀錄
async function fetchFoodRecords() {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(collection(db, "users", user.uid, "foods"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const records = [];
    querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
    });
    return records;
}

// 登入按鈕
loginBtn.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) {
        // 如果已登入，點擊則執行登出
        signOut(auth).then(() => {
            console.log("已登出。");
        }).catch((error) => console.error("登出錯誤:", error));
    } else {
        // 如果未登入，使用 Popup 登入
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("登入成功:", result.user.displayName);
            })
            .catch((error) => {
                console.error("登入失敗:", error);
                alert("登入失敗，請確認瀏覽器是否允許彈出視窗。");
            });
    }
});

// 監聽登入狀態切換
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("使用者已登入:", user.displayName);
        loginBtn.textContent = "登出";
        fetchFoodRecords();
        renderFoodList();
    } else {
        console.log("使用者已登出");
        loginBtn.textContent = "使用 Google 登入";
        document.getElementById("foodList").innerHTML = "";
    }
});

// --------------------------------------------------------------

const date = document.getElementById("date");
const shopName = document.getElementById("shopName");
const foodName = document.getElementById("foodName");
const foodType = document.getElementById("foodType");
const price = document.getElementById("price");
const comment = document.getElementById("comment");
const rating = document.getElementById("rating");
const photo = document.getElementById("photo");
const url = document.getElementById("url");

// 儲存按鈕
saveBtn.addEventListener("click", async () => {
    const record = {
        date: document.getElementById("date").value,
        shopName: document.getElementById("shopName").value,
        foodName: document.getElementById("foodName").value,
        foodType: document.getElementById("foodType").value,
        price: Number(document.getElementById("price").value),
        comment: document.getElementById("comment").value,
        rating: Number(document.getElementById("rating").value),
        url: document.getElementById("url").value
    };

    // 簡單驗證
    if (!record.foodName || !record.shopName) {
        alert("請填寫必要的名稱欄位！");
        return;
    }

    await saveFoodRecord(record);
    modal.style.display = "none";
    renderFoodList();
});

// 讀取資料並渲染到畫面
async function renderFoodList(){
    const listElement = document.getElementById("foodList");
    const user = auth.currentUser;

    if(!user){
        listElement.innerHTML = "<p>請先登入以查看紀錄。</p>";
        return;
    }

    // 讀取該使用者的資料
    const querySnapshot = await getDocs(collection(db, "users", user.uid, "foods"));

    // 清空目前列表
    listElement.innerHTML = "";

    // 搜尋每一筆資料並加入畫面
    querySnapshot.forEach((doc) =>{
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "foodItem"; // CSS
        div.innerHTML = `
            <h3>${data.foodName} (${data.shopName})</h3>
            <p>日期：${data.date}</p>
            <p>價格：${data.price}元</p>
            <p>感想：${data.comment}</p>
            <p>評分：${data.rating}星</p>
            <hr>
        `
        listElement.appendChild(div);
    });
}

const modal = document.getElementById("modal");
const addRecordBtn = document.getElementById("addRecordBtn");
const closeModal = document.getElementById("closeModal");

// 打開視窗
addRecordBtn.addEventListener("click", () =>{
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

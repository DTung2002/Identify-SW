let currentStep = 0;

const steps = document.querySelectorAll(".step");
const contents = document.querySelectorAll(".step-content");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");

/* Hiển thị step */
function showStep(i) {
    contents.forEach(c => c.classList.remove("active"));
    steps.forEach(s => s.classList.remove("active"));

    contents[i].classList.add("active");
    steps[i].classList.add("active");

    btnBack.style.display = i === 0 ? "none" : "inline-block";
    btnNext.innerText = i === contents.length - 1 ? "Xác nhận" : "Tiếp theo";

    // if (i === 2) resizeCanvas(); // Step 3: canvas
}

/* Next / Back */
btnNext.onclick = () => {
    if (!validateStep(currentStep)) return;

    // Nếu Step 3 → Step 4, fill dữ liệu
    if (currentStep === 2) {
        fillReviewData();
    }

    if (currentStep === contents.length - 1) {
        submitForm();
    } else {
        currentStep++;
        showStep(currentStep);
    }
};

btnBack.onclick = () => {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
};

/* Preview image */
function previewImage(input, id) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const img = document.getElementById(id);
        img.src = e.target.result;
        img.style.display = "block";
    };
    reader.readAsDataURL(file);
}

/* Canvas chữ ký */
// const canvas = document.getElementById("signaturePad");
// const ctx = canvas.getContext("2d");
// let drawing = false;

// function resizeCanvas() {
//     canvas.width = canvas.offsetWidth;
//     canvas.height = canvas.offsetHeight;
// }

// canvas.addEventListener("mousedown", e => {
//     drawing = true;
//     ctx.beginPath();
//     ctx.moveTo(e.offsetX, e.offsetY);
// });

// canvas.addEventListener("mousemove", e => {
//     if (!drawing) return;
//     ctx.lineTo(e.offsetX, e.offsetY);
//     ctx.stroke();
// });

// canvas.addEventListener("mouseup", () => drawing = false);

// function clearSignature() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
// }


/* Fill dữ liệu vào Step 4 */
function fillReviewData() {
    // Step 2
    const name = document.getElementById("cccdName").value;
    const cccd = document.getElementById("cccdNumber").value;
    const address = document.getElementById("cccdAddress").value;

    document.getElementById("reviewName").value = name;
    document.getElementById("reviewCccd").value = cccd;
    document.getElementById("reviewAddress").value = address;

    // Step 3: chữ ký
    const signImg = document.getElementById("imgSign");
    const reviewSign = document.getElementById("reviewSign");

    if (signImg && signImg.src && signImg.src !== "") {
        reviewSign.src = signImg.src;
        reviewSign.style.display = "block";
    } else {
        reviewSign.style.display = "none";
    }
}

/* Submit form */
function submitForm() {
    const form = document.getElementById("multiForm");
    const data = new FormData(form);

    // Chuyển FormData sang JSON
    const jsonData = Object.fromEntries(data.entries());

    // Gửi dữ liệu lên server
    fetch("/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData)
    })
    .then(res => res.json())
    .then(resData => {
        console.log("Server trả về:", resData);
        alert("Gửi thành công!");
        // Reset form hoặc quay về step đầu nếu muốn
        form.reset();
        window.location.href = "success.html"; // chuyển sang trang success
        currentStep = 0;
        showStep(currentStep);
    })
    .catch(err => {
        console.error("Lỗi gửi dữ liệu:", err);
        alert("Xác thực thất bại!");
    });
}

function validateStep(stepIndex) {
    const step = document.querySelectorAll(".step-content")[stepIndex];

    // ===== STEP 3: chữ ký hoặc ảnh =====
    if (stepIndex === 2) {
        const fileInput = document.getElementById("signImage");
        const errorBox = document.querySelector(".signature-error");

        errorBox.innerText = "";

        if (!fileInput || fileInput.files.length === 0) {
            errorBox.innerText = "Vui lòng tải ảnh chữ ký!";
            return false;
        }

        return true;
    }

    // ===== Các step khác =====
    const inputs = step.querySelectorAll("input");

    for (let input of inputs) {
        input.classList.remove("input-error");

        const oldError = input.parentElement.querySelector(".error-text");
        if (oldError) oldError.remove();

        const value = input.value.trim();

        // ❌ rỗng
        if (!value) {
            showError(input, "Vui lòng nhập thông tin");
            return false;
        }

        // 📞 Phone
        if (input.id === "phone") {
            const phoneRegex = /^0\d{9,10}$/;
            if (!phoneRegex.test(value)) {
                showError(input, "Số điện thoại không hợp lệ (10–11 số)");
                return false;
            }
        }

        // 🪪 CCCD
        if (input.id === "cccdNumber") {
            const cccdRegex = /^\d{12}$/;
            if (!cccdRegex.test(value)) {
                showError(input, "CCCD phải đủ 12 số");
                return false;
            }
        }
    }

    return true;
}

function showError(input, message) {
    input.classList.add("input-error");

    const oldError = input.parentElement.querySelector(".error-text");
    if (oldError) oldError.remove();

    const error = document.createElement("div");
    error.className = "error-text";
    error.innerText = message;

    input.parentElement.appendChild(error);
}
// File: public/script.js
const cccdFrontInput = document.getElementById("cccdFront");

cccdFrontInput.addEventListener("change", async () => {
    const file = cccdFrontInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
        // Gửi ảnh lên Server của bạn (chạy ở port 3000)
        const res = await fetch("/ocr/cccd", {
            method: "POST",
            body: formData
        });

        const result = await res.json();

        if (!result.success) {
            alert("Không đọc được CCCD");
            return;
        }

        const data = result.data;

        // Tự động điền vào các ô input trong file index.html
        document.getElementById("cccdName").value = data.hoTen || "";
        document.getElementById("cccdNumber").value = data.soCCCD || "";
        document.getElementById("cccdAddress").value = data.diaChi || "";

        if (data.ngayCap) {
            // Chuyển định dạng ngày nếu cần (VD: 20/10/2023 -> 2023-10-20)
            const parts = data.ngayCap.split("/");
            if(parts.length === 3) {
                document.getElementById("cccdDate").value = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        console.log("OCR thành công:", data);
    } catch (err) {
        console.error(err);
        alert("Lỗi khi kết nối tới Server");
    }
});
showStep(0);
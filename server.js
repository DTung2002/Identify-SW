const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

const uri = "mongodb+srv://thanhan:Vothanhan@cluster0.nsityfg.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const FormSchema = new mongoose.Schema({
    name: String,
    cccdNumber: String,
    address: String,
    email: String,
    phone: String
}, { timestamps: true });

const Form = mongoose.model('Form', FormSchema);

// --- ĐOẠN CODE ĐÃ SỬA ---
app.post('/ocr/cccd', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Chưa có ảnh" });

        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path));

        console.log("🚀 Đang gửi sang FPT.AI (v2)...");

        // QUAN TRỌNG: URL phải có thêm "/extract" ở cuối
        const fptResponse = await axios.post('https://api.fpt.ai/vision/idr/vnm', formData, {
            headers: {
                ...formData.getHeaders(),
                'api-key': 'jcUPrsaYoCHl4xk84Oj0SpRJ8nRmIi1u'
            },
    timeout: 10000 // Chờ tối đa 10 giây
        });

        // Xóa file sau khi gửi thành công
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (fptResponse.data && fptResponse.data.data && fptResponse.data.data.length > 0) {
            const result = fptResponse.data.data[0];
            console.log("✅ Nhận diện thành công:", result.name);

            res.json({
                success: true,
                data: {
                    hoTen: result.name || "",
                    soCCCD: result.id || "",
                    diaChi: result.address || "",
                    ngayCap: result.issue_date || ""
                }
            });
        } else {
            res.json({ success: false, message: "AI không tìm thấy thông tin trên thẻ." });
        }
    } catch (err) {
        // Xóa file nếu có lỗi xảy ra
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        // In chi tiết lỗi để kiểm tra
        const errorDetail = err.response ? err.response.data : err.message;
        console.error("❌ Lỗi API chi tiết:", errorDetail);
        
        res.status(500).json({ 
            success: false, 
            message: "Lỗi kết nối AI",
            detail: errorDetail 
        });
    }
});

app.post('/submit', async (req, res) => {
    try {
        const formData = new Form(req.body);
        await formData.save();
        res.json({ status: 'success', message: 'Dữ liệu đã được lưu thành công!' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
});
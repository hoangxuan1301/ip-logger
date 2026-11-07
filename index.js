const express = require('express');
const app = express();

app.get('/t/:id', (req, res) => {
  // Lấy IP thật (Render dùng proxy nên phải lấy qua x-forwarded-for)
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0].trim();

  console.log("=========================================");
  console.log("🔥 CÓ NGƯỜI BẤM LINK!");
  console.log("Mã ID: " + req.params.id);
  console.log("Địa chỉ IP: " + ip);
  console.log("=========================================");

  // Chuyển hướng sang Google
  res.redirect(302, 'https://google.com');
});

// Render sẽ tự cấp cổng qua biến môi trường PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server đang chạy trên cổng " + port);
});
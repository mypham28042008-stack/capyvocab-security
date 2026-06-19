# 🛡️ Capyvocab Security System

Hệ thống phát hiện đăng nhập bất thường với 7 tầng phòng thủ và mã hóa định danh RSA-AES.

---

## 🎯 Giới thiệu

Hệ thống bảo mật đa tầng cho nền tảng học tiếng Anh Capyvocab, tích hợp 7 tầng phòng thủ và mã hóa RSA-AES để bảo vệ dữ liệu người dùng.

---

## ⚡ Tính năng chính

- **7 tầng phòng thủ**: Rate Limit, HTTPS Enforcer, WebShell Blocker, OTP, Session Binding, Auth Bypass Detector, Insider Guard
- **Mã hóa RSA-AES**: Bảo vệ dữ liệu định danh khi lưu trữ
- **Real-time Dashboard**: Giám sát sự kiện bảo mật theo thời gian thực
- **Email Simulator**: Nhận OTP giả lập
- **Attack Testing**: 8 kịch bản tấn công tự động

---

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi tạo database
```bash
npm run init-db
```

### 3. Chạy chương trình (3 terminal)

**Terminal 1 - Main Server (Port 3000):**
```bash
npm start
```

**Terminal 2 - Dashboard (Port 3001):**
```bash
npm run dashboard
```

**Terminal 3 - Email Simulator (Port 3002):**
```bash
npm run email-simulator
```

---

## 🔑 Tài khoản đăng nhập

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `user1` | `password123` | User |
| `user2` | `password123` | User |

---

## 🌐 Các Web Service

| Web | Port | URL | Mục đích |
|-----|------|-----|----------|
| **Login** | 3000 | http://localhost:3000 | Đăng nhập |
| **Dashboard** | 3001 | http://localhost:3001 | Giám sát + Admin |
| **Email Simulator** | 3002 | http://localhost:3002 | Nhận OTP |

---

## 🧪 Kiểm thử tấn công

### Chạy từ Dashboard
1. Mở http://localhost:3001
2. Tab **"Attack Testing"** → Click **"🚀 Chạy tất cả"**

### Chạy từ terminal
```bash
npm run test:attacks
```

### Chạy Mock (8/8 PASS)
```bash
USE_MOCK=true npm start
```

---

## 📝 Các lệnh npm

| Lệnh | Mô tả |
|------|-------|
| `npm start` | Main Server (3000) |
| `npm run dashboard` | Dashboard (3001) |
| `npm run email-simulator` | Email Simulator (3002) |
| `npm run init-db` | Khởi tạo database |
| `npm run reset-db` | Reset database |
| `npm run test:attacks` | Kiểm thử tấn công |

---

## 👨‍💻 Tác giả

**Phạm Thị Trà My** - MSSV: 20227135 - Khoa Toán - Tin  

// Định nghĩa hàm để lấy APP_ID từ URL
function extractAppIdFromUrl(url) {
    const regex = /\/join\/([^\/]+)/; // Biểu thức chính quy để lấy phần cuối cùng của đường dẫn

    const match = url.match(regex); // Sử dụng phương thức match để lấy kết quả khớp với biểu thức chính quy

    if (match) {
        return match[1]; // Trả về phần tử khớp thứ nhất từ kết quả match, đó là APP_ID
    } else {
        return null; // Trả về null nếu không tìm thấy APP_ID trong URL
    }
}

// URL ví dụ cần trích xuất APP_ID
const testflightUrl = "https://testflight.apple.com/join/C1a3MRG4";

// Sử dụng hàm để lấy APP_ID từ URL
const APP_ID = extractAppIdFromUrl(testflightUrl);

// Kiểm tra và log ra kết quả
if (APP_ID) {
    console.log("Extracted APP_ID:", APP_ID);
} else {
    console.log("Không tìm thấy APP_ID trong URL.");
}

// Các dòng mã khác trong script testflight.js có thể ở đây...
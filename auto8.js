async function autoPost(ID, ids) {
    let Key = $persistentStore.read('key');
    let testurl = `https://testflight.apple.com/v3/accounts/${Key}/ru/`;
    let header = {
        'X-Session-Id': $persistentStore.read('session_id'),
        'X-Session-Digest': $persistentStore.read('session_digest'),
        'X-Request-Id': $persistentStore.read('request_id')
    };

    // In ra thông tin debug
    console.log(`autoPost: ID=${ID}, testurl=${testurl}, header=${JSON.stringify(header)}`);

    return new Promise(resolve => {
        $httpClient.get({url: testurl + ID, headers: header}, (error, response, data) => {
            if (error) {
                console.log(`${ID} Mất kết nối: ${error}，đã lưu APP_ID`);
                resolve();
                return;
            }

            if (response.status === 500) {
                console.log(`${ID} Lỗi máy chủ，Mã lỗi 500，đã lưu APP_ID`);
                resolve();
                return;
            }

            if (response.status !== 200) {
                console.log(`${ID} Liên kết không hợp lệ: Mã lỗi ${response.status}，Giữ nguyên APP_ID`);
                resolve();
                return;
            }

            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch (parseError) {
                console.log(`${ID} Phản hồi không thành công: ${parseError}，đã lưu APP_ID`);
                resolve();
                return;
            }

            if (!jsonData || !jsonData.data) {
                console.log(`${ID} Không nhận người mới，đã lưu APP_ID`);
                resolve();
                return;
            }

            if (jsonData.data.status === 'FULL') {
                console.log(`${ID} Bản beta đầy，đã lưu APP_ID`);
                resolve();
                return;
            }

            // Chỉ in ra thông tin debug mà không tham gia beta
            console.log(`${ID} Có chỗ trống trong beta`);
            resolve();
        });
    });
}
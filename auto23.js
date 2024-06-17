async function autoPost(ID, ids) {
    let Key = $persistentStore.read('key');
    let testurl = `https://testflight.apple.com/v3/accounts/${Key}/ru/`;
    let header = {
        'X-Session-Id': $persistentStore.read('session_id'),
        'X-Session-Digest': $persistentStore.read('session_digest'),
        'X-Request-Id': $persistentStore.read('request_id')
    };



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
               $notification.post('Liên kết không hợp lệ', '', `${ID} Không bị xóa`);
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

            $httpClient.post({url: testurl + ID + '/accept', headers: header}, (error, response, body) => {
                if (!error && response.status === 200) {
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(body);
                    } catch (parseError) {
                        console.log(`${ID} Tham gia không thành công: ${parseError}，đã lưu APP_ID`);
                        resolve();
                        return;
                    }

                    console.log(`${jsonBody.data.name} Tham gia Beta thành công`);
                    ids.splice(ids.indexOf(ID), 1);
                    $persistentStore.write(ids.join(','), 'APP_ID');
                    if (ids.length > 0) {
                        $notification.post(jsonBody.data.name + ' Tham gia Beta thành công', '', `Tiếp tục thực hiện APP ID：${ids.join(',')}`);
                    } else {
                        $notification.post(jsonBody.data.name + ' Tham gia Beta thành công', '', 'Tất cả APP ID đã được xử lý');
                    }
                } else {
                    console.log(`${ID} Tham gia thất bại: ${error || `Mã lỗi ${response.status}`}，đã lưu APP_ID`);
                }
                resolve();
            });
        });
    });
}
if (typeof $request !== 'undefined' && $request) {
    let url = $request.url;
    let keyPattern = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*?)\/apps/;
    let key = url.match(keyPattern) ? url.match(keyPattern)[1] : null;

    if (/^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/apps$/.test(url) && key) {
        let headers = Object.fromEntries(Object.entries($request.headers).map(([key, value]) => [key.toLowerCase(), value]));
        let session_id = headers['x-session-id'];
        let session_digest = headers['x-session-digest'];
        let request_id = headers['x-request-id'];

        $persistentStore.write(session_id, 'session_id');
        $persistentStore.write(session_digest, 'session_digest');
        $persistentStore.write(request_id, 'request_id');
        $persistentStore.write(key, 'key');

        $notification.post('Thu thập thông tin thành công 🎉', '', 'Vui lòng chỉnh sửa các tham số để tắt tập lệnh sau khi lấy APP_ID');
        console.log(`Thu thập thông tin thành công: session_id=${session_id}, session_digest=${session_digest}, request_id=${request_id}, key=${key}`);
    } else if (/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/.test(url)) {
        const appIdMatch = url.match(/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/);
        if (appIdMatch && appIdMatch[1]) {
            let appId = appIdMatch[1];
            let existingAppIds = $persistentStore.read('APP_ID');
            let appIdSet = new Set(existingAppIds ? existingAppIds.split(',') : []);
            if (!appIdSet.has(appId)) {
                appIdSet.add(appId);
                $persistentStore.write(Array.from(appIdSet).join(','), 'APP_ID');
                $notification.post('Tìm thấy APP_ID', '', `Đã lưu APP_ID: ${appId}`);
                console.log(`Đã lưu APP_ID: ${appId}`);
            } else {
                $notification.post('APP_ID Lặp lại', '', `APP_ID: ${appId} APP_ID đã tồn tại，Không cần thêm lại.`);
                console.log(`APP_ID: ${appId} APP_ID đã tồn tại，Không cần thêm lại.`);
            }
        } else {
            console.log('TestFlight không hợp lệ, không có APP_ID');
        }
    }

    $done({});
} else {
    (async () => {
        let ids = $persistentStore.read('APP_ID');
        if (!ids) {
            console.log('Không thấy APP_ID');
            $done();
        } else {
            ids = ids.split(',');
            for await (const ID of ids) {
                await checkSlot(ID);
            }
            $done();
        }
    })();
}

async function checkSlot(ID) {
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
                console.log(`${ID} Mất kết nối: ${error}`);
                resolve();
                return;
            }

            if (response.status === 500) {
                console.log(`${ID} Lỗi máy chủ，Mã lỗi 500`);
                resolve();
                return;
            }
            
            if (response.status !== 200) {
                console.log(`${ID} Liên kết không hợp lệ: Mã lỗi ${response.status}`);
                $notification.post('Liên kết không hợp lệ', '', `${ID} Không bị xóa`);
                resolve();
                return;
            }

            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch (parseError) {
                console.log(`${ID} Phản hồi không thành công: ${parseError}`);
                resolve();
                return;
            }

            if (!jsonData || !jsonData.data) {
                console.log(`${ID} Không nhận người mới`);
                resolve();
                return;
            }

            if (jsonData.data.status === 'FULL') {
                console.log(`${ID} Bản beta đầy`);
            } else {
                console.log(`${ID} Còn trống slot beta`);
                $notification.post('Còn trống slot beta', '', `APP ID: ${ID} còn slot trống.`);
            }
            resolve();
        });
    });
}
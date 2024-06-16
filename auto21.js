if (typeof $request !== 'undefined' && $request) {
    let url = $request.url;
    let keyPattern = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*?)\/apps/;
    let key = url.match(keyPattern) ? url.match(keyPattern)[1] : null;

    if (/^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/apps$/.test(url) && key) {
        $persistentStore.write(key, 'key');
        $notification.post('Thu thập thông tin thành công 🎉', '', 'Vui lòng chỉnh sửa các tham số để tắt tập lệnh sau khi lấy APP_ID');
        console.log(`Thu thập thông tin thành công: key=${key}`);
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
                $notification.post('APP_ID Lặp lại', '', `APP_ID: ${appId} đã tồn tại，Không cần thêm lại.`);
                console.log(`APP_ID: ${appId} đã tồn tại，Không cần thêm lại.`);
            }
        } else {
            console.log('TestFlight không hợp lệ, không có APP_ID');
        }
    }

    $done({});
} else {
    let appIds = $persistentStore.read('APP_ID');
    if (!appIds) {
        console.log('Không tìm thấy APP_ID');
        $done();
    } else {
        appIds = appIds.split(',');
        appIds.forEach(appId => {
            checkBetaSlot(appId);
        });
        $done();
    }
}

function checkBetaSlot(appId) {
    let key = $persistentStore.read('key');
    if (!key) {
        console.log('Không tìm thấy key');
        $notification.post('Lỗi', '', `Không tìm thấy key để thực hiện yêu cầu cho APP ID: ${appId}`);
        return;
    }

    let testUrl = `https://testflight.apple.com/v3/accounts/${key}/ru/${appId}`;

    $httpClient.get(testUrl, (error, response, data) => {
        if (error) {
            console.log(`${appId} Mất kết nối: ${error}`);
            $notification.post('Mất kết nối', '', `Không thể kết nối máy chủ cho APP ID: ${appId}`);
            return;
        }

        if (response.status !== 200) {
            console.log(`${appId} Liên kết không hợp lệ: Mã lỗi ${response.status}`);
            $notification.post('Liên kết không hợp lệ', '', `${appId} Không bị xóa`);
            return;
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.log(`${appId} Phản hồi không thành công: ${parseError}`);
            return;
        }

        if (!jsonData || !jsonData.data) {
            console.log(`${appId} Không nhận người mới`);
            return;
        }

        if (jsonData.data.status === 'FULL') {
            console.log(`${appId} Bản beta đầy`);
        } else {
            console.log(`${appId} Còn trống slot beta`);
            $notification.post('Còn trống slot beta', '', `APP ID: ${appId} còn slot trống.`);
        }
    });
}
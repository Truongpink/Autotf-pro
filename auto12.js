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
    $notification.post('Script chỉ thu thập thông tin', '', 'Không có chức năng tự động tham gia beta');
    console.log('Script chỉ thu thập thông tin, không tự động tham gia beta');
    $done({});
}
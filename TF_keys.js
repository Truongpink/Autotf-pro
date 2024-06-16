/*
Thời gian cập nhật: 2024.05.11 10:40
Nội dung được cập nhật: Đã thêm tính năng lưu giữ hoặc biến mất chậm theo danh mục thông báo, âm thanh nhắc đóng mô-đun (tham số SurgeTF)

Surge5
https://raw.githubusercontent.com/Hely-T/TestFlight-All/master/Tool/Surge5/Surge/AUTOTF.sgmodule
*/

if (typeof $request !== 'undefined' && $request) {
    let url = $request.url

    let keyPattern = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*?)\/apps/
    let key = url.match(keyPattern) ? url.match(keyPattern)[1] : null
    const handler = (appIdMatch) => {
        if (appIdMatch && appIdMatch[1]) {
            let appId = appIdMatch[1]
            let existingAppIds = $persistentStore.read('APP_ID')
            let appIdSet = new Set(existingAppIds ? existingAppIds.split(',') : [])
            if (!appIdSet.has(appId)) {
                appIdSet.add(appId)
                $persistentStore.write(Array.from(appIdSet).join(','), 'APP_ID')
                $notification.post('APP_ID đã không còn', '', `APP_ID đã được chụp và lưu trữ: ${appId}`, {"auto-dismiss": 2})
                console.log(`APP_ID đã được chụp và lưu trữ: ${appId}`)
            } else {
                $notification.post('APP_ID bị trùng lặp', '', `APP_ID: ${appId} Nó đã tồn tại rồi, không cần thêm lại.` , {"auto-dismiss": 2})
                console.log(`APP_ID: ${appId} Nó đã tồn tại rồi, không cần thêm lại.`)
            }
        } else {
            console.log('Không có APP_ID TestFlight hợp lệ nào được ghi lại')
        }
    }
    if (/^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/apps$/.test(url) && key) {
        let headers = Object.fromEntries(Object.entries($request.headers).map(([key, value]) => [key.toLowerCase(), value]))
        let session_id = headers['x-session-id']
        let session_digest = headers['x-session-digest']
        let request_id = headers['x-request-id']

        $persistentStore.write(session_id, 'session_id')
        $persistentStore.write(session_digest, 'session_digest')
        $persistentStore.write(request_id, 'request_id')
        $persistentStore.write(key, 'key')

        let existingAppIds = $persistentStore.read('APP_ID')
        if (!existingAppIds) {
            $notification.post('Thông tin thu được thành công 🎉', '', 'Vui lòng lấy APP_ID và chỉnh sửa các tham số mô-đun để tắt tập lệnh.' , {"auto-dismiss": 10})
        }
        console.log(`Thông tin thu được thành công: session_id=${session_id}, session_digest=${session_digest}, request_id=${request_id}, key=${key}`)
    } else if (/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/.test(url)) {
        const appIdMatch = url.match(/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/)
        handler(appIdMatch)
    } else if (/v3\/accounts\/.*\/ru/.test(url)) {
        const appIdMatch = url.match(/v3\/accounts\/.*\/ru\/(.*)/)
        handler(appIdMatch)
    }

    $done({})
} else {
    !(async () => {
        let ids = $persistentStore.read('APP_ID')
        if (!ids) {
            console.log('APP_ID không được phát hiện')
            $done()
        } else {
            ids = ids.split(',')
            for await (const ID of ids) {
                await autoPost(ID, ids)
            }
            if (ids.length === 0) {
                $notification.post('Tất cả các ID TestFlight đã được thêm vào 🎉', '', 'Mô-đun đã tự động tắt và ngừng chạy.', {"sound": true});
                $done($httpAPI('POST', '/v1/modules', {'Giám sát beta công khai': false}));
            } else {
                $done()
            }
        }
    })()
}

 
if (typeof $request !== 'undefined' && $request) {
    let url = $request.url;
    console.log('Received URL:', url);
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
    !(async () => {
        let ids = $persistentStore.read('APP_ID');
        if (!ids) {
            console.log('Không thấy APP_ID');
            $done();
        } else {
            ids = ids.split(',');
            for await (const ID of ids) {
                await autoPost(ID, ids);
            }
            if (ids.length === 0) {
                $notification.post('Tất cả Beta đã được thêm vào 🎉', '', 'Modul tự động tắt');
                $done($httpAPI('POST', '/v1/modules', {'Auto Join TestFlight': false}));
            } else {
                $done();
            }
        }
    })();
}

const APP_ID = 'YOUR_APP_ID';
const CHECK_INTERVAL = 60000; // Thời gian kiểm tra lại (mili giây)
const PERSISTENT_STORE_KEY = 'testflight_app_status';

function checkAppStatus(appId) {
    const url = `https://api.testflight.example.com/v1/applications/${appId}/status`;

    return $httpClient.get(url, function(error, response, data) {
        if (error) {
            console.log('Error fetching app status:', error);
            return null;
        }
        if (response.status === 200) {
            return JSON.parse(data);
        } else {
            console.log('Failed to fetch app status:', response.status);
            return null;
        }
    });
}

function joinBeta(appId) {
    const url = `https://api.testflight.example.com/v1/applications/${appId}/join`;

    return $httpClient.post(url, function(error, response, data) {
        if (error) {
            console.log('Error joining beta:', error);
            return null;
        }
        if (response.status === 200) {
            return JSON.parse(data);
        } else {
            console.log('Failed to join beta:', response.status);
            return null;
        }
    });
}

function savePersistentStore(data) {
    $persistentStore.write(JSON.stringify(data), PERSISTENT_STORE_KEY);
}

function loadPersistentStore() {
    const data = $persistentStore.read(PERSISTENT_STORE_KEY);
    return data ? JSON.parse(data) : {};
}

function main() {
    const persistentStore = loadPersistentStore();
    
    const intervalId = setInterval(() => {
        checkAppStatus(APP_ID, (status) => {
            if (status && status.available) {
                console.log(`Joining beta for ${APP_ID}...`);
                joinBeta(APP_ID, (joinResponse) => {
                    if (joinResponse) {
                        persistentStore[APP_ID] = joinResponse;
                        savePersistentStore(persistentStore);
                        console.log('Joined beta successfully.');
                        clearInterval(intervalId);
                    }
                });
            } else {
                console.log(`Beta for ${APP_ID} is full. Checking again in ${CHECK_INTERVAL / 1000} seconds...`);
            }
        });
    }, CHECK_INTERVAL);
}

main();
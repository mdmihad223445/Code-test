<?php
// sendWebhook.php - Backend to forward data safely to Discord webhook

$webhookURL = "https://discord.com/api/webhooks/XXXXXXXXXX/XXXXXXXXXXXXXXX";  // <-- Yahan apna asli webhook URL daalo

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// If Content-Type is JSON, read input as JSON
$contentType = $_SERVER["CONTENT_TYPE"] ?? '';

if (strpos($contentType, "application/json") !== false) {
    $data = file_get_contents('php://input');

    // Forward to Discord webhook
    $ch = curl_init($webhookURL);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to send webhook", "response" => $response]);
    }
    exit;
}

// If multipart/form-data (file upload)
if (strpos($contentType, "multipart/form-data") !== false) {
    // Prepare multipart data for Discord webhook

    $boundary = substr($contentType, strpos($contentType, "boundary=") + 9);
    $file = $_FILES['file'] ?? null;
    $content = $_POST['content'] ?? "";

    if (!$file) {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded"]);
        exit;
    }

    // Prepare CURLFile for file upload
    $cfile = new CURLFile($file['tmp_name'], $file['type'], $file['name']);

    // Prepare post fields
    $postFields = [
        'file' => $cfile,
        'payload_json' => json_encode(['content' => $content])
    ];

    $ch = curl_init($webhookURL);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Expect:']);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to send webhook with file", "response" => $response]);
    }
    exit;
}

// Default fallback
http_response_code(400);
echo json_encode(["error" => "Unsupported Content-Type"]);
?>

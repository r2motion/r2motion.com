<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'This endpoint only accepts form submissions.',
    ]);
    exit;
}

$rawBody = file_get_contents('php://input') ?: '';
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    $payload = $_POST;
}

function clean_field(array $payload, string $key, int $maxLength = 2000): string
{
    $value = $payload[$key] ?? '';

    if (is_array($value)) {
        $value = implode(', ', $value);
    }

    $value = trim((string) $value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = strip_tags($value);

    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }

    return substr($value, 0, $maxLength);
}

function header_safe(string $value): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $value) ?? '');
}

$honeypot = clean_field($payload, 'website', 250);

if ($honeypot !== '') {
    echo json_encode([
        'success' => true,
        'message' => 'Inquiry sent.',
    ]);
    exit;
}

$name = clean_field($payload, 'name', 120);
$email = clean_field($payload, 'email', 180);
$company = clean_field($payload, 'company', 160);
$type = clean_field($payload, 'type', 120);
$budget = clean_field($payload, 'budget', 80);
$message = clean_field($payload, 'message', 5000);

if ($name === '' || $email === '' || $message === '') {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please complete your name, email, and project notes.',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid email address.',
    ]);
    exit;
}

$recipient = 'hello@r2motion.com';
$safeName = header_safe($name);
$safeEmail = header_safe($email);
$subject = sprintf('Project inquiry from %s', $safeName !== '' ? $safeName : 'r2motion.com');

$body = implode("\n", [
    'New project inquiry from r2motion.com',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
    'Company: ' . ($company !== '' ? $company : '-'),
    'Project type: ' . ($type !== '' ? $type : '-'),
    'Budget range: ' . ($budget !== '' ? $budget : '-'),
    '',
    'Project notes:',
    $message,
    '',
    'Sent from: ' . ($_SERVER['HTTP_HOST'] ?? 'r2motion.com'),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
]);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: r2motion Website <no-reply@r2motion.com>',
    'Reply-To: ' . ($safeName !== '' ? sprintf('"%s" <%s>', addcslashes($safeName, '"\\'), $safeEmail) : $safeEmail),
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($recipient, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'The inquiry could not be sent right now. Please try again in a moment.',
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Inquiry sent.',
]);

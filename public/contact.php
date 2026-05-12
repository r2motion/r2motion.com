<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const ELASTIC_EMAIL_ENDPOINT = 'https://api.elasticemail.com/v4/emails/transactional';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'This endpoint only accepts form submissions.');
}

$rawBody = file_get_contents('php://input') ?: '';
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    $payload = $_POST;
}

$config = load_contact_config();

$honeypot = clean_field($payload, 'website', 250);

if ($honeypot !== '') {
    json_response(200, true, 'Inquiry sent.');
}

$name = clean_field($payload, 'name', 120);
$email = clean_field($payload, 'email', 180);
$company = clean_field($payload, 'company', 160);
$type = clean_field($payload, 'type', 120);
$budget = clean_field($payload, 'budget', 80);
$message = clean_field($payload, 'message', 5000);

if ($name === '' || $email === '' || $message === '') {
    json_response(422, false, 'Please complete your name, email, and project notes.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(422, false, 'Please enter a valid email address.');
}

if (($config['elastic_email_api_key'] ?? '') === '') {
    json_response(500, false, 'Email service is not configured yet.');
}

$recipients = clean_email_list(clean_config_value($config, 'to_email', 'hello@r2motion.com'));
$fromEmail = clean_config_value($config, 'from_email', 'hello@r2motion.com');
$fromName = clean_config_value($config, 'from_name', 'r2motion Website');
$safeName = header_safe($name);
$safeEmail = header_safe($email);
$subject = sprintf('Project inquiry from %s', $safeName !== '' ? $safeName : 'r2motion.com');
$plainBody = build_plain_body($name, $email, $company, $type, $budget, $message);
$htmlBody = nl2br(htmlspecialchars($plainBody, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));

if ($recipients === []) {
    json_response(500, false, 'Email recipient is not configured correctly.');
}

$elasticPayload = [
    'Recipients' => [
        'To' => $recipients,
    ],
    'Content' => [
        'From' => sprintf('%s <%s>', $fromName, $fromEmail),
        'ReplyTo' => sprintf('%s <%s>', $safeName !== '' ? $safeName : $safeEmail, $safeEmail),
        'Subject' => $subject,
        'Body' => [
            [
                'ContentType' => 'PlainText',
                'Charset' => 'utf-8',
                'Content' => $plainBody,
            ],
            [
                'ContentType' => 'HTML',
                'Charset' => 'utf-8',
                'Content' => $htmlBody,
            ],
        ],
    ],
];

$elasticResult = send_with_elastic_email((string) $config['elastic_email_api_key'], $elasticPayload);

if (!$elasticResult['success']) {
    error_log('Elastic Email contact form failed: ' . $elasticResult['detail']);
    json_response(500, false, 'The inquiry could not be sent right now. Please try again in a moment.');
}

$reference = $elasticResult['transaction_id'] ?: $elasticResult['message_id'];
$messageSuffix = $reference !== '' ? ' Reference: ' . $reference : '';

json_response(200, true, 'Inquiry accepted by Elastic Email.' . $messageSuffix, [
    'reference' => $reference,
]);

function load_contact_config(): array
{
    $config = [
        'elastic_email_api_key' => getenv('ELASTIC_EMAIL_API_KEY') ?: '',
        'to_email' => getenv('CONTACT_TO_EMAIL') ?: 'hello@r2motion.com',
        'from_email' => getenv('CONTACT_FROM_EMAIL') ?: 'hello@r2motion.com',
        'from_name' => getenv('CONTACT_FROM_NAME') ?: 'r2motion Website',
    ];
    $privateConfigPath = dirname(__DIR__) . '/private_html/contact-config.php';

    if (is_file($privateConfigPath)) {
        $fileConfig = require $privateConfigPath;

        if (is_array($fileConfig)) {
            $config = array_merge($config, $fileConfig);
        }
    }

    return $config;
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

function clean_config_value(array $config, string $key, string $fallback): string
{
    $value = trim((string) ($config[$key] ?? ''));

    return $value !== '' ? header_safe($value) : $fallback;
}

function clean_email_list(string $emails): array
{
    $items = preg_split('/[,;]+/', $emails) ?: [];
    $cleanEmails = [];

    foreach ($items as $item) {
        $email = trim($item);

        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $cleanEmails[] = $email;
        }
    }

    return array_values(array_unique($cleanEmails));
}

function header_safe(string $value): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $value) ?? '');
}

function build_plain_body(
    string $name,
    string $email,
    string $company,
    string $type,
    string $budget,
    string $message
): string {
    return implode("\n", [
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
}

function send_with_elastic_email(string $apiKey, array $payload): array
{
    $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    if ($jsonPayload === false) {
        return [
            'success' => false,
            'detail' => 'Could not encode Elastic Email payload.',
        ];
    }

    $curl = curl_init(ELASTIC_EMAIL_ENDPOINT);

    if ($curl === false) {
        return [
            'success' => false,
            'detail' => 'Could not initialize cURL.',
        ];
    }

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => false,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-ElasticEmail-ApiKey: ' . $apiKey,
        ],
        CURLOPT_TIMEOUT => 20,
    ]);

    $responseBody = curl_exec($curl);
    $curlError = curl_error($curl);
    $statusCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($responseBody === false) {
        return [
            'success' => false,
            'detail' => $curlError !== '' ? $curlError : 'Elastic Email request failed.',
        ];
    }

    $decodedResponse = json_decode((string) $responseBody, true);

    if ($statusCode < 200 || $statusCode >= 300) {
        return [
            'success' => false,
            'detail' => sprintf('Elastic Email returned HTTP %d: %s', $statusCode, (string) $responseBody),
            'transaction_id' => '',
            'message_id' => '',
        ];
    }

    return [
        'success' => true,
        'detail' => (string) $responseBody,
        'transaction_id' => is_array($decodedResponse) ? (string) ($decodedResponse['TransactionID'] ?? '') : '',
        'message_id' => is_array($decodedResponse) ? (string) ($decodedResponse['MessageID'] ?? '') : '',
    ];
}

function json_response(int $statusCode, bool $success, string $message, array $extra = []): void
{
    http_response_code($statusCode);
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message,
    ], $extra));
    exit;
}

<?php

declare(strict_types=1);

function render_auth_response(string $status, array $payload): void
{
    $payloadJson = json_encode($payload, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Authorizing Decap CMS</title>
    <script>
      const authStatus = '{$status}';
      const authPayload = {$payloadJson};
      const authMessage = 'authorization:github:' + authStatus + ':' + JSON.stringify(authPayload);
      let attempts = 0;

      const sendAuthMessage = () => {
        attempts += 1;

        if (!window.opener) {
          document.body.innerHTML = '<p>Authorization complete. You can close this window and return to the CMS.</p>';
          return;
        }

        window.opener.postMessage(authMessage, '*');

        if (authStatus !== 'success') {
          document.body.innerHTML = '<h1>CMS authorization failed</h1><p>' + (authPayload.message || 'Unknown error') + '</p>';
        }
      };

      window.addEventListener('message', sendAuthMessage, false);
      window.opener.postMessage('authorizing:github', '*');
      window.setInterval(() => {
        if (window.opener) {
          window.opener.postMessage('authorizing:github', '*');
        }
      }, 400);
      sendAuthMessage();
      window.setInterval(sendAuthMessage, 400);
    </script>
  </head>
  <body>
    <p>Authorizing Decap CMS...</p>
  </body>
</html>
HTML;
}

function fail_auth(string $message): void
{
    render_auth_response('error', ['message' => $message]);
    exit;
}

$configPath = dirname(__DIR__, 2) . '/private_html/cms-auth-config.php';

if (!file_exists($configPath)) {
    fail_auth('Missing cms-auth-config.php in private_html.');
}

$config = require $configPath;

$clientId = $config['client_id'] ?? getenv('GITHUB_OAUTH_ID') ?: '';
$clientSecret = $config['client_secret'] ?? getenv('GITHUB_OAUTH_SECRET') ?: '';
$baseUrl = rtrim($config['base_url'] ?? '', '/');
$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';
$cookieState = $_COOKIE['decap_oauth_state'] ?? '';

if ($clientId === '' || $clientSecret === '' || $baseUrl === '') {
    fail_auth('CMS auth bridge is missing client_id, client_secret, or base_url.');
}

if ($code === '') {
    fail_auth('Missing GitHub authorization code.');
}

if ($state === '' || $cookieState === '' || !hash_equals($cookieState, $state)) {
    fail_auth('Invalid GitHub authorization state.');
}

$redirectUri = $baseUrl . '/callback.php';
$postBody = http_build_query([
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'code' => $code,
    'redirect_uri' => $redirectUri,
]);

$ch = curl_init('https://github.com/login/oauth/access_token');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postBody,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'User-Agent: r2motion-decap-cms',
    ],
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || $statusCode < 200 || $statusCode >= 300) {
    fail_auth($curlError !== '' ? $curlError : 'GitHub token request failed.');
}

$data = json_decode($response, true);
$token = is_array($data) ? ($data['access_token'] ?? '') : '';

if ($token === '') {
    fail_auth('GitHub did not return an access token.');
}

setcookie('decap_oauth_state', '', [
    'expires' => time() - 3600,
    'path' => '/cms-auth',
]);

render_auth_response('success', ['token' => $token]);

<?php

declare(strict_types=1);

$configPath = dirname(__DIR__, 2) . '/private_html/cms-auth-config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    exit('Missing cms-auth-config.php in private_html.');
}

$config = require $configPath;

$clientId = $config['client_id'] ?? getenv('GITHUB_OAUTH_ID') ?: '';
$repoPrivate = (bool)($config['repo_private'] ?? false);
$baseUrl = rtrim($config['base_url'] ?? '', '/');

if ($clientId === '' || $baseUrl === '') {
    http_response_code(500);
    exit('CMS auth bridge is missing client_id or base_url.');
}

$state = bin2hex(random_bytes(16));
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

setcookie('decap_oauth_state', $state, [
    'expires' => time() + 600,
    'path' => '/cms-auth',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);

$scope = $repoPrivate ? 'repo,user' : 'public_repo,user';
$redirectUri = $baseUrl . '/callback.php';

$query = http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'scope' => $scope,
    'state' => $state,
]);

header('Location: https://github.com/login/oauth/authorize?' . $query, true, 302);
exit;

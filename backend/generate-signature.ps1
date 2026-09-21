$secret = "payflow_webhook_secret_2026"

$body = '{"provider":"payflow_simulator","eventId":"evt_signature_001","eventType":"payment.succeeded","paymentId":"3bfd34dd-3709-4253-b2e9-475aab90c6d6","status":"successful","data":{"providerTransactionId":"EXT-999999","amount":50,"currency":"ETB"}}'

$hmac = New-Object System.Security.Cryptography.HMACSHA256

$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)

$hash = $hmac.ComputeHash(
    [System.Text.Encoding]::UTF8.GetBytes($body)
)

$signature = -join ($hash | ForEach-Object {
    $_.ToString("x2")
})

Write-Host ""
Write-Host "Signature:"
Write-Host $signature
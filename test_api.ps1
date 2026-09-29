try {
    $body = @{email='admin@restaurant.com'; password='admin123'} | ConvertTo-Json
    $res = Invoke-RestMethod -Uri 'https://swetha-cafe-restaurant.onrender.com/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
    $token = $res.token
    $headers = @{Authorization="Bearer $token"}

    Write-Host "--- TESTING ALL ENDPOINTS ---"

    $tests = @(
        @{ name="Menus"; url="menus" },
        @{ name="Orders"; url="orders" },
        @{ name="Employees"; url="employees" },
        @{ name="Customers"; url="customer" },
        @{ name="Drivers"; url="drivers" },
        @{ name="Suppliers"; url="suppliers" },
        @{ name="Delivery Charges"; url="delivery-charges" },
        @{ name="Service Charge"; url="admin/service-charge" },
        @{ name="Admin Summary"; url="admin/summary" },
        @{ name="Kitchen Requests"; url="kitchen/requests" },
        @{ name="Attendance Monthly"; url="admin/attendance/monthly-summary" }
    )

    foreach ($t in $tests) {
        try {
            $r = Invoke-RestMethod -Uri "https://swetha-cafe-restaurant.onrender.com/api/auth/$($t.url)" -Headers $headers
            Write-Host "OK   $($t.name)"
        } catch {
            Write-Host "FAIL $($t.name) - $($_.Exception.Message)"
        }
    }

} catch {
    Write-Host "LOGIN FAILED: $($_.Exception.Message)"
}

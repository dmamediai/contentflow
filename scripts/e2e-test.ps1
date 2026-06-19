# ContentFlow End-to-End Testing Script (PowerShell)
# Run this to validate all major features work

param(
    [string]$ApiUrl = "http://localhost:3001",
    [string]$WebUrl = "http://localhost:3000",
    [switch]$Verbose = $false
)

# Setup
$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "e2e-test-$timestamp@example.com"
$testPassword = "TestPassword123!"

# Track results
$passed = 0
$failed = 0
$tests = @()

function Write-TestHeader {
    param([string]$Phase)
    Write-Host "`n" -ForegroundColor Yellow
    Write-Host "=== $Phase ===" -ForegroundColor Yellow
    Write-Host ""
}

function Write-Test {
    param([string]$Message)
    Write-Host "Testing: $Message" -ForegroundColor Yellow
}

function Pass {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:passed++
    $script:tests += "PASS: $Message"
}

function Fail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:failed++
    $script:tests += "FAIL: $Message"
}

function AssertStatus {
    param(
        [int]$Expected,
        [int]$Actual,
        [string]$Message
    )

    if ($Actual -eq $Expected) {
        Pass "$Message (HTTP $Actual)"
    } else {
        Fail "$Message (Expected HTTP $Expected, got $Actual)"
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body,
        [string]$Token,
        [switch]$RawResponse
    )

    $url = "$ApiUrl/api$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    try {
        if ($Body) {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
            if ($Verbose) {
                Write-Host "Request: $Method $endpoint" -ForegroundColor Cyan
                Write-Host "Body: $bodyJson" -ForegroundColor Cyan
            }
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -Body $bodyJson -UseBasicParsing
        } else {
            if ($Verbose) {
                Write-Host "Request: $Method $endpoint" -ForegroundColor Cyan
            }
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -UseBasicParsing
        }

        if ($RawResponse) {
            return $response
        }

        $content = $response.Content | ConvertFrom-Json
        return @{
            StatusCode = $response.StatusCode
            Content = $content
        }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.Value__
            if ($RawResponse) {
                return @{ StatusCode = $statusCode }
            }
            return @{
                StatusCode = $statusCode
                Content = $null
                Error = $_.Exception.Message
            }
        }
        Fail "Request failed: $($_.Exception.Message)"
        return $null
    }
}

# ============================================================================
# Phase 1: API Health Check
# ============================================================================

Write-TestHeader "Phase 1: API Health Check"

Write-Test "API is responding"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -UseBasicParsing
    AssertStatus 200 $response.StatusCode "API health check"
} catch {
    Fail "API health check (Connection failed)"
}

# ============================================================================
# Phase 2: Authentication Tests
# ============================================================================

Write-TestHeader "Phase 2: Authentication"

# Register user
Write-Test "User Registration"
$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = "E2E Test User"
}

$registerResult = Invoke-ApiRequest -Method POST -Endpoint "/auth/register" -Body $registerBody

if ($registerResult -and $registerResult.StatusCode -eq 201) {
    if ($registerResult.Content.token) {
        $accessToken = $registerResult.Content.token
        $userId = $registerResult.Content.user.id
        Pass "User registered successfully"
    } else {
        Fail "User registration - no token in response"
    }
} else {
    Fail "User registration failed (HTTP $($registerResult.StatusCode))"
    if ($registerResult.Content) {
        Write-Host "Response: $($registerResult.Content | ConvertTo-Json)" -ForegroundColor Gray
    }
    exit 1
}

# Get session
Write-Test "Get Current Session"
if ($accessToken) {
    $sessionResult = Invoke-ApiRequest -Method GET -Endpoint "/auth/session" -Token $accessToken
    if ($sessionResult.StatusCode -eq 200) {
        Pass "Get current session"
    } else {
        Fail "Get current session (HTTP $($sessionResult.StatusCode))"
    }
}

# ============================================================================
# Phase 3: Team Management Tests
# ============================================================================

Write-TestHeader "Phase 3: Team Management"

if ($accessToken) {
    # Create team
    Write-Test "Create Team"
    $teamBody = @{
        name = "E2E Test Team"
        description = "Testing team for E2E validation"
    }

    $teamResult = Invoke-ApiRequest -Method POST -Endpoint "/teams" -Body $teamBody -Token $accessToken

    if ($teamResult.StatusCode -eq 201 -and $teamResult.Content.team) {
        $teamId = $teamResult.Content.team.id
        Pass "Team created successfully"
    } else {
        Fail "Team creation failed (HTTP $($teamResult.StatusCode))"
    }

    # List teams
    Write-Test "List Teams"
    $listTeamsResult = Invoke-ApiRequest -Method GET -Endpoint "/teams" -Token $accessToken
    AssertStatus 200 $listTeamsResult.StatusCode "List teams"

    # Get team details
    if ($teamId) {
        Write-Test "Get Team Details"
        $getTeamResult = Invoke-ApiRequest -Method GET -Endpoint "/teams/$teamId" -Token $accessToken
        AssertStatus 200 $getTeamResult.StatusCode "Get team details"

        # Update team
        Write-Test "Update Team"
        $updateTeamBody = @{
            name = "Updated E2E Team"
            description = "Updated description"
        }
        $updateTeamResult = Invoke-ApiRequest -Method PUT -Endpoint "/teams/$teamId" -Body $updateTeamBody -Token $accessToken
        AssertStatus 200 $updateTeamResult.StatusCode "Update team"

        # List team members
        Write-Test "List Team Members"
        $membersResult = Invoke-ApiRequest -Method GET -Endpoint "/teams/$teamId/members" -Token $accessToken
        AssertStatus 200 $membersResult.StatusCode "List team members"
    }
}

# ============================================================================
# Phase 4: AI Content Generation Tests
# ============================================================================

Write-TestHeader "Phase 4: AI Content Generation"

if ($accessToken) {
    # Generate content
    Write-Test "Generate Social Post"
    $generateBody = @{
        type = "social_post"
        platform = "twitter"
        topic = "software development best practices"
        tone = "professional"
        length = "short"
        includeHashtags = $true
    }

    $generateResult = Invoke-ApiRequest -Method POST -Endpoint "/ai/generate" -Body $generateBody -Token $accessToken

    if ($generateResult.StatusCode -eq 200 -and $generateResult.Content.content) {
        Pass "AI content generated successfully"
    } else {
        Fail "AI content generation failed (HTTP $($generateResult.StatusCode))"
    }

    # Rewrite content
    Write-Test "Rewrite Content"
    $rewriteBody = @{
        content = "This product is awesome and you should try it"
        style = "professional"
        platform = "linkedin"
    }

    $rewriteResult = Invoke-ApiRequest -Method POST -Endpoint "/ai/rewrite" -Body $rewriteBody -Token $accessToken

    if ($rewriteResult.StatusCode -eq 200) {
        Pass "Content rewriting works"
    } else {
        Fail "Content rewriting failed"
    }

    # Generate hashtags
    Write-Test "Generate Hashtags"
    $hashtagBody = @{
        content = "Announcing new AI-powered features"
        count = 5
        platform = "instagram"
    }

    $hashtagResult = Invoke-ApiRequest -Method POST -Endpoint "/ai/hashtags" -Body $hashtagBody -Token $accessToken

    if ($hashtagResult.StatusCode -eq 200) {
        Pass "Hashtag generation works"
    } else {
        Fail "Hashtag generation failed"
    }
}

# ============================================================================
# Phase 5: Content Scheduler Tests
# ============================================================================

Write-TestHeader "Phase 5: Content Scheduler"

if ($accessToken -and $teamId) {
    # Create draft post
    Write-Test "Create Draft Post"
    $postBody = @{
        teamId = $teamId
        content = "This is a test post for E2E testing"
        platforms = @("twitter")
        status = "draft"
    }

    $postResult = Invoke-ApiRequest -Method POST -Endpoint "/posts" -Body $postBody -Token $accessToken

    if ($postResult.StatusCode -eq 201 -and $postResult.Content.post) {
        $postId = $postResult.Content.post.id
        Pass "Draft post created successfully"
    } else {
        Fail "Draft post creation failed (HTTP $($postResult.StatusCode))"
    }

    # List posts
    Write-Test "List Posts"
    $listPostsResult = Invoke-ApiRequest -Method GET -Endpoint "/posts?teamId=$teamId" -Token $accessToken
    AssertStatus 200 $listPostsResult.StatusCode "List posts"

    # Get post details
    if ($postId) {
        Write-Test "Get Post Details"
        $getPostResult = Invoke-ApiRequest -Method GET -Endpoint "/posts/$postId" -Token $accessToken
        AssertStatus 200 $getPostResult.StatusCode "Get post details"
    }
}

# ============================================================================
# Phase 6: Media Management Tests
# ============================================================================

Write-TestHeader "Phase 6: Media Management"

if ($accessToken -and $teamId) {
    Write-Test "List Media Library"
    $mediaResult = Invoke-ApiRequest -Method GET -Endpoint "/media?teamId=$teamId" -Token $accessToken
    AssertStatus 200 $mediaResult.StatusCode "List media library"
}

# ============================================================================
# Phase 7: Analytics Tests
# ============================================================================

Write-TestHeader "Phase 7: Analytics"

if ($accessToken -and $teamId) {
    Write-Test "Get Analytics Overview"
    $analyticsResult = Invoke-ApiRequest -Method GET -Endpoint "/analytics/overview?teamId=$teamId&period=last_30_days" -Token $accessToken
    AssertStatus 200 $analyticsResult.StatusCode "Get analytics overview"
}

# ============================================================================
# Results Summary
# ============================================================================

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Tests Passed: $passed" -ForegroundColor Green
Write-Host "Tests Failed: $failed" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "Test Results Summary:" -ForegroundColor Yellow
$tests | ForEach-Object {
    if ($_.StartsWith("PASS")) {
        Write-Host "  $_" -ForegroundColor Green
    } else {
        Write-Host "  $_" -ForegroundColor Red
    }
}

if ($failed -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed" -ForegroundColor Red
    exit 1
}

#!/bin/bash

# ContentFlow End-to-End Testing Script
# Run this to validate all major features work

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="e2e-test-$TIMESTAMP@example.com"
TEST_PASSWORD="TestPassword123!"

# Track results
PASSED=0
FAILED=0
TESTS=()

# Utility functions
log_test() {
  echo -e "${YELLOW}Testing: $1${NC}"
}

pass() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED++))
  TESTS+=("PASS: $1")
}

fail() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
  TESTS+=("FAIL: $1")
}

print_response() {
  echo "Response: $1" | head -c 200
  echo "..."
}

assert_status() {
  local expected=$1
  local actual=$2
  local message=$3

  if [ "$actual" = "$expected" ]; then
    pass "$message (HTTP $actual)"
  else
    fail "$message (Expected HTTP $expected, got $actual)"
  fi
}

# Test counter
test_count() {
  echo -e "\n${YELLOW}========================================${NC}"
  echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
  echo -e "Tests Failed: ${RED}$FAILED${NC}"
  echo -e "${YELLOW}========================================${NC}\n"
}

# ============================================================================
# Phase 1: API Health Check
# ============================================================================

echo -e "\n${YELLOW}=== Phase 1: API Health Check ===${NC}\n"

log_test "API is responding"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
assert_status "200" "$HEALTH_STATUS" "API health check"

# ============================================================================
# Phase 2: Authentication Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 2: Authentication ===${NC}\n"

# Register user
log_test "User Registration"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"E2E Test User\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q '"token"'; then
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  pass "User registered successfully"
else
  fail "User registration failed"
  print_response "$REGISTER_RESPONSE"
  exit 1
fi

# Get session
log_test "Get Current Session"
SESSION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/auth/session" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
assert_status "200" "$SESSION_STATUS" "Get session"

# ============================================================================
# Phase 3: Team Management Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 3: Team Management ===${NC}\n"

# Create team
log_test "Create Team"
TEAM_RESPONSE=$(curl -s -X POST "$API_URL/api/teams" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"name\": \"E2E Test Team\",
    \"description\": \"Testing team for E2E validation\"
  }")

if echo "$TEAM_RESPONSE" | grep -q '"id"'; then
  TEAM_ID=$(echo "$TEAM_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  pass "Team created successfully"
else
  fail "Team creation failed"
  print_response "$TEAM_RESPONSE"
fi

# List teams
log_test "List Teams"
TEAMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/teams" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
assert_status "200" "$TEAMS_STATUS" "List teams"

# Get team details
if [ -n "$TEAM_ID" ]; then
  log_test "Get Team Details"
  TEAM_DETAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/teams/$TEAM_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  assert_status "200" "$TEAM_DETAIL_STATUS" "Get team details"

  # Update team
  log_test "Update Team"
  UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_URL/api/teams/$TEAM_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"name\": \"Updated E2E Team\",
      \"description\": \"Updated description\"
    }")
  assert_status "200" "$UPDATE_STATUS" "Update team"

  # List team members
  log_test "List Team Members"
  MEMBERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/teams/$TEAM_ID/members" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  assert_status "200" "$MEMBERS_STATUS" "List team members"
fi

# ============================================================================
# Phase 4: AI Content Generation Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 4: AI Content Generation ===${NC}\n"

# Generate content
log_test "Generate Social Post"
AI_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"type\": \"social_post\",
    \"platform\": \"twitter\",
    \"topic\": \"software development best practices\",
    \"tone\": \"professional\",
    \"length\": \"short\",
    \"includeHashtags\": true
  }")

if echo "$AI_RESPONSE" | grep -q '"content"'; then
  pass "AI content generated successfully"
else
  fail "AI content generation failed"
  print_response "$AI_RESPONSE"
fi

# Rewrite content
log_test "Rewrite Content"
REWRITE_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/rewrite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"content\": \"This product is awesome and you should try it\",
    \"style\": \"professional\",
    \"platform\": \"linkedin\"
  }")

if echo "$REWRITE_RESPONSE" | grep -q '"content"'; then
  pass "Content rewriting works"
else
  fail "Content rewriting failed"
fi

# Generate hashtags
log_test "Generate Hashtags"
HASHTAG_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/hashtags" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"content\": \"Announcing new AI-powered features\",
    \"count\": 5,
    \"platform\": \"instagram\"
  }")

if echo "$HASHTAG_RESPONSE" | grep -q '"hashtags"'; then
  pass "Hashtag generation works"
else
  fail "Hashtag generation failed"
fi

# ============================================================================
# Phase 5: Content Scheduler Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 5: Content Scheduler ===${NC}\n"

if [ -n "$TEAM_ID" ]; then
  # Create draft post
  log_test "Create Draft Post"
  POST_RESPONSE=$(curl -s -X POST "$API_URL/api/posts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"teamId\": \"$TEAM_ID\",
      \"content\": \"This is a test post for E2E testing\",
      \"platforms\": [\"twitter\"],
      \"status\": \"draft\"
    }")

  if echo "$POST_RESPONSE" | grep -q '"id"'; then
    POST_ID=$(echo "$POST_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    pass "Draft post created successfully"
  else
    fail "Draft post creation failed"
    print_response "$POST_RESPONSE"
  fi

  # List posts
  log_test "List Posts"
  LIST_POSTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/posts?teamId=$TEAM_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  assert_status "200" "$LIST_POSTS_STATUS" "List posts"

  # Get post details
  if [ -n "$POST_ID" ]; then
    log_test "Get Post Details"
    GET_POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/posts/$POST_ID" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    assert_status "200" "$GET_POST_STATUS" "Get post details"
  fi
fi

# ============================================================================
# Phase 6: Media Management Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 6: Media Management ===${NC}\n"

if [ -n "$TEAM_ID" ]; then
  # List media
  log_test "List Media Library"
  MEDIA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/media?teamId=$TEAM_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  assert_status "200" "$MEDIA_STATUS" "List media library"
fi

# ============================================================================
# Phase 7: Analytics Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 7: Analytics ===${NC}\n"

if [ -n "$TEAM_ID" ]; then
  log_test "Get Analytics Overview"
  ANALYTICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/api/analytics/overview?teamId=$TEAM_ID&period=last_30_days" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  assert_status "200" "$ANALYTICS_STATUS" "Get analytics overview"
fi

# ============================================================================
# Phase 8: Database Connectivity Tests
# ============================================================================

echo -e "\n${YELLOW}=== Phase 8: Database ===${NC}\n"

log_test "Database Connection"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⊘ DATABASE_URL not set (skipping database test)${NC}"
else
  # Can add direct database test here if needed
  pass "Database environment configured"
fi

# ============================================================================
# Results Summary
# ============================================================================

test_count

echo -e "${YELLOW}Test Results Summary:${NC}"
for test in "${TESTS[@]}"; do
  echo "  $test"
done

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ Some tests failed${NC}"
  exit 1
fi

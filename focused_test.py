#!/usr/bin/env python3
"""
Focused test for the specific new backend features requested in the review.
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://mod-interface-fix.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_feature(name, test_func):
    """Run a test and report results"""
    try:
        result = test_func()
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
        return result
    except Exception as e:
        print(f"❌ FAIL - {name}: {str(e)}")
        return False

def login_admin():
    """Login as admin and return token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "username": "admin",
        "password": "Admin123!@"
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_last_login_field():
    """Test 1: GET /api/moderators returns last_login field"""
    token = login_admin()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/moderators", headers=headers)
    
    if response.status_code != 200:
        return False
    
    moderators = response.json()
    for mod in moderators:
        if "last_login" in mod:
            print(f"    ✓ Found last_login field: {mod.get('last_login')}")
            return True
    
    print("    ✗ last_login field not found")
    return False

def test_new_user_must_change_password():
    """Test 2: New users created with must_change_password=true"""
    test_username = f"testuser_{datetime.now().strftime('%H%M%S')}"
    
    # Register new user
    response = requests.post(f"{API_URL}/auth/register", json={
        "username": test_username,
        "password": "TestUser1!@#"
    })
    
    if response.status_code != 200:
        return False
    
    # Login to check must_change_password flag
    login_response = requests.post(f"{API_URL}/auth/login", json={
        "username": test_username,
        "password": "TestUser1!@#"
    })
    
    if login_response.status_code != 200:
        return False
    
    login_data = login_response.json()
    must_change = login_data.get("must_change_password", False)
    print(f"    ✓ must_change_password: {must_change}")
    
    return must_change == True

def test_login_updates_last_login():
    """Test 3: Login updates last_login timestamp"""
    token = login_admin()
    if not token:
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get current last_login
    response1 = requests.get(f"{API_URL}/moderators", headers=headers)
    if response1.status_code != 200:
        return False
    
    admin_before = None
    for mod in response1.json():
        if mod.get("username") == "admin":
            admin_before = mod.get("last_login")
            break
    
    # Login again
    requests.post(f"{API_URL}/auth/login", json={
        "username": "admin",
        "password": "Admin123!@"
    })
    
    # Get updated last_login
    response2 = requests.get(f"{API_URL}/moderators", headers=headers)
    if response2.status_code != 200:
        return False
    
    admin_after = None
    for mod in response2.json():
        if mod.get("username") == "admin":
            admin_after = mod.get("last_login")
            break
    
    print(f"    ✓ Before: {admin_before}")
    print(f"    ✓ After:  {admin_after}")
    
    return admin_after != admin_before and admin_after is not None

def test_password_change_clears_flag():
    """Test 4: Password change clears must_change_password flag"""
    test_username = f"pwdtest_{datetime.now().strftime('%H%M%S')}"
    
    # Register new user (will have must_change_password=true)
    requests.post(f"{API_URL}/auth/register", json={
        "username": test_username,
        "password": "TestUser1!@#"
    })
    
    # Login to get token
    login_response = requests.post(f"{API_URL}/auth/login", json={
        "username": test_username,
        "password": "TestUser1!@#"
    })
    
    if login_response.status_code != 200:
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Change password
    change_response = requests.patch(f"{API_URL}/auth/change-password", 
                                   headers=headers,
                                   json={
                                       "old_password": "TestUser1!@#",
                                       "new_password": "NewPass123!@#"
                                   })
    
    if change_response.status_code != 200:
        return False
    
    # Login again to check flag
    final_login = requests.post(f"{API_URL}/auth/login", json={
        "username": test_username,
        "password": "NewPass123!@#"
    })
    
    if final_login.status_code != 200:
        return False
    
    must_change = final_login.json().get("must_change_password", True)
    print(f"    ✓ must_change_password after password change: {must_change}")
    
    return must_change == False

def test_password_reset_sets_flag():
    """Test 5: Admin password reset sets must_change_password=true"""
    test_username = f"resettest_{datetime.now().strftime('%H%M%S')}"
    
    # Register new user and change password to clear flag
    requests.post(f"{API_URL}/auth/register", json={
        "username": test_username,
        "password": "TestUser1!@#"
    })
    
    # Login and change password to clear must_change_password
    login_response = requests.post(f"{API_URL}/auth/login", json={
        "username": test_username,
        "password": "TestUser1!@#"
    })
    
    user_token = login_response.json()["access_token"]
    requests.patch(f"{API_URL}/auth/change-password", 
                  headers={"Authorization": f"Bearer {user_token}"},
                  json={
                      "old_password": "TestUser1!@#",
                      "new_password": "NewPass123!@#"
                  })
    
    # Admin resets password
    admin_token = login_admin()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    reset_response = requests.patch(f"{API_URL}/auth/reset-password/{test_username}",
                                  headers=admin_headers,
                                  json={"new_password": "ResetPass123!@#"})
    
    if reset_response.status_code != 200:
        return False
    
    # Login with reset password to check flag
    final_login = requests.post(f"{API_URL}/auth/login", json={
        "username": test_username,
        "password": "ResetPass123!@#"
    })
    
    if final_login.status_code != 200:
        return False
    
    must_change = final_login.json().get("must_change_password", False)
    print(f"    ✓ must_change_password after admin reset: {must_change}")
    
    return must_change == True

def main():
    print("🔍 Testing Top War Moderator New Backend Features")
    print("=" * 60)
    
    results = []
    
    results.append(test_feature("1. Last Login Field in GET /api/moderators", test_last_login_field))
    results.append(test_feature("2. New Users Must Change Password", test_new_user_must_change_password))
    results.append(test_feature("3. Login Updates last_login", test_login_updates_last_login))
    results.append(test_feature("4. Password Change Clears Flag", test_password_change_clears_flag))
    results.append(test_feature("5. Password Reset Sets Flag", test_password_reset_sets_flag))
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All new features working correctly!")
        return 0
    else:
        print("⚠️  Some features need attention")
        return 1

if __name__ == "__main__":
    exit(main())
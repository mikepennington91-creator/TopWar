#!/usr/bin/env python3
"""
Simple test for email assignment functionality
"""

import requests
import json

API_BASE = "http://localhost:8001/api"

def test_email_assignment():
    """Test the email assignment functionality."""
    session = requests.Session()
    
    print("🔧 Testing Email Assignment Features")
    print("=" * 40)
    
    # 1. Register admin user
    admin_data = {
        "username": "testadmin2",
        "password": "Test@1234",
        "email": "testadmin2@gmail.com",
        "role": "admin"
    }
    
    response = session.post(f"{API_BASE}/auth/register", json=admin_data)
    if response.status_code == 200 or (response.status_code == 400 and "already registered" in response.text):
        print("✅ Admin user ready")
    else:
        print(f"❌ Admin registration failed: {response.status_code}")
        return
    
    # 2. Login as admin
    login_data = {
        "username": "testadmin2",
        "password": "Test@1234"
    }
    
    response = session.post(f"{API_BASE}/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        admin_token = data.get("access_token")
        needs_email = data.get("needs_email", False)
        print(f"✅ Admin login successful, needs_email: {needs_email}")
        session.headers.update({"Authorization": f"Bearer {admin_token}"})
    else:
        print(f"❌ Admin login failed: {response.status_code}")
        return
    
    # 3. Test set-email endpoint
    email_data = {
        "email": "newemail@gmail.com"
    }
    
    response = session.post(f"{API_BASE}/auth/set-email", json=email_data)
    if response.status_code == 200:
        print("✅ Set email endpoint works")
    else:
        print(f"❌ Set email failed: {response.status_code} - {response.text}")
    
    # 4. Create MMOD user
    mmod_data = {
        "username": "testmmod2",
        "password": "TestMmod@123",
        "email": "testmmod2@gmail.com",
        "role": "mmod"
    }
    
    response = session.post(f"{API_BASE}/auth/register", json=mmod_data)
    if response.status_code == 200 or (response.status_code == 400 and "already registered" in response.text):
        print("✅ MMOD user ready")
    else:
        print(f"❌ MMOD registration failed: {response.status_code}")
        return
    
    # 5. Login as MMOD
    session.headers.pop("Authorization", None)
    mmod_login = {
        "username": "testmmod2",
        "password": "TestMmod@123"
    }
    
    response = session.post(f"{API_BASE}/auth/login", json=mmod_login)
    if response.status_code == 200:
        data = response.json()
        mmod_token = data.get("access_token")
        print("✅ MMOD login successful")
        session.headers.update({"Authorization": f"Bearer {mmod_token}"})
    else:
        print(f"❌ MMOD login failed: {response.status_code}")
        return
    
    # 6. Test MMOD can update another user's email
    email_update_data = {
        "email": "updated@gmail.com"
    }
    
    response = session.patch(f"{API_BASE}/moderators/testadmin2/email", json=email_update_data)
    if response.status_code == 200:
        print("✅ MMOD can update another user's email")
    else:
        print(f"❌ MMOD email update failed: {response.status_code} - {response.text}")
    
    # 7. Test admin can view emails in moderator list
    session.headers["Authorization"] = f"Bearer {admin_token}"
    response = session.get(f"{API_BASE}/moderators")
    if response.status_code == 200:
        data = response.json()
        users_with_emails = [mod for mod in data if mod.get("email") is not None]
        if len(users_with_emails) > 0:
            print(f"✅ Admin can view emails ({len(users_with_emails)} users with emails)")
        else:
            print("❌ Admin cannot see emails")
    else:
        print(f"❌ Admin moderator list failed: {response.status_code}")
    
    # 8. Create regular moderator
    regular_data = {
        "username": "regularmod2",
        "password": "Regular@123",
        "email": "regularmod2@gmail.com",
        "role": "moderator"
    }
    
    session.headers.pop("Authorization", None)
    response = session.post(f"{API_BASE}/auth/register", json=regular_data)
    if response.status_code == 200 or (response.status_code == 400 and "already registered" in response.text):
        print("✅ Regular moderator ready")
    else:
        print(f"❌ Regular moderator registration failed: {response.status_code}")
        return
    
    # 9. Login as regular moderator
    regular_login = {
        "username": "regularmod2",
        "password": "Regular@123"
    }
    
    response = session.post(f"{API_BASE}/auth/login", json=regular_login)
    if response.status_code == 200:
        data = response.json()
        regular_token = data.get("access_token")
        print("✅ Regular moderator login successful")
        session.headers.update({"Authorization": f"Bearer {regular_token}"})
    else:
        print(f"❌ Regular moderator login failed: {response.status_code}")
        return
    
    # 10. Test non-admin cannot see emails
    response = session.get(f"{API_BASE}/moderators")
    if response.status_code == 200:
        data = response.json()
        users_with_emails = [mod for mod in data if mod.get("email") is not None]
        if len(users_with_emails) == 0:
            print("✅ Non-admin users cannot see emails")
        else:
            print(f"❌ Non-admin can see emails ({len(users_with_emails)} users with visible emails)")
    else:
        print(f"❌ Non-admin moderator list failed: {response.status_code}")
    
    print("\n🎉 Email assignment testing completed!")

if __name__ == "__main__":
    test_email_assignment()
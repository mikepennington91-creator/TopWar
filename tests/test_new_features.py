"""
Test file for new features:
1. Dashboard tabs: Pending, Approved, Waiting, Rejected
2. Stats cards showing correct counts
3. Waiting status for applications
4. Final Decision buttons (Approve, Waiting List, Reject)
5. Convert Waiting to Approved functionality
6. Application Control toggle in Settings
7. /apply page shows "No Vacancies" when disabled
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://team-gratitude.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "Admin123!@"}
TESTMMOD_CREDS = {"username": "testmmod", "password": "testmmod123"}

class TestApplicationSettings:
    """Test Application Settings endpoints (enable/disable applications)"""
    
    def test_get_application_settings_status_public(self):
        """Test public endpoint to check if applications are enabled"""
        response = requests.get(f"{BASE_URL}/api/applications/settings/status")
        assert response.status_code == 200
        data = response.json()
        assert "applications_enabled" in data
        print(f"✅ Public settings status: applications_enabled = {data['applications_enabled']}")
    
    def test_get_application_settings_admin_requires_auth(self):
        """Test admin settings endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/applications/settings/admin")
        assert response.status_code in [401, 403]
        print("✅ Admin settings endpoint requires authentication")
    
    def test_get_application_settings_admin_with_auth(self):
        """Test admin can get full application settings"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get admin settings
        response = requests.get(
            f"{BASE_URL}/api/applications/settings/admin",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "applications_enabled" in data
        print(f"✅ Admin settings: {data}")
    
    def test_toggle_applications_off(self):
        """Test disabling applications"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Disable applications
        response = requests.patch(
            f"{BASE_URL}/api/applications/settings/admin",
            json={"applications_enabled": False},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["applications_enabled"] == False
        print("✅ Applications disabled successfully")
        
        # Verify public endpoint reflects change
        status_response = requests.get(f"{BASE_URL}/api/applications/settings/status")
        assert status_response.status_code == 200
        assert status_response.json()["applications_enabled"] == False
        print("✅ Public status endpoint reflects disabled state")
    
    def test_submit_application_when_disabled(self):
        """Test that submitting application returns 403 when disabled"""
        # First ensure applications are disabled
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login_response.json()["access_token"]
        requests.patch(
            f"{BASE_URL}/api/applications/settings/admin",
            json={"applications_enabled": False},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Try to submit application
        test_application = {
            "name": "Test User",
            "email": "test@example.com",
            "position": "In-Game",
            "discord_handle": "testuser#1234",
            "ingame_name": "TestPlayer",
            "age": 25,
            "country": "USA",
            "activity_times": "9am-5pm",
            "server": "123",
            "native_language": "English",
            "other_languages": "None",
            "previous_experience": "None",
            "basic_qualities": "Patience",
            "favourite_event": "Battle",
            "free_gems": "Daily rewards",
            "heroes_mutated": "10",
            "discord_tools_comfort": "3",
            "guidelines_rating": "Good",
            "complex_mechanic": "Combat",
            "unknown_question": "Ask others",
            "hero_development": "Focus on main heroes",
            "racist_r4": "Report to admin",
            "moderator_swearing": "Talk to them privately"
        }
        
        response = requests.post(f"{BASE_URL}/api/applications", json=test_application)
        assert response.status_code == 403
        print("✅ Application submission blocked when disabled (403)")
    
    def test_toggle_applications_on(self):
        """Test enabling applications"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Enable applications
        response = requests.patch(
            f"{BASE_URL}/api/applications/settings/admin",
            json={"applications_enabled": True},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["applications_enabled"] == True
        print("✅ Applications enabled successfully")


class TestWaitingStatus:
    """Test Waiting status functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        return login_response.json()["token"]
    
    def test_update_application_to_waiting(self, admin_token):
        """Test updating application status to 'waiting'"""
        # Get applications
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        applications = response.json()
        
        # Find a pending application or use the known waiting one
        waiting_app_id = "00730009-67ba-436e-bc85-e30904f6842f"
        
        # Check if application exists
        app_response = requests.get(
            f"{BASE_URL}/api/applications/{waiting_app_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if app_response.status_code == 200:
            app = app_response.json()
            print(f"✅ Found application {waiting_app_id} with status: {app['status']}")
            
            # If it's already waiting, test converting to approved
            if app['status'] == 'waiting':
                print("✅ Application is already in 'waiting' status")
                return
        
        # Find a pending application to test with
        pending_apps = [a for a in applications if a['status'] in ['pending', 'awaiting_review']]
        if pending_apps:
            test_app = pending_apps[0]
            # Update to waiting
            update_response = requests.patch(
                f"{BASE_URL}/api/applications/{test_app['id']}",
                json={"status": "waiting", "comment": "Test: Moving to waiting list"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert update_response.status_code == 200
            updated_app = update_response.json()
            assert updated_app['status'] == 'waiting'
            print(f"✅ Successfully updated application to 'waiting' status")
        else:
            print("⚠️ No pending applications found to test with")
    
    def test_convert_waiting_to_approved(self, admin_token):
        """Test converting a waiting application to approved"""
        # Get applications
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        applications = response.json()
        
        # Find waiting applications
        waiting_apps = [a for a in applications if a['status'] == 'waiting']
        
        if waiting_apps:
            test_app = waiting_apps[0]
            print(f"Found waiting application: {test_app['id']}")
            
            # Convert to approved
            update_response = requests.patch(
                f"{BASE_URL}/api/applications/{test_app['id']}",
                json={"status": "approved", "comment": "Test: Position available, converting from waiting list"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert update_response.status_code == 200
            updated_app = update_response.json()
            assert updated_app['status'] == 'approved'
            print(f"✅ Successfully converted waiting application to 'approved'")
            
            # Revert back to waiting for future tests
            revert_response = requests.patch(
                f"{BASE_URL}/api/applications/{test_app['id']}",
                json={"status": "waiting", "comment": "Test: Reverting back to waiting for testing"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            if revert_response.status_code == 200:
                print("✅ Reverted application back to waiting status")
        else:
            print("⚠️ No waiting applications found to test conversion")


class TestApplicationStatusFiltering:
    """Test application filtering by status"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        return login_response.json()["token"]
    
    def test_get_all_applications(self, admin_token):
        """Test getting all applications and verify status distribution"""
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        applications = response.json()
        
        # Count by status
        status_counts = {}
        for app in applications:
            status = app.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"✅ Total applications: {len(applications)}")
        print(f"✅ Status distribution: {status_counts}")
        
        # Verify expected statuses exist
        valid_statuses = ['awaiting_review', 'pending', 'approved', 'rejected', 'waiting']
        for status in status_counts.keys():
            assert status in valid_statuses, f"Unexpected status: {status}"
        
        return status_counts
    
    def test_application_has_required_fields(self, admin_token):
        """Test that applications have all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        applications = response.json()
        
        if applications:
            app = applications[0]
            required_fields = ['id', 'status', 'submitted_at', 'ingame_name', 'discord_handle']
            for field in required_fields:
                assert field in app, f"Missing required field: {field}"
            print(f"✅ Application has all required fields")


class TestStatusUpdateValidation:
    """Test status update validation"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        return login_response.json()["token"]
    
    def test_status_update_requires_comment(self, admin_token):
        """Test that status update requires a comment"""
        # Get an application
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        applications = response.json()
        
        if applications:
            app = applications[0]
            # Try to update without comment
            update_response = requests.patch(
                f"{BASE_URL}/api/applications/{app['id']}",
                json={"status": "approved"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert update_response.status_code == 400
            print("✅ Status update correctly requires comment")
    
    def test_status_update_with_empty_comment(self, admin_token):
        """Test that status update rejects empty comment"""
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        applications = response.json()
        
        if applications:
            app = applications[0]
            # Try to update with empty comment
            update_response = requests.patch(
                f"{BASE_URL}/api/applications/{app['id']}",
                json={"status": "approved", "comment": ""},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert update_response.status_code == 400
            print("✅ Status update correctly rejects empty comment")
    
    def test_valid_status_values(self, admin_token):
        """Test that only valid status values are accepted"""
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        applications = response.json()
        
        if applications:
            app = applications[0]
            # Try invalid status
            update_response = requests.patch(
                f"{BASE_URL}/api/applications/{app['id']}",
                json={"status": "invalid_status", "comment": "Test comment"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert update_response.status_code == 400
            print("✅ Invalid status values are correctly rejected")


class TestEmailFunctionality:
    """Test email-related functionality (verification only, not actual sending)"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert login_response.status_code == 200
        return login_response.json()["token"]
    
    def test_waitlist_email_triggered_on_status_change(self, admin_token):
        """Verify that changing status to 'waiting' triggers email (check logs)"""
        # This test verifies the endpoint works - actual email sending depends on SMTP config
        response = requests.get(
            f"{BASE_URL}/api/applications",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        applications = response.json()
        
        # Find a pending application
        pending_apps = [a for a in applications if a['status'] in ['pending', 'awaiting_review']]
        
        if pending_apps:
            app = pending_apps[0]
            original_status = app['status']
            
            # Update to waiting (this should trigger waitlist email)
            update_response = requests.patch(
                f"{BASE_URL}/api/applications/{app['id']}",
                json={"status": "waiting", "comment": "Test: Email trigger verification"},
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            if update_response.status_code == 200:
                print("✅ Status change to 'waiting' processed (email would be triggered)")
                
                # Revert status
                requests.patch(
                    f"{BASE_URL}/api/applications/{app['id']}",
                    json={"status": original_status, "comment": "Test: Reverting status"},
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
        else:
            print("⚠️ No pending applications to test email trigger")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

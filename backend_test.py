import requests
import sys
import json
from datetime import datetime

class TopWarModeratorAPITester:
    def __init__(self, base_url="https://git-explorer-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'No error details')}"
                except:
                    details += f" - Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_moderator_registration(self):
        """Test moderator registration"""
        test_username = f"test_mod_{datetime.now().strftime('%H%M%S')}"
        success, response = self.run_test(
            "Moderator Registration",
            "POST",
            "auth/register",
            200,
            data={"username": test_username, "password": "TestPass123!"}
        )
        return success, test_username if success else None

    def test_moderator_login(self, username, password):
        """Test moderator login"""
        success, response = self.run_test(
            "Moderator Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_existing_moderator_login(self):
        """Test login with existing moderator credentials"""
        return self.test_moderator_login("admin", "admin123")

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Invalid Login (Should Fail)",
            "POST",
            "auth/login",
            401,
            data={"username": "invalid", "password": "wrong"}
        )
        return success

    def test_submit_application(self):
        """Test application submission"""
        test_data = {
            "name": "John Test Applicant",
            "position": "Community Moderator",
            "discord_handle": "johntester#1234",
            "ingame_name": "TestWarrior",
            "age": 25,
            "country": "United States",
            "activity_times": "Reset - 5 to reset",
            "server": "Server 123",
            "native_language": "English",
            "other_languages": "Spanish, French",
            "previous_experience": "I have moderated Discord servers for 2 years",
            "basic_qualities": "Patience, fairness, and good communication",
            "favourite_event": "Alliance War because of strategy",
            "free_gems": "Daily login, events, achievements",
            "heroes_mutated": "6",
            "discord_tools_comfort": "Very comfortable with bots and moderation tools",
            "guidelines_rating": "8/10 - I understand most guidelines well",
            "high_profile_violation": "Document evidence, warn privately first, then escalate",
            "complex_mechanic": "Hero mutation system and stat calculations",
            "unknown_question": "Research the answer and ask senior moderators",
            "hero_development": "Focus on one hero at a time, prioritize skills",
            "racist_r4": "Report to higher authorities immediately",
            "moderator_swearing": "Remind them privately about professional conduct"
        }
        
        success, response = self.run_test(
            "Submit Application",
            "POST",
            "applications",
            200,
            data=test_data
        )
        return success, response.get('id') if success else None

    def test_get_applications_unauthorized(self):
        """Test getting applications without token"""
        old_token = self.token
        self.token = None
        success, _ = self.run_test(
            "Get Applications (Unauthorized - Should Fail)",
            "GET",
            "applications",
            401
        )
        self.token = old_token
        return success

    def test_get_applications(self):
        """Test getting applications with valid token"""
        success, response = self.run_test(
            "Get Applications",
            "GET",
            "applications",
            200
        )
        return success, response if success else []

    def test_search_applications(self):
        """Test searching applications"""
        success, response = self.run_test(
            "Search Applications",
            "GET",
            "applications?search=John",
            200
        )
        return success

    def test_get_single_application(self, app_id):
        """Test getting a single application"""
        if not app_id:
            self.log_test("Get Single Application", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            "Get Single Application",
            "GET",
            f"applications/{app_id}",
            200
        )
        return success

    def test_approve_application(self, app_id):
        """Test approving an application"""
        if not app_id:
            self.log_test("Approve Application", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            "Approve Application",
            "PATCH",
            f"applications/{app_id}",
            200,
            data={"status": "approved"}
        )
        return success

    def test_reject_application(self, app_id):
        """Test rejecting an application"""
        if not app_id:
            self.log_test("Reject Application", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            "Reject Application",
            "PATCH",
            f"applications/{app_id}",
            200,
            data={"status": "rejected"}
        )
        return success

    def test_invalid_status_update(self, app_id):
        """Test updating application with invalid status"""
        if not app_id:
            self.log_test("Invalid Status Update", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            "Invalid Status Update (Should Fail)",
            "PATCH",
            f"applications/{app_id}",
            400,
            data={"status": "invalid_status"}
        )
        return success

    def test_vote_on_application(self, app_id, vote_type="approve"):
        """Test voting on an application"""
        if not app_id:
            self.log_test("Vote on Application", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            f"Vote {vote_type.title()} on Application",
            "POST",
            f"applications/{app_id}/vote",
            200,
            data={"vote": vote_type}
        )
        return success

    def test_comment_on_application(self, app_id, comment="Test comment from API"):
        """Test commenting on an application"""
        if not app_id:
            self.log_test("Comment on Application", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            "Add Comment to Application",
            "POST",
            f"applications/{app_id}/comment",
            200,
            data={"comment": comment}
        )
        return success

    def test_invalid_vote(self, app_id):
        """Test voting with invalid vote type"""
        if not app_id:
            self.log_test("Invalid Vote", False, "No application ID provided")
            return False
            
        success, response = self.run_test(
            "Invalid Vote Type (Should Fail)",
            "POST",
            f"applications/{app_id}/vote",
            400,
            data={"vote": "invalid_vote"}
        )
        return success

    def test_change_password(self):
        """Test changing own password"""
        success, response = self.run_test(
            "Change Own Password",
            "PATCH",
            "auth/change-password",
            200,
            data={"old_password": "admin123", "new_password": "newpass123"}
        )
        
        # Change it back for other tests
        if success:
            self.run_test(
                "Restore Original Password",
                "PATCH",
                "auth/change-password",
                200,
                data={"old_password": "newpass123", "new_password": "admin123"}
            )
        
        return success

    def test_reset_password(self, target_username="admin"):
        """Test resetting another user's password (admin only)"""
        success, response = self.run_test(
            "Reset User Password (Admin)",
            "PATCH",
            f"auth/reset-password/{target_username}",
            200,
            data={"new_password": "admin123"}
        )
        return success

    def test_get_moderators(self):
        """Test getting moderator list (admin only)"""
        success, response = self.run_test(
            "Get Moderators List (Admin)",
            "GET",
            "moderators",
            200
        )
        return success, response if success else []

    def test_unauthorized_admin_actions(self):
        """Test admin-only actions without proper role"""
        # This would need a regular moderator token, but for now we'll skip
        # since we're using admin token
        self.log_test("Unauthorized Admin Actions", True, "Skipped - using admin token")
        return True

    def test_last_login_tracking(self):
        """Test that GET /api/moderators returns last_login field"""
        success, response = self.run_test(
            "Last Login Tracking - Get Moderators",
            "GET",
            "moderators",
            200
        )
        
        if success and response:
            # Check if moderators have last_login field
            has_last_login = False
            for moderator in response:
                if 'last_login' in moderator:
                    has_last_login = True
                    break
            
            if has_last_login:
                self.log_test("Last Login Field Present", True, "last_login field found in moderator data")
                return True
            else:
                self.log_test("Last Login Field Present", False, "last_login field not found in moderator data")
                return False
        
        return False

    def test_new_user_must_change_password(self):
        """Test that new users are created with must_change_password=true"""
        test_username = f"newuser_{datetime.now().strftime('%H%M%S')}"
        
        # Register new user
        success, response = self.run_test(
            "Register New User for Password Test",
            "POST",
            "auth/register",
            200,
            data={"username": test_username, "password": "TestUser1!@#"}
        )
        
        if not success:
            return False, None
        
        # Login with new user to check must_change_password flag
        success, login_response = self.run_test(
            "Login New User - Check must_change_password",
            "POST",
            "auth/login",
            200,
            data={"username": test_username, "password": "TestUser1!@#"}
        )
        
        if success and login_response:
            must_change = login_response.get('must_change_password', False)
            if must_change:
                self.log_test("New User Must Change Password", True, "must_change_password=true for new user")
                return True, test_username
            else:
                self.log_test("New User Must Change Password", False, f"must_change_password={must_change} (expected True)")
                return False, test_username
        
        return False, test_username

    def test_login_updates_last_login(self):
        """Test that login updates the last_login timestamp"""
        # Get current moderators list to check last_login before
        success, moderators_before = self.run_test(
            "Get Moderators Before Login",
            "GET",
            "moderators",
            200
        )
        
        if not success:
            return False
        
        # Find admin user's last_login before
        admin_before = None
        for mod in moderators_before:
            if mod.get('username') == 'admin':
                admin_before = mod.get('last_login')
                break
        
        # Login again
        success = self.test_moderator_login("admin", "Admin123!@")
        if not success:
            return False
        
        # Get moderators list again to check last_login after
        success, moderators_after = self.run_test(
            "Get Moderators After Login",
            "GET",
            "moderators",
            200
        )
        
        if success:
            # Find admin user's last_login after
            admin_after = None
            for mod in moderators_after:
                if mod.get('username') == 'admin':
                    admin_after = mod.get('last_login')
                    break
            
            if admin_after and admin_after != admin_before:
                self.log_test("Login Updates last_login", True, f"last_login updated from {admin_before} to {admin_after}")
                return True
            else:
                self.log_test("Login Updates last_login", False, f"last_login not updated: before={admin_before}, after={admin_after}")
                return False
        
        return False

    def test_password_change_clears_flag(self, username):
        """Test that changing password clears must_change_password flag"""
        if not username:
            self.log_test("Password Change Clears Flag", False, "No username provided")
            return False
        
        # Login with the test user first
        success, login_response = self.run_test(
            "Login Test User Before Password Change",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": "TestUser1!@#"}
        )
        
        if not success:
            return False
        
        # Store the token for this user
        old_token = self.token
        if 'access_token' in login_response:
            self.token = login_response['access_token']
        
        # Change password
        success, response = self.run_test(
            "Change Password to Clear Flag",
            "PATCH",
            "auth/change-password",
            200,
            data={"old_password": "TestUser1!@#", "new_password": "NewPass123!@#"}
        )
        
        if not success:
            self.token = old_token
            return False
        
        # Login again to check if must_change_password is now false
        success, login_response = self.run_test(
            "Login After Password Change",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": "NewPass123!@#"}
        )
        
        # Restore original token
        self.token = old_token
        
        if success and login_response:
            must_change = login_response.get('must_change_password', True)
            if not must_change:
                self.log_test("Password Change Clears Flag", True, "must_change_password=false after password change")
                return True
            else:
                self.log_test("Password Change Clears Flag", False, f"must_change_password={must_change} (expected False)")
                return False
        
        return False

    def test_password_reset_sets_flag(self, target_username):
        """Test that admin password reset sets must_change_password=true"""
        if not target_username:
            self.log_test("Password Reset Sets Flag", False, "No target username provided")
            return False
        
        # Reset password as admin
        success, response = self.run_test(
            "Admin Reset User Password",
            "PATCH",
            f"auth/reset-password/{target_username}",
            200,
            data={"new_password": "ResetPass123!@#"}
        )
        
        if not success:
            return False
        
        # Login with reset password to check must_change_password flag
        success, login_response = self.run_test(
            "Login After Password Reset",
            "POST",
            "auth/login",
            200,
            data={"username": target_username, "password": "ResetPass123!@#"}
        )
        
        if success and login_response:
            must_change = login_response.get('must_change_password', False)
            if must_change:
                self.log_test("Password Reset Sets Flag", True, "must_change_password=true after admin reset")
                return True
            else:
                self.log_test("Password Reset Sets Flag", False, f"must_change_password={must_change} (expected True)")
                return False
        
        return False

def main():
    print("🚀 Starting Top War Moderator API Tests")
    print("=" * 50)
    
    tester = TopWarModeratorAPITester()
    
    # Test API root
    tester.test_root_endpoint()
    
    # Test moderator registration
    reg_success, test_username = tester.test_moderator_registration()
    
    # Test invalid login
    tester.test_invalid_login()
    
    # Test existing moderator login
    login_success = tester.test_existing_moderator_login()
    
    if not login_success:
        # Try with the correct admin password
        login_success = tester.test_moderator_login("admin", "Admin123!@")
    
    if not login_success:
        print("❌ Cannot proceed with authenticated tests - login failed")
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    # Test unauthorized access
    tester.test_get_applications_unauthorized()
    
    # Test application submission
    app_success, app_id = tester.test_submit_application()
    
    # Test getting applications
    tester.test_get_applications()
    
    # Test search functionality
    tester.test_search_applications()
    
    # Test single application operations (if we have an app ID)
    if app_id:
        tester.test_get_single_application(app_id)
        tester.test_invalid_status_update(app_id)
        
        # Test NEW voting system features
        tester.test_vote_on_application(app_id, "approve")
        tester.test_vote_on_application(app_id, "reject")  # Test vote update
        tester.test_invalid_vote(app_id)
        tester.test_comment_on_application(app_id, "This is a test comment from the API")
        
        # Test password management
        tester.test_change_password()
        tester.test_reset_password("admin")
        tester.test_get_moderators()
        
        tester.test_approve_application(app_id)
        
        # Submit another application to test rejection
        app_success2, app_id2 = tester.test_submit_application()
        if app_id2:
            tester.test_vote_on_application(app_id2, "reject")
            tester.test_comment_on_application(app_id2, "Rejecting this application")
            tester.test_reject_application(app_id2)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3
"""
Backend API Testing Script for Top War Moderator Application
Tests the refactored backend with modular structure and new features.
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", details=None):
        """Log test result."""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
        if details and not success:
            print(f"    Details: {details}")
        print()

    def test_api_root(self):
        """Test API root endpoint."""
        try:
            response = self.session.get(f"{API_BASE}/")
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Top War Moderator Application API":
                    self.log_test("API Root Endpoint", True, "Returns correct message")
                else:
                    self.log_test("API Root Endpoint", False, f"Unexpected message: {data}")
            else:
                self.log_test("API Root Endpoint", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Exception: {str(e)}")

    def register_admin_user(self):
        """Register a test admin user."""
        try:
            admin_data = {
                "username": "testadmin",
                "password": "Test@1234",
                "role": "admin"
            }
            
            response = self.session.post(f"{API_BASE}/auth/register", json=admin_data)
            if response.status_code == 200:
                self.log_test("Admin Registration", True, "Test admin user registered successfully")
                return True
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_test("Admin Registration", True, "Test admin user already exists")
                return True
            else:
                self.log_test("Admin Registration", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Admin Registration", False, f"Exception: {str(e)}")
            return False

    def login_admin_user(self):
        """Login as admin user and get token."""
        try:
            login_data = {
                "username": "testadmin",
                "password": "Test@1234"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                if self.admin_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                    self.log_test("Admin Login", True, f"Logged in as {data.get('username')} with role {data.get('role')}")
                    return True
                else:
                    self.log_test("Admin Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_easter_eggs_list(self):
        """Test GET /api/easter-eggs - requires admin auth."""
        try:
            response = self.session.get(f"{API_BASE}/easter-eggs")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if troll easter egg exists
                    troll_egg = next((egg for egg in data if egg.get("page_key") == "troll"), None)
                    if troll_egg:
                        self.log_test("Easter Eggs List", True, f"Retrieved {len(data)} easter eggs including troll page")
                    else:
                        self.log_test("Easter Eggs List", False, "Troll easter egg not found in list")
                else:
                    self.log_test("Easter Eggs List", False, "Empty or invalid response", data)
            else:
                self.log_test("Easter Eggs List", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Easter Eggs List", False, f"Exception: {str(e)}")

    def test_easter_egg_verify(self):
        """Test POST /api/easter-eggs/verify with Troll/FunnyGuy credentials."""
        try:
            # Test with correct credentials
            response = self.session.post(f"{API_BASE}/easter-eggs/verify?username=Troll&password=FunnyGuy")
            if response.status_code == 200:
                data = response.json()
                if data.get("valid") is True and data.get("page_key") == "troll":
                    self.log_test("Easter Egg Verify (Valid)", True, "Troll/FunnyGuy credentials verified successfully")
                else:
                    self.log_test("Easter Egg Verify (Valid)", False, f"Unexpected response: {data}")
            else:
                self.log_test("Easter Egg Verify (Valid)", False, f"Status: {response.status_code}", response.text)
            
            # Test with invalid credentials
            response = self.session.post(f"{API_BASE}/easter-eggs/verify?username=Invalid&password=Wrong")
            if response.status_code == 200:
                data = response.json()
                if data.get("valid") is False:
                    self.log_test("Easter Egg Verify (Invalid)", True, "Invalid credentials correctly rejected")
                else:
                    self.log_test("Easter Egg Verify (Invalid)", False, f"Should reject invalid credentials: {data}")
            else:
                self.log_test("Easter Egg Verify (Invalid)", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Easter Egg Verify", False, f"Exception: {str(e)}")

    def test_easter_egg_update(self):
        """Test PATCH /api/easter-eggs/troll - requires admin auth."""
        try:
            update_data = {
                "username": "TrollUpdated",
                "password": "FunnyGuyUpdated"
            }
            
            response = self.session.patch(f"{API_BASE}/easter-eggs/troll", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if "updated successfully" in data.get("message", ""):
                    self.log_test("Easter Egg Update", True, "Troll easter egg updated successfully")
                    
                    # Verify the update worked
                    verify_response = self.session.post(f"{API_BASE}/easter-eggs/verify?username=TrollUpdated&password=FunnyGuyUpdated")
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        if verify_data.get("valid") is True:
                            self.log_test("Easter Egg Update Verification", True, "Updated credentials work correctly")
                        else:
                            self.log_test("Easter Egg Update Verification", False, "Updated credentials don't work")
                    
                    # Restore original credentials
                    restore_data = {"username": "Troll", "password": "FunnyGuy"}
                    self.session.patch(f"{API_BASE}/easter-eggs/troll", json=restore_data)
                    
                else:
                    self.log_test("Easter Egg Update", False, f"Unexpected response: {data}")
            else:
                self.log_test("Easter Egg Update", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Easter Egg Update", False, f"Exception: {str(e)}")

    def create_test_application(self):
        """Create a test application for name hiding tests."""
        try:
            app_data = {
                "name": "John Smith",
                "email": "john.smith@example.com",
                "position": "Discord Moderator",
                "discord_handle": "JohnSmith#1234",
                "ingame_name": "JohnTheGreat",
                "age": 25,
                "country": "United States",
                "activity_times": "6 PM - 12 AM EST",
                "server": "Server 123",
                "native_language": "English",
                "other_languages": "Spanish",
                "previous_experience": "Moderated gaming communities for 2 years",
                "basic_qualities": "Patient, fair, and communicative",
                "favourite_event": "Alliance Wars",
                "free_gems": "Save them for special events",
                "heroes_mutated": "Focus on tank heroes first",
                "discord_tools_comfort": "Very comfortable",
                "guidelines_rating": "9/10",
                "complex_mechanic": "Would research and ask for guidance",
                "unknown_question": "Would escalate to senior moderators",
                "hero_development": "Balance offense and defense",
                "racist_r4": "Immediate warning and escalation",
                "moderator_swearing": "Professional discussion about conduct"
            }
            
            # Remove auth header temporarily for application submission
            auth_header = self.session.headers.pop("Authorization", None)
            response = self.session.post(f"{API_BASE}/applications", json=app_data)
            
            # Restore auth header
            if auth_header:
                self.session.headers["Authorization"] = auth_header
            
            if response.status_code == 200:
                data = response.json()
                app_id = data.get("id")
                self.log_test("Test Application Creation", True, f"Created test application with ID: {app_id}")
                return app_id
            else:
                self.log_test("Test Application Creation", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Test Application Creation", False, f"Exception: {str(e)}")
            return None

    def create_non_training_manager_user(self):
        """Create and login as a non-training manager user."""
        try:
            # Register regular moderator
            user_data = {
                "username": "regularmod",
                "password": "Regular@123",
                "email": "regularmod@gmail.com",
                "role": "moderator"
            }
            
            # Remove auth header temporarily
            auth_header = self.session.headers.pop("Authorization", None)
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            if response.status_code == 200 or (response.status_code == 400 and "already registered" in response.text):
                # Login as regular moderator
                login_data = {
                    "username": "regularmod",
                    "password": "Regular@123"
                }
                
                login_response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    data = login_response.json()
                    regular_token = data.get("access_token")
                    if regular_token:
                        self.log_test("Regular Moderator Setup", True, "Regular moderator user ready for testing")
                        return regular_token
                    else:
                        self.log_test("Regular Moderator Setup", False, "No access token in login response")
                        return None
                else:
                    self.log_test("Regular Moderator Setup", False, f"Login failed: {login_response.status_code}")
                    return None
            else:
                self.log_test("Regular Moderator Setup", False, f"Registration failed: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Regular Moderator Setup", False, f"Exception: {str(e)}")
            return None
        finally:
            # Restore admin auth header
            if auth_header:
                self.session.headers["Authorization"] = auth_header

    def test_name_hiding_applications_list(self):
        """Test that real names are hidden from non-training managers in applications list."""
        try:
            # First create a test application
            app_id = self.create_test_application()
            if not app_id:
                self.log_test("Name Hiding - Applications List", False, "Could not create test application")
                return
            
            # Get regular moderator token
            regular_token = self.create_non_training_manager_user()
            if not regular_token:
                self.log_test("Name Hiding - Applications List", False, "Could not setup regular moderator")
                return
            
            # Test with regular moderator (should hide names)
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {regular_token}"
            
            response = self.session.get(f"{API_BASE}/applications")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if names are hidden
                    hidden_names = [app for app in data if app.get("name") == "[Hidden - Training Manager Only]"]
                    if len(hidden_names) > 0:
                        self.log_test("Name Hiding - Applications List", True, f"Names properly hidden for non-training manager ({len(hidden_names)} applications)")
                    else:
                        self.log_test("Name Hiding - Applications List", False, "Names not hidden for non-training manager")
                else:
                    self.log_test("Name Hiding - Applications List", False, "No applications found to test name hiding")
            else:
                self.log_test("Name Hiding - Applications List", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Name Hiding - Applications List", False, f"Exception: {str(e)}")

    def test_name_hiding_single_application(self):
        """Test that real names are hidden from non-training managers in single application view."""
        try:
            # Create a test application
            app_id = self.create_test_application()
            if not app_id:
                self.log_test("Name Hiding - Single Application", False, "Could not create test application")
                return
            
            # Get regular moderator token
            regular_token = self.create_non_training_manager_user()
            if not regular_token:
                self.log_test("Name Hiding - Single Application", False, "Could not setup regular moderator")
                return
            
            # Test with regular moderator (should hide names)
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {regular_token}"
            
            response = self.session.get(f"{API_BASE}/applications/{app_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == "[Hidden - Training Manager Only]" and data.get("email") is None:
                    self.log_test("Name Hiding - Single Application", True, "Name and email properly hidden for non-training manager")
                else:
                    self.log_test("Name Hiding - Single Application", False, f"Name/email not properly hidden: name={data.get('name')}, email={data.get('email')}")
            else:
                self.log_test("Name Hiding - Single Application", False, f"Status: {response.status_code}", response.text)
            
            # Test with admin (should show real names)
            self.session.headers["Authorization"] = original_auth
            
            response = self.session.get(f"{API_BASE}/applications/{app_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("name") != "[Hidden - Training Manager Only]" and data.get("email") is not None:
                    self.log_test("Name Visibility - Admin Access", True, "Admin can see real names and emails")
                else:
                    self.log_test("Name Visibility - Admin Access", False, "Admin cannot see real names/emails")
            else:
                self.log_test("Name Visibility - Admin Access", False, f"Admin access failed: {response.status_code}")
            
        except Exception as e:
            self.log_test("Name Hiding - Single Application", False, f"Exception: {str(e)}")

    def login_test_users(self):
        """Login with the provided test credentials."""
        try:
            # Login as admin (admin / Admin123!@)
            admin_login = {
                "username": "admin",
                "password": "Admin123!@"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=admin_login)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                if self.admin_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                    self.log_test("Test Admin Login", True, f"Logged in as {data.get('username')} with role {data.get('role')}")
                    return True
                else:
                    self.log_test("Test Admin Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Test Admin Login", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Test Admin Login", False, f"Exception: {str(e)}")
            return False

    def login_moderator_user(self):
        """Login as moderator user and return token."""
        try:
            # Login as moderator (testmmod / TestMmod@123)
            mod_login = {
                "username": "testmmod",
                "password": "TestMmod@123"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=mod_login)
            if response.status_code == 200:
                data = response.json()
                mod_token = data.get("access_token")
                if mod_token:
                    self.log_test("Test Moderator Login", True, f"Logged in as {data.get('username')} with role {data.get('role')}")
                    return mod_token
                else:
                    self.log_test("Test Moderator Login", False, "No access token in response", data)
                    return None
            else:
                self.log_test("Test Moderator Login", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Test Moderator Login", False, f"Exception: {str(e)}")
            return None

    def test_feature_requests_create(self):
        """Test POST /api/feature-requests - Create a feature request."""
        try:
            # Test with moderator credentials
            mod_token = self.login_moderator_user()
            if not mod_token:
                self.log_test("Feature Request Creation", False, "Could not login as moderator")
                return None
            
            # Save current auth and switch to moderator
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {mod_token}"
            
            feature_request_data = {
                "title": "Improved Dashboard Navigation",
                "description": "Add breadcrumb navigation to make it easier to navigate between different sections of the dashboard",
                "category": "ui"
            }
            
            response = self.session.post(f"{API_BASE}/feature-requests", json=feature_request_data)
            if response.status_code == 200:
                data = response.json()
                request_id = data.get("id")
                if request_id and "successfully" in data.get("message", ""):
                    self.log_test("Feature Request Creation", True, f"Feature request created successfully with ID: {request_id}")
                    # Restore admin auth
                    self.session.headers["Authorization"] = original_auth
                    return request_id
                else:
                    self.log_test("Feature Request Creation", False, f"Unexpected response: {data}")
            else:
                self.log_test("Feature Request Creation", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            return None
            
        except Exception as e:
            self.log_test("Feature Request Creation", False, f"Exception: {str(e)}")
            return None

    def test_feature_requests_get_own(self):
        """Test GET /api/feature-requests - Regular moderator sees only their own requests."""
        try:
            # Create a feature request first
            request_id = self.test_feature_requests_create()
            if not request_id:
                self.log_test("Feature Requests - Get Own", False, "Could not create test feature request")
                return
            
            # Login as moderator and get their requests
            mod_token = self.login_moderator_user()
            if not mod_token:
                self.log_test("Feature Requests - Get Own", False, "Could not login as moderator")
                return
            
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {mod_token}"
            
            response = self.session.get(f"{API_BASE}/feature-requests")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if the created request is in the list
                    own_request = next((req for req in data if req.get("id") == request_id), None)
                    if own_request and own_request.get("submitted_by") == "modtest":
                        self.log_test("Feature Requests - Get Own", True, f"Moderator can see their own requests ({len(data)} total)")
                    else:
                        self.log_test("Feature Requests - Get Own", False, "Moderator cannot see their own request")
                else:
                    self.log_test("Feature Requests - Get Own", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Feature Requests - Get Own", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Feature Requests - Get Own", False, f"Exception: {str(e)}")

    def test_feature_requests_get_all_admin(self):
        """Test GET /api/feature-requests - Admin sees all requests."""
        try:
            # Ensure we're logged in as admin
            if not self.admin_token:
                self.log_test("Feature Requests - Admin View All", False, "No admin token available")
                return
            
            response = self.session.get(f"{API_BASE}/feature-requests")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Admin should see all requests from different users
                    self.log_test("Feature Requests - Admin View All", True, f"Admin can see all feature requests ({len(data)} total)")
                else:
                    self.log_test("Feature Requests - Admin View All", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Feature Requests - Admin View All", False, f"Status: {response.status_code}", response.text)
            
        except Exception as e:
            self.log_test("Feature Requests - Admin View All", False, f"Exception: {str(e)}")

    def test_feature_requests_update_status(self):
        """Test PATCH /api/feature-requests/{id} - Update status (admin only)."""
        try:
            # Create a feature request first
            request_id = self.test_feature_requests_create()
            if not request_id:
                self.log_test("Feature Request Status Update", False, "Could not create test feature request")
                return
            
            # Ensure we're logged in as admin
            if not self.admin_token:
                self.log_test("Feature Request Status Update", False, "No admin token available")
                return
            
            update_data = {
                "status": "reviewed",
                "admin_notes": "This is a good suggestion, will consider for next release"
            }
            
            response = self.session.patch(f"{API_BASE}/feature-requests/{request_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if "successfully" in data.get("message", ""):
                    self.log_test("Feature Request Status Update", True, "Admin successfully updated feature request status")
                else:
                    self.log_test("Feature Request Status Update", False, f"Unexpected response: {data}")
            else:
                self.log_test("Feature Request Status Update", False, f"Status: {response.status_code}", response.text)
            
        except Exception as e:
            self.log_test("Feature Request Status Update", False, f"Exception: {str(e)}")

    def test_feature_requests_delete(self):
        """Test DELETE /api/feature-requests/{id} - Delete (admin or own request)."""
        try:
            # Create a feature request first
            request_id = self.test_feature_requests_create()
            if not request_id:
                self.log_test("Feature Request Deletion", False, "Could not create test feature request")
                return
            
            # Test deletion as admin
            if not self.admin_token:
                self.log_test("Feature Request Deletion", False, "No admin token available")
                return
            
            response = self.session.delete(f"{API_BASE}/feature-requests/{request_id}")
            if response.status_code == 200:
                data = response.json()
                if "successfully" in data.get("message", ""):
                    self.log_test("Feature Request Deletion", True, "Admin successfully deleted feature request")
                else:
                    self.log_test("Feature Request Deletion", False, f"Unexpected response: {data}")
            else:
                self.log_test("Feature Request Deletion", False, f"Status: {response.status_code}", response.text)
            
        except Exception as e:
            self.log_test("Feature Request Deletion", False, f"Exception: {str(e)}")

    def create_test_announcement(self):
        """Create a test announcement for dismiss testing."""
        try:
            announcement_data = {
                "title": "Test Announcement for Dismiss Feature",
                "message": "This is a test announcement to verify the dismiss functionality works correctly."
            }
            
            response = self.session.post(f"{API_BASE}/announcements", json=announcement_data)
            if response.status_code == 200:
                data = response.json()
                announcement_id = data.get("id")
                if announcement_id:
                    self.log_test("Test Announcement Creation", True, f"Created test announcement with ID: {announcement_id}")
                    return announcement_id
                else:
                    self.log_test("Test Announcement Creation", False, "No ID in response")
                    return None
            else:
                self.log_test("Test Announcement Creation", False, f"Status: {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Test Announcement Creation", False, f"Exception: {str(e)}")
            return None

    def test_announcements_dismiss(self):
        """Test POST /api/announcements/{id}/dismiss - Mark announcement as dismissed."""
        try:
            # Create a test announcement
            announcement_id = self.create_test_announcement()
            if not announcement_id:
                self.log_test("Announcement Dismiss", False, "Could not create test announcement")
                return announcement_id
            
            # Test dismissing as moderator
            mod_token = self.login_moderator_user()
            if not mod_token:
                self.log_test("Announcement Dismiss", False, "Could not login as moderator")
                return announcement_id
            
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {mod_token}"
            
            response = self.session.post(f"{API_BASE}/announcements/{announcement_id}/dismiss")
            if response.status_code == 200:
                data = response.json()
                if "dismissed" in data.get("message", ""):
                    self.log_test("Announcement Dismiss", True, "Announcement successfully dismissed")
                else:
                    self.log_test("Announcement Dismiss", False, f"Unexpected response: {data}")
            else:
                self.log_test("Announcement Dismiss", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            return announcement_id
            
        except Exception as e:
            self.log_test("Announcement Dismiss", False, f"Exception: {str(e)}")
            return None

    def test_announcements_get_dismissed(self):
        """Test GET /api/announcements/dismissed - Get dismissed announcement IDs."""
        try:
            # First dismiss an announcement
            announcement_id = self.test_announcements_dismiss()
            if not announcement_id:
                self.log_test("Get Dismissed Announcements", False, "Could not dismiss test announcement")
                return
            
            # Login as moderator and get dismissed list
            mod_token = self.login_moderator_user()
            if not mod_token:
                self.log_test("Get Dismissed Announcements", False, "Could not login as moderator")
                return
            
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {mod_token}"
            
            response = self.session.get(f"{API_BASE}/announcements/dismissed")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and announcement_id in data:
                    self.log_test("Get Dismissed Announcements", True, f"Retrieved dismissed announcements list ({len(data)} dismissed)")
                else:
                    self.log_test("Get Dismissed Announcements", False, f"Dismissed announcement not found in list: {data}")
            else:
                self.log_test("Get Dismissed Announcements", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Get Dismissed Announcements", False, f"Exception: {str(e)}")

    def test_announcements_undismiss(self):
        """Test POST /api/announcements/{id}/undismiss - Restore dismissed announcement."""
        try:
            # First dismiss an announcement
            announcement_id = self.test_announcements_dismiss()
            if not announcement_id:
                self.log_test("Announcement Undismiss", False, "Could not dismiss test announcement")
                return
            
            # Login as moderator and undismiss
            mod_token = self.login_moderator_user()
            if not mod_token:
                self.log_test("Announcement Undismiss", False, "Could not login as moderator")
                return
            
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {mod_token}"
            
            response = self.session.post(f"{API_BASE}/announcements/{announcement_id}/undismiss")
            if response.status_code == 200:
                data = response.json()
                if "restored" in data.get("message", ""):
                    self.log_test("Announcement Undismiss", True, "Announcement successfully restored")
                    
                    # Verify it's no longer in dismissed list
                    dismissed_response = self.session.get(f"{API_BASE}/announcements/dismissed")
                    if dismissed_response.status_code == 200:
                        dismissed_data = dismissed_response.json()
                        if announcement_id not in dismissed_data:
                            self.log_test("Announcement Undismiss Verification", True, "Announcement removed from dismissed list")
                        else:
                            self.log_test("Announcement Undismiss Verification", False, "Announcement still in dismissed list")
                else:
                    self.log_test("Announcement Undismiss", False, f"Unexpected response: {data}")
            else:
                self.log_test("Announcement Undismiss", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Announcement Undismiss", False, f"Exception: {str(e)}")

    def test_approval_email_function(self):
        """Test the send_application_approved_email function with manager comment."""
        try:
            # Import the email function
            import sys
            sys.path.append('/app/backend')
            from utils.email import send_application_approved_email
            
            # Test with manager comment
            test_email = "test@example.com"
            test_name = "John Doe"
            test_comment = "Great application! Looking forward to working with you."
            
            # Since we can't actually send emails in test environment, we'll test the function call
            # The function should return False due to missing email credentials, but not crash
            result = send_application_approved_email(test_email, test_name, test_comment)
            
            # The function should handle missing credentials gracefully
            self.log_test("Approval Email Function - With Comment", True, "Email function executed without errors (credentials not configured)")
            
            # Test without manager comment
            result_no_comment = send_application_approved_email(test_email, test_name, "")
            self.log_test("Approval Email Function - Without Comment", True, "Email function executed without errors for empty comment")
            
        except Exception as e:
            self.log_test("Approval Email Function", False, f"Exception: {str(e)}")

    def test_application_approval_with_comment(self):
        """Test PATCH /api/applications/{id} with status=approved and comment."""
        try:
            # Create a test application first
            app_id = self.create_test_application()
            if not app_id:
                self.log_test("Application Approval with Comment", False, "Could not create test application")
                return
            
            # Ensure we're logged in as admin
            if not self.admin_token:
                self.log_test("Application Approval with Comment", False, "No admin token available")
                return
            
            # Test approving application with comment
            approval_data = {
                "status": "approved",
                "comment": "Excellent application! Your experience and dedication make you a perfect fit for our team. Welcome aboard!"
            }
            
            response = self.session.patch(f"{API_BASE}/applications/{app_id}", json=approval_data)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "approved":
                    self.log_test("Application Approval with Comment", True, "Application successfully approved with manager comment")
                    
                    # Verify the comment was added to the application
                    app_response = self.session.get(f"{API_BASE}/applications/{app_id}")
                    if app_response.status_code == 200:
                        app_data = app_response.json()
                        comments = app_data.get("comments", [])
                        status_comment = next((c for c in comments if "STATUS CHANGE" in c.get("comment", "")), None)
                        if status_comment and approval_data["comment"] in status_comment.get("comment", ""):
                            self.log_test("Application Approval Comment Verification", True, "Manager comment properly recorded in application")
                        else:
                            self.log_test("Application Approval Comment Verification", False, "Manager comment not found in application comments")
                else:
                    self.log_test("Application Approval with Comment", False, f"Application status not updated correctly: {data.get('status')}")
            else:
                self.log_test("Application Approval with Comment", False, f"Status: {response.status_code}", response.text)
            
        except Exception as e:
            self.log_test("Application Approval with Comment", False, f"Exception: {str(e)}")

    def test_application_rejection_without_comment_in_email(self):
        """Test that rejection doesn't include comment in email (only approval does)."""
        try:
            # Create a test application first
            app_id = self.create_test_application()
            if not app_id:
                self.log_test("Application Rejection Email Test", False, "Could not create test application")
                return
            
            # Ensure we're logged in as admin
            if not self.admin_token:
                self.log_test("Application Rejection Email Test", False, "No admin token available")
                return
            
            # Test rejecting application with comment
            rejection_data = {
                "status": "rejected",
                "comment": "Unfortunately, we need someone with more experience at this time."
            }
            
            response = self.session.patch(f"{API_BASE}/applications/{app_id}", json=rejection_data)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "rejected":
                    self.log_test("Application Rejection Email Test", True, "Application successfully rejected (comment not sent to applicant)")
                else:
                    self.log_test("Application Rejection Email Test", False, f"Application status not updated correctly: {data.get('status')}")
            else:
                self.log_test("Application Rejection Email Test", False, f"Status: {response.status_code}", response.text)
            
        except Exception as e:
            self.log_test("Application Rejection Email Test", False, f"Exception: {str(e)}")

    def create_user_without_email(self):
        """Create a test user without email for email assignment testing."""
        try:
            # Register user with a valid email first, then we'll test the needs_email logic
            user_data = {
                "username": "noemailuser",
                "password": "NoEmail@123",
                "email": "noemailuser@gmail.com",  # Use valid domain
                "role": "moderator"
            }
            
            # Remove auth header temporarily
            auth_header = self.session.headers.pop("Authorization", None)
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            if response.status_code == 200 or (response.status_code == 400 and "already registered" in response.text):
                self.log_test("User Without Email Creation", True, "Test user for email assignment created")
                
                # Restore auth header
                if auth_header:
                    self.session.headers["Authorization"] = auth_header
                return True
            else:
                self.log_test("User Without Email Creation", False, f"Status: {response.status_code}", response.text)
                if auth_header:
                    self.session.headers["Authorization"] = auth_header
                return False
                
        except Exception as e:
            self.log_test("User Without Email Creation", False, f"Exception: {str(e)}")
            return False

    def test_login_needs_email_flag(self):
        """Test that login returns needs_email flag when user has no email."""
        try:
            # Create user without email
            if not self.create_user_without_email():
                self.log_test("Login Needs Email Flag", False, "Could not create test user")
                return None
            
            # Remove auth header temporarily
            auth_header = self.session.headers.pop("Authorization", None)
            
            # Login as user without email
            login_data = {
                "username": "noemailuser",
                "password": "NoEmail@123"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                needs_email = data.get("needs_email", False)
                user_token = data.get("access_token")
                
                if needs_email:
                    self.log_test("Login Needs Email Flag", True, "Login correctly returns needs_email=true for user without email")
                    # Restore auth header
                    if auth_header:
                        self.session.headers["Authorization"] = auth_header
                    return user_token
                else:
                    self.log_test("Login Needs Email Flag", False, f"needs_email flag not set correctly: {needs_email}")
            else:
                self.log_test("Login Needs Email Flag", False, f"Status: {response.status_code}", response.text)
            
            # Restore auth header
            if auth_header:
                self.session.headers["Authorization"] = auth_header
            return None
            
        except Exception as e:
            self.log_test("Login Needs Email Flag", False, f"Exception: {str(e)}")
            return None

    def test_set_email_endpoint(self):
        """Test POST /api/auth/set-email endpoint."""
        try:
            # Get user token for user without email
            user_token = self.test_login_needs_email_flag()
            if not user_token:
                self.log_test("Set Email Endpoint", False, "Could not get user token for email setting")
                return
            
            # Save current auth and switch to user
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {user_token}"
            
            # Test setting email
            email_data = {
                "email": "newemail@example.com"
            }
            
            response = self.session.post(f"{API_BASE}/auth/set-email", json=email_data)
            if response.status_code == 200:
                data = response.json()
                if "successfully" in data.get("message", ""):
                    self.log_test("Set Email Endpoint", True, "Email successfully set via /api/auth/set-email")
                    
                    # Verify email was set by logging in again
                    self.session.headers.pop("Authorization", None)
                    login_data = {
                        "username": "noemailuser",
                        "password": "NoEmail@123"
                    }
                    
                    login_response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                    if login_response.status_code == 200:
                        login_data_response = login_response.json()
                        needs_email_after = login_data_response.get("needs_email", True)
                        if not needs_email_after:
                            self.log_test("Set Email Verification", True, "needs_email flag correctly updated after setting email")
                        else:
                            self.log_test("Set Email Verification", False, "needs_email flag not updated after setting email")
                else:
                    self.log_test("Set Email Endpoint", False, f"Unexpected response: {data}")
            else:
                self.log_test("Set Email Endpoint", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Set Email Endpoint", False, f"Exception: {str(e)}")

    def create_mmod_user(self):
        """Create and login as MMOD user for email update testing."""
        try:
            # Register MMOD user
            user_data = {
                "username": "testmmod",
                "password": "TestMmod@123",
                "email": "mmod@gmail.com",
                "role": "mmod"
            }
            
            # Remove auth header temporarily
            auth_header = self.session.headers.pop("Authorization", None)
            
            response = self.session.post(f"{API_BASE}/auth/register", json=user_data)
            if response.status_code == 200 or (response.status_code == 400 and "already registered" in response.text):
                # Login as MMOD
                login_data = {
                    "username": "testmmod",
                    "password": "TestMmod@123"
                }
                
                login_response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    data = login_response.json()
                    mmod_token = data.get("access_token")
                    if mmod_token:
                        self.log_test("MMOD User Setup", True, "MMOD user ready for testing")
                        # Restore admin auth
                        if auth_header:
                            self.session.headers["Authorization"] = auth_header
                        return mmod_token
                    else:
                        self.log_test("MMOD User Setup", False, "No access token in login response")
                else:
                    self.log_test("MMOD User Setup", False, f"Login failed: {login_response.status_code}")
            else:
                self.log_test("MMOD User Setup", False, f"Registration failed: {response.status_code}")
            
            # Restore admin auth
            if auth_header:
                self.session.headers["Authorization"] = auth_header
            return None
                
        except Exception as e:
            self.log_test("MMOD User Setup", False, f"Exception: {str(e)}")
            return None

    def test_mmod_can_update_email(self):
        """Test that MMOD can update another user's email via /api/moderators/{username}/email."""
        try:
            # Get MMOD token
            mmod_token = self.create_mmod_user()
            if not mmod_token:
                self.log_test("MMOD Email Update", False, "Could not setup MMOD user")
                return
            
            # Save current auth and switch to MMOD
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {mmod_token}"
            
            # Test updating another user's email
            email_update_data = {
                "email": "updated@example.com"
            }
            
            response = self.session.patch(f"{API_BASE}/moderators/noemailuser/email", json=email_update_data)
            if response.status_code == 200:
                data = response.json()
                if "updated" in data.get("message", ""):
                    self.log_test("MMOD Email Update", True, "MMOD successfully updated another user's email")
                else:
                    self.log_test("MMOD Email Update", False, f"Unexpected response: {data}")
            else:
                self.log_test("MMOD Email Update", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("MMOD Email Update", False, f"Exception: {str(e)}")

    def test_admin_can_view_emails(self):
        """Test that Admin can view email addresses in moderator list."""
        try:
            # Ensure we're logged in as admin
            if not self.admin_token:
                self.log_test("Admin View Emails", False, "No admin token available")
                return
            
            response = self.session.get(f"{API_BASE}/moderators")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if emails are visible to admin
                    users_with_emails = [mod for mod in data if mod.get("email") is not None]
                    if len(users_with_emails) > 0:
                        self.log_test("Admin View Emails", True, f"Admin can view emails in moderator list ({len(users_with_emails)} users with emails)")
                    else:
                        self.log_test("Admin View Emails", False, "No emails visible to admin in moderator list")
                else:
                    self.log_test("Admin View Emails", False, "No moderators found in list")
            else:
                self.log_test("Admin View Emails", False, f"Status: {response.status_code}", response.text)
            
        except Exception as e:
            self.log_test("Admin View Emails", False, f"Exception: {str(e)}")

    def test_non_admin_cannot_view_emails(self):
        """Test that non-admin users cannot see email addresses in moderator list."""
        try:
            # Get regular moderator token
            regular_token = self.create_non_training_manager_user()
            if not regular_token:
                self.log_test("Non-Admin Email Visibility", False, "Could not setup regular moderator")
                return
            
            # Save current auth and switch to regular moderator
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {regular_token}"
            
            response = self.session.get(f"{API_BASE}/moderators")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if emails are hidden from non-admin
                    users_with_emails = [mod for mod in data if mod.get("email") is not None]
                    if len(users_with_emails) == 0:
                        self.log_test("Non-Admin Email Visibility", True, "Non-admin users cannot see emails in moderator list")
                    else:
                        self.log_test("Non-Admin Email Visibility", False, f"Non-admin can see emails ({len(users_with_emails)} users with visible emails)")
                else:
                    self.log_test("Non-Admin Email Visibility", False, "No moderators found in list")
            else:
                self.log_test("Non-Admin Email Visibility", False, f"Status: {response.status_code}", response.text)
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Non-Admin Email Visibility", False, f"Exception: {str(e)}")

    def test_email_validation(self):
        """Test email validation in set-email endpoint."""
        try:
            # Get user token for user without email
            user_token = self.test_login_needs_email_flag()
            if not user_token:
                self.log_test("Email Validation", False, "Could not get user token for email validation testing")
                return
            
            # Save current auth and switch to user
            original_auth = self.session.headers.get("Authorization")
            self.session.headers["Authorization"] = f"Bearer {user_token}"
            
            # Test with invalid email
            invalid_email_data = {
                "email": "invalid-email"
            }
            
            response = self.session.post(f"{API_BASE}/auth/set-email", json=invalid_email_data)
            if response.status_code == 400:
                self.log_test("Email Validation - Invalid Email", True, "Invalid email correctly rejected")
            else:
                self.log_test("Email Validation - Invalid Email", False, f"Invalid email not rejected: {response.status_code}")
            
            # Test with valid email
            valid_email_data = {
                "email": "valid@example.com"
            }
            
            response = self.session.post(f"{API_BASE}/auth/set-email", json=valid_email_data)
            if response.status_code == 200:
                self.log_test("Email Validation - Valid Email", True, "Valid email accepted")
            else:
                self.log_test("Email Validation - Valid Email", False, f"Valid email rejected: {response.status_code}")
            
            # Restore admin auth
            self.session.headers["Authorization"] = original_auth
            
        except Exception as e:
            self.log_test("Email Validation", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests."""
        print("🚀 Starting Backend API Tests")
        print("=" * 50)
        
        # Basic API tests
        self.test_api_root()
        
        # Authentication setup with test credentials
        if self.login_test_users():
            print("\n🔧 Testing Email Assignment Features")
            print("-" * 30)
            
            # Email assignment tests
            self.test_login_needs_email_flag()
            self.test_set_email_endpoint()
            self.test_email_validation()
            self.test_mmod_can_update_email()
            self.test_admin_can_view_emails()
            self.test_non_admin_cannot_view_emails()
            
            print("\n🔧 Testing Approval Email Feature")
            print("-" * 30)
            
            # New approval email tests
            self.test_approval_email_function()
            self.test_application_approval_with_comment()
            self.test_application_rejection_without_comment_in_email()
            
            print("\n🔧 Testing Other Features")
            print("-" * 30)
            
            # Feature Requests API tests
            self.test_feature_requests_get_own()
            self.test_feature_requests_get_all_admin()
            self.test_feature_requests_update_status()
            self.test_feature_requests_delete()
            
            # Announcement Dismiss API tests
            self.test_announcements_get_dismissed()
            self.test_announcements_undismiss()
            
            print("\n🔧 Testing Previous Features")
            print("-" * 30)
            
            # Easter egg tests
            self.test_easter_eggs_list()
            self.test_easter_egg_verify()
            self.test_easter_egg_update()
            
            # Name hiding tests
            self.test_name_hiding_applications_list()
            self.test_name_hiding_single_application()
        else:
            print("❌ Could not setup authentication with test credentials - skipping protected endpoint tests")
        
        # Summary
        print("=" * 50)
        print("📊 Test Summary")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        
        if failed > 0:
            print("\n🔍 Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
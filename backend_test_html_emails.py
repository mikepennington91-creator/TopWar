#!/usr/bin/env python3
"""
Backend API Testing for HTML Email Functionality
Tests the new branded HTML email templates and functionality
"""

import requests
import sys
import json
import os
from datetime import datetime
from unittest.mock import patch, MagicMock

class HTMLEmailTester:
    def __init__(self, base_url="https://reject-reason-share.preview.emergentagent.com"):
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
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_login(self, username="Sian", password="SianTest123!"):
        """Test moderator login"""
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json={"username": username, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    self.log_test("Moderator Login", True, f"Logged in as {username}")
                    return True
                else:
                    self.log_test("Moderator Login", False, "No access token in response")
                    return False
            else:
                self.log_test("Moderator Login", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Moderator Login", False, f"Exception: {str(e)}")
            return False

    def test_email_function_imports(self):
        """Test that all email functions can be imported and have correct signatures"""
        try:
            # Import the email module to test function signatures
            import sys
            sys.path.append('/app/backend')
            from utils.email import (
                send_application_rejected_email,
                send_application_approved_email, 
                send_application_confirmation_email,
                send_email
            )
            
            # Check function signatures by inspecting them
            import inspect
            
            # Test send_application_rejected_email signature
            sig = inspect.signature(send_application_rejected_email)
            params = list(sig.parameters.keys())
            expected_params = ['to_email', 'name', 'manager_comment']
            if params == expected_params:
                self.log_test("send_application_rejected_email Signature", True, f"Correct parameters: {params}")
            else:
                self.log_test("send_application_rejected_email Signature", False, f"Expected {expected_params}, got {params}")
                return False
            
            # Test send_application_approved_email signature  
            sig = inspect.signature(send_application_approved_email)
            params = list(sig.parameters.keys())
            expected_params = ['to_email', 'name', 'manager_comment']
            if params == expected_params:
                self.log_test("send_application_approved_email Signature", True, f"Correct parameters: {params}")
            else:
                self.log_test("send_application_approved_email Signature", False, f"Expected {expected_params}, got {params}")
                return False
            
            # Test send_application_confirmation_email signature
            sig = inspect.signature(send_application_confirmation_email)
            params = list(sig.parameters.keys())
            expected_params = ['to_email', 'name']
            if params == expected_params:
                self.log_test("send_application_confirmation_email Signature", True, f"Correct parameters: {params}")
            else:
                self.log_test("send_application_confirmation_email Signature", False, f"Expected {expected_params}, got {params}")
                return False
            
            # Test send_email signature
            sig = inspect.signature(send_email)
            params = list(sig.parameters.keys())
            expected_params = ['to_email', 'subject', 'body_html']
            if params == expected_params:
                self.log_test("send_email Signature", True, f"Correct parameters: {params}")
            else:
                self.log_test("send_email Signature", False, f"Expected {expected_params}, got {params}")
                return False
            
            return True
            
        except ImportError as e:
            self.log_test("Email Function Imports", False, f"Import error: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Email Function Imports", False, f"Exception: {str(e)}")
            return False

    def test_html_email_content_generation(self):
        """Test that email functions generate valid HTML content"""
        try:
            import sys
            sys.path.append('/app/backend')
            from utils.email import (
                send_application_rejected_email,
                send_application_approved_email,
                send_application_confirmation_email,
                _base_html,
                TOP_WAR_LOGO,
                APPLY_URL
            )
            
            # Test constants
            if "rivergame.net" in TOP_WAR_LOGO and "title.png" in TOP_WAR_LOGO:
                self.log_test("TOP_WAR_LOGO Constant", True, f"Logo URL: {TOP_WAR_LOGO}")
            else:
                self.log_test("TOP_WAR_LOGO Constant", False, f"Invalid logo URL: {TOP_WAR_LOGO}")
                return False
            
            # Test APPLY_URL construction
            if "/apply" in APPLY_URL:
                self.log_test("APPLY_URL Construction", True, f"Apply URL: {APPLY_URL}")
            else:
                self.log_test("APPLY_URL Construction", False, f"Invalid apply URL: {APPLY_URL}")
                return False
            
            # Test HTML template generation
            test_body = "<p>Test content</p>"
            html_output = _base_html(test_body)
            
            # Check for key HTML elements
            html_checks = [
                ("DOCTYPE html", "<!DOCTYPE html" in html_output),
                ("Logo image", TOP_WAR_LOGO in html_output),
                ("Body content", test_body in html_output),
                ("RiverGames branding", "RiverGames" in html_output),
                ("HTML structure", "<html" in html_output and "</html>" in html_output)
            ]
            
            all_checks_passed = True
            for check_name, check_result in html_checks:
                if check_result:
                    self.log_test(f"HTML Template - {check_name}", True, "Found in template")
                else:
                    self.log_test(f"HTML Template - {check_name}", False, "Missing from template")
                    all_checks_passed = False
            
            return all_checks_passed
            
        except Exception as e:
            self.log_test("HTML Email Content Generation", False, f"Exception: {str(e)}")
            return False

    def test_rejection_email_content(self):
        """Test rejection email contains required elements"""
        try:
            import sys
            sys.path.append('/app/backend')
            from utils.email import send_email, _base_html, _greeting, _heading, _paragraph, _comment_box, _button, _sign_off, APPLY_URL
            
            # Mock the send_email function to capture the HTML content
            captured_html = None
            
            def mock_send_email(to_email, subject, body_html):
                nonlocal captured_html
                captured_html = body_html
                return True
            
            # Patch send_email and test rejection email
            with patch('utils.email.send_email', side_effect=mock_send_email):
                from utils.email import send_application_rejected_email
                send_application_rejected_email("test@example.com", "Test User", "Test rejection comment")
            
            if captured_html:
                # Check for required elements in rejection email
                rejection_checks = [
                    ("Logo image", "rivergame.net" in captured_html and "title.png" in captured_html),
                    ("Rejection comment box", "Test rejection comment" in captured_html),
                    ("Re-Apply button", "Re-Apply When Ready" in captured_html),
                    ("Apply URL in button", APPLY_URL in captured_html),
                    ("HTML structure", "<!DOCTYPE html" in captured_html),
                    ("Greeting", "Hi <strong" in captured_html and "Test User" in captured_html),
                    ("RiverGames branding", "RiverGames" in captured_html)
                ]
                
                all_checks_passed = True
                for check_name, check_result in rejection_checks:
                    if check_result:
                        self.log_test(f"Rejection Email - {check_name}", True, "Found in email")
                    else:
                        self.log_test(f"Rejection Email - {check_name}", False, "Missing from email")
                        all_checks_passed = False
                
                return all_checks_passed
            else:
                self.log_test("Rejection Email Content", False, "No HTML content captured")
                return False
                
        except Exception as e:
            self.log_test("Rejection Email Content", False, f"Exception: {str(e)}")
            return False

    def test_approval_email_content(self):
        """Test approval email contains required elements"""
        try:
            import sys
            sys.path.append('/app/backend')
            
            # Mock the send_email function to capture the HTML content
            captured_html = None
            
            def mock_send_email(to_email, subject, body_html):
                nonlocal captured_html
                captured_html = body_html
                return True
            
            # Patch send_email and test approval email
            with patch('utils.email.send_email', side_effect=mock_send_email):
                from utils.email import send_application_approved_email
                send_application_approved_email("test@example.com", "Test User", "Test approval comment")
            
            if captured_html:
                # Check for required elements in approval email
                approval_checks = [
                    ("Logo image", "rivergame.net" in captured_html and "title.png" in captured_html),
                    ("Approval comment box", "Test approval comment" in captured_html),
                    ("HTML structure", "<!DOCTYPE html" in captured_html),
                    ("Greeting", "Hi <strong" in captured_html and "Test User" in captured_html),
                    ("Congratulations", "Congratulations" in captured_html),
                    ("RiverGames branding", "RiverGames" in captured_html)
                ]
                
                all_checks_passed = True
                for check_name, check_result in approval_checks:
                    if check_result:
                        self.log_test(f"Approval Email - {check_name}", True, "Found in email")
                    else:
                        self.log_test(f"Approval Email - {check_name}", False, "Missing from email")
                        all_checks_passed = False
                
                return all_checks_passed
            else:
                self.log_test("Approval Email Content", False, "No HTML content captured")
                return False
                
        except Exception as e:
            self.log_test("Approval Email Content", False, f"Exception: {str(e)}")
            return False

    def test_confirmation_email_content(self):
        """Test confirmation email contains required elements"""
        try:
            import sys
            sys.path.append('/app/backend')
            
            # Mock the send_email function to capture the HTML content
            captured_html = None
            
            def mock_send_email(to_email, subject, body_html):
                nonlocal captured_html
                captured_html = body_html
                return True
            
            # Patch send_email and test confirmation email
            with patch('utils.email.send_email', side_effect=mock_send_email):
                from utils.email import send_application_confirmation_email
                send_application_confirmation_email("test@example.com", "Test User")
            
            if captured_html:
                # Check for required elements in confirmation email
                confirmation_checks = [
                    ("Logo image", "rivergame.net" in captured_html and "title.png" in captured_html),
                    ("HTML structure", "<!DOCTYPE html" in captured_html),
                    ("Greeting", "Hi <strong" in captured_html and "Test User" in captured_html),
                    ("Application received", "Application Received" in captured_html),
                    ("RiverGames branding", "RiverGames" in captured_html)
                ]
                
                all_checks_passed = True
                for check_name, check_result in confirmation_checks:
                    if check_result:
                        self.log_test(f"Confirmation Email - {check_name}", True, "Found in email")
                    else:
                        self.log_test(f"Confirmation Email - {check_name}", False, "Missing from email")
                        all_checks_passed = False
                
                return all_checks_passed
            else:
                self.log_test("Confirmation Email Content", False, "No HTML content captured")
                return False
                
        except Exception as e:
            self.log_test("Confirmation Email Content", False, f"Exception: {str(e)}")
            return False

    def test_send_email_html_content_type(self):
        """Test that send_email function uses HTML content type by inspecting the code"""
        try:
            import sys
            sys.path.append('/app/backend')
            
            # Read the email.py file to verify HTML content type usage
            with open('/app/backend/utils/email.py', 'r') as f:
                email_code = f.read()
            
            # Check for HTML content type in the send_email function
            html_checks = [
                ("MIMEText with html", "MIMEText(body_html, 'html')" in email_code),
                ("HTML parameter name", "body_html" in email_code),
                ("SMTP functionality", "smtplib.SMTP" in email_code),
                ("Email attachment", "msg.attach" in email_code)
            ]
            
            all_checks_passed = True
            for check_name, check_result in html_checks:
                if check_result:
                    self.log_test(f"Send Email HTML - {check_name}", True, "Found in code")
                else:
                    self.log_test(f"Send Email HTML - {check_name}", False, "Missing from code")
                    all_checks_passed = False
            
            return all_checks_passed
                
        except Exception as e:
            self.log_test("Send Email HTML Content Type", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all HTML email tests"""
        print("🚀 Starting HTML Email Functionality Tests")
        print("=" * 70)
        
        # Test 1: Login (to ensure API access)
        if not self.test_login():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Test 2: Email function imports and signatures
        if not self.test_email_function_imports():
            print("❌ Email function import/signature tests failed")
            return False
        
        # Test 3: HTML email content generation
        if not self.test_html_email_content_generation():
            print("❌ HTML email content generation tests failed")
            return False
        
        # Test 4: Rejection email content
        if not self.test_rejection_email_content():
            print("❌ Rejection email content tests failed")
            return False
        
        # Test 5: Approval email content
        if not self.test_approval_email_content():
            print("❌ Approval email content tests failed")
            return False
        
        # Test 6: Confirmation email content
        if not self.test_confirmation_email_content():
            print("❌ Confirmation email content tests failed")
            return False
        
        # Test 7: Send email HTML content type
        if not self.test_send_email_html_content_type():
            print("❌ Send email HTML content type tests failed")
            return False
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All HTML email tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = HTMLEmailTester()
    success = tester.run_comprehensive_test()
    
    # Save test results
    with open('/app/test_reports/html_email_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
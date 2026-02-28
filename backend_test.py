import requests
import sys
from datetime import datetime

class CModAPITester:
    def __init__(self, base_url="https://cmod-green-hats.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response text: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_sian_login_cmod_prompt(self):
        """Test Sian login and CMod prompt logic"""
        print("\n🎩 Testing Sian CMod Mode Feature...")
        
        # Test login for Sian (should be 3rd login based on context)
        success, response = self.run_test(
            "Sian Login (3rd login - should show CMod prompt)",
            "POST",
            "auth/login",
            200,
            data={"username": "Sian", "password": "SianTest123!"}
        )
        
        if success:
            self.token = response.get('access_token')
            show_cmod_prompt = response.get('show_cmod_prompt', False)
            login_count = response.get('login_count')
            
            print(f"Login successful for Sian")
            print(f"Show CMod Prompt: {show_cmod_prompt}")
            print(f"Login count: {login_count}")
            
            if show_cmod_prompt:
                print("✅ CMod prompt should be shown (3rd login)")
                return True
            else:
                print("❌ CMod prompt not shown - may not be 3rd login")
                return False
        
        return False

    def test_regular_login_no_cmod(self):
        """Test that regular users don't get CMod prompt"""
        success, response = self.run_test(
            "Regular user login (no CMod prompt)",
            "POST", 
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if success:
            show_cmod_prompt = response.get('show_cmod_prompt', False)
            if not show_cmod_prompt:
                print("✅ Regular user doesn't get CMod prompt")
                return True
            else:
                print("❌ Regular user got CMod prompt (should only be for Sian)")
                return False
        
        return False

def main():
    # Setup
    tester = CModAPITester()
    
    print("🎩 Starting CMod Mode Backend API Tests...")
    print(f"Testing against: {tester.base_url}")
    
    # Test Sian's CMod functionality
    sian_cmod_success = tester.test_sian_login_cmod_prompt()
    
    # Test that regular users don't get CMod prompt
    regular_login_success = tester.test_regular_login_no_cmod()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if sian_cmod_success:
        print("✅ Sian CMod functionality working correctly")
    else:
        print("❌ Sian CMod functionality has issues")
    
    if regular_login_success:
        print("✅ Regular user login working correctly (no CMod prompt)")
    else:
        print("❌ Regular user login has CMod prompt issues")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
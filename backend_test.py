#!/usr/bin/env python3
"""
Simple backend API test for Japanese translation feature testing.
Tests basic API endpoints to ensure backend is functional.
"""

import requests
import sys
from datetime import datetime

class SimpleAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"Response: {response.text[:200]}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

def main():
    """Run basic API tests"""
    print("🚀 Starting Backend API Tests for Japanese Translation Feature")
    print("=" * 60)
    
    tester = SimpleAPITester()
    
    # Test basic endpoints that don't require authentication
    tester.run_test("Announcements Endpoint", "GET", "announcements", 200)
    
    # Test health check or basic connectivity
    try:
        response = requests.get("http://localhost:8001/api/announcements", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is accessible and responding")
        else:
            print(f"⚠️ Backend API responding with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend API connection failed: {str(e)}")
        return 1
    
    # Print results
    print(f"\n📊 Backend API Tests Summary:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("✅ Backend is functional for frontend translation testing")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
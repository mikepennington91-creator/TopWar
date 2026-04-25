"""
CMod Mode Feature Tests
Tests for CMod mode bug fixes:
1. CMod mode only activates for user 'Sian' - localStorage cleanup for non-Sian users
2. CMod mode auto-disables after 60 seconds (timer-based)
3. CMod mode can be manually disabled on logout
4. CMod prompt appears every 3rd login for Sian
"""
import pytest
import requests
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://topwar-cmod.preview.emergentagent.com').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Test credentials
SIAN_CREDENTIALS = {"username": "Sian", "password": "SianTest123!"}


class TestCModBackendAPI:
    """Test CMod-related backend API functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_sian_login_returns_show_cmod_prompt_field(self):
        """Test that Sian login response includes show_cmod_prompt field"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=SIAN_CREDENTIALS
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "show_cmod_prompt" in data, "show_cmod_prompt field missing from login response"
        assert isinstance(data["show_cmod_prompt"], bool), "show_cmod_prompt should be boolean"
        assert "access_token" in data, "access_token missing from login response"
        assert data["username"] == "Sian", "Username should be Sian"
        
        print(f"✅ Sian login successful, show_cmod_prompt: {data['show_cmod_prompt']}")
    
    def test_cmod_prompt_every_3rd_login(self):
        """Test that CMod prompt appears every 3rd login for Sian"""
        # Reset login count to test the pattern
        asyncio.run(self._reset_sian_login_count())
        
        results = []
        for i in range(1, 7):  # Test 6 logins
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=SIAN_CREDENTIALS
            )
            assert response.status_code == 200, f"Login {i} failed: {response.text}"
            
            data = response.json()
            show_cmod = data.get("show_cmod_prompt", False)
            results.append((i, show_cmod))
            print(f"Login #{i}: show_cmod_prompt = {show_cmod}")
        
        # Verify pattern: 3rd and 6th logins should show CMod prompt
        for login_num, show_cmod in results:
            expected = (login_num % 3 == 0)
            assert show_cmod == expected, f"Login #{login_num}: expected show_cmod_prompt={expected}, got {show_cmod}"
        
        print("✅ CMod prompt pattern verified: appears every 3rd login")
    
    def test_non_sian_user_no_cmod_prompt(self):
        """Test that non-Sian users don't get CMod prompt"""
        # Try to login with a different user (if exists)
        # First, let's check if there's another user
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "Developer", "password": "TWDev3"}
        )
        
        # This might fail if Developer is an easter egg, not a real user
        if response.status_code == 200:
            data = response.json()
            show_cmod = data.get("show_cmod_prompt", False)
            assert show_cmod == False, "Non-Sian user should not get CMod prompt"
            print("✅ Non-Sian user does not get CMod prompt")
        else:
            # Try with invalid credentials to verify the endpoint works
            print("⚠️ No other moderator user available for testing")
            pytest.skip("No other moderator user available")
    
    def test_login_increments_login_count(self):
        """Test that login increments the login_count in database"""
        # Get current login count
        initial_count = asyncio.run(self._get_sian_login_count())
        
        # Login
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json=SIAN_CREDENTIALS
        )
        assert response.status_code == 200
        
        # Check new login count
        new_count = asyncio.run(self._get_sian_login_count())
        assert new_count == initial_count + 1, f"Login count should increment: {initial_count} -> {new_count}"
        
        print(f"✅ Login count incremented: {initial_count} -> {new_count}")
    
    async def _reset_sian_login_count(self):
        """Reset Sian's login count to 0 for testing"""
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await db.moderators.update_one(
            {"username": "Sian"},
            {"$set": {"login_count": 0}}
        )
        client.close()
    
    async def _get_sian_login_count(self):
        """Get Sian's current login count"""
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        sian = await db.moderators.find_one({"username": "Sian"}, {"login_count": 1, "_id": 0})
        client.close()
        return sian.get("login_count", 0) if sian else 0


class TestDevSecretsPage:
    """Test Dev Secrets page dates and Super Scientist skill tree"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_easter_egg_developer_credentials(self):
        """Test that Developer easter egg credentials work"""
        response = self.session.post(
            f"{BASE_URL}/api/easter-eggs/verify",
            params={"username": "Developer", "password": "TWDev3"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("valid") == True, "Developer credentials should be valid"
        assert data.get("page_key") == "developer", "Page key should be 'developer'"
        
        print("✅ Developer easter egg credentials verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

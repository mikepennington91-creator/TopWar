"""Comprehensive Organogram (org chart) feature tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://topwar-org-chart.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"username": "Admin", "password": "AdminTest123!"}
LMOD = {"username": "SampleLMod", "password": "Sample123!"}
CMOD_USER = {"username": "CModUser", "password": "CModTest123!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed for {creds['username']}: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def lmod_token():
    return _login(LMOD)


@pytest.fixture(scope="module")
def cmod_token():
    return _login(CMOD_USER)


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module", autouse=True)
def reset_organogram(admin_token):
    """Wipe all org nodes before tests so we run on a clean slate."""
    r = requests.get(f"{API}/organogram/nodes", headers=_h(admin_token), timeout=10)
    assert r.status_code == 200
    for n in r.json():
        requests.delete(f"{API}/organogram/nodes/{n['id']}", headers=_h(admin_token), timeout=10)
    yield


# ====== can-edit ======
class TestCanEdit:
    def test_admin_can_edit(self, admin_token):
        r = requests.get(f"{API}/organogram/can-edit", headers=_h(admin_token))
        assert r.status_code == 200
        assert r.json()["can_edit"] is True

    def test_non_admin_cannot_edit_by_default(self, lmod_token):
        r = requests.get(f"{API}/organogram/can-edit", headers=_h(lmod_token))
        assert r.status_code == 200
        assert r.json()["can_edit"] is False


# ====== portal-users ======
class TestPortalUsers:
    def test_list_returns_assigned_flag(self, admin_token):
        r = requests.get(f"{API}/organogram/portal-users", headers=_h(admin_token))
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        assert len(users) > 0
        sample = users[0]
        assert "username" in sample and "is_assigned" in sample and "role" in sample
        usernames = [u["username"] for u in users]
        assert "Admin" in usernames or "CModUser" in usernames


# ====== Permissions on POST/PATCH/DELETE ======
class TestPermissions:
    def test_non_admin_post_forbidden(self, lmod_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(lmod_token),
            json={"username": "SampleLMod", "rank": "Mod"},
        )
        assert r.status_code == 403

    def test_non_admin_get_allowed(self, lmod_token):
        r = requests.get(f"{API}/organogram/nodes", headers=_h(lmod_token))
        assert r.status_code == 200


# ====== CRUD ======
class TestNodeCRUD:
    created_ids = {}

    def test_create_cmod_node(self, admin_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={"username": "CModUser", "rank": "CMod", "display_name": "Chief Mod"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["username"] == "CModUser"
        assert data["rank"] == "CMod"
        assert data["display_name"] == "Chief Mod"
        assert data["parent_id"] is None
        assert "id" in data
        TestNodeCRUD.created_ids["cmod"] = data["id"]

    def test_invalid_rank_rejected(self, admin_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={"username": "SampleSMod", "rank": "Bogus"},
        )
        assert r.status_code == 400

    def test_duplicate_username_rejected(self, admin_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={"username": "CModUser", "rank": "MMod"},
        )
        assert r.status_code == 400

    def test_invalid_parent_rank_rejected(self, admin_token):
        # parent CMod, child also CMod -> parent rank index >= child index
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={
                "username": "SampleSMod",
                "rank": "CMod",
                "parent_id": TestNodeCRUD.created_ids["cmod"],
            },
        )
        assert r.status_code == 400

    def test_create_with_valid_parent(self, admin_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={
                "username": "SampleSMod",
                "rank": "MMod",
                "parent_id": TestNodeCRUD.created_ids["cmod"],
            },
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["parent_id"] == TestNodeCRUD.created_ids["cmod"]
        assert data["rank"] == "MMod"
        TestNodeCRUD.created_ids["mmod"] = data["id"]

    def test_invalid_parent_id(self, admin_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={"username": "SampleLMod", "rank": "Mod", "parent_id": "non-existent"},
        )
        assert r.status_code == 400

    def test_create_third_level(self, admin_token):
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(admin_token),
            json={
                "username": "SampleMod1",
                "rank": "Mod",
                "parent_id": TestNodeCRUD.created_ids["mmod"],
            },
        )
        assert r.status_code == 200
        TestNodeCRUD.created_ids["mod1"] = r.json()["id"]

    def test_get_persisted(self, admin_token):
        r = requests.get(f"{API}/organogram/nodes", headers=_h(admin_token))
        assert r.status_code == 200
        usernames = [n["username"] for n in r.json()]
        assert "CModUser" in usernames
        assert "SampleSMod" in usernames
        assert "SampleMod1" in usernames

    def test_patch_display_name(self, admin_token):
        nid = TestNodeCRUD.created_ids["mmod"]
        r = requests.patch(
            f"{API}/organogram/nodes/{nid}",
            headers=_h(admin_token),
            json={"display_name": "Senior Mod Lead"},
        )
        assert r.status_code == 200
        assert r.json()["display_name"] == "Senior Mod Lead"
        # verify GET
        r2 = requests.get(f"{API}/organogram/nodes", headers=_h(admin_token))
        node = next(n for n in r2.json() if n["id"] == nid)
        assert node["display_name"] == "Senior Mod Lead"

    def test_patch_rank_invalid_due_to_children(self, admin_token):
        # Try setting MMod node to Mod -- but its child SampleMod1 is also Mod -> should fail
        nid = TestNodeCRUD.created_ids["mmod"]
        r = requests.patch(
            f"{API}/organogram/nodes/{nid}",
            headers=_h(admin_token),
            json={"rank": "Mod"},
        )
        assert r.status_code == 400

    def test_patch_cycle_prevention(self, admin_token):
        # Make CMod's parent the MMod (which is its child) -> cycle
        cmod_id = TestNodeCRUD.created_ids["cmod"]
        mmod_id = TestNodeCRUD.created_ids["mmod"]
        r = requests.patch(
            f"{API}/organogram/nodes/{cmod_id}",
            headers=_h(admin_token),
            json={"parent_id": mmod_id},
        )
        # Either rank-violation 400 or cycle 400 - both acceptable
        assert r.status_code == 400

    def test_non_admin_patch_forbidden(self, lmod_token):
        nid = TestNodeCRUD.created_ids["mmod"]
        r = requests.patch(
            f"{API}/organogram/nodes/{nid}",
            headers=_h(lmod_token),
            json={"display_name": "hack"},
        )
        assert r.status_code == 403

    def test_cmod_user_can_now_edit(self, cmod_token):
        # Now that CModUser is in organogram with rank CMod, can_edit should be true
        r = requests.get(f"{API}/organogram/can-edit", headers=_h(cmod_token))
        assert r.status_code == 200
        assert r.json()["can_edit"] is True

    def test_cmod_user_can_create(self, cmod_token):
        # CMod should be able to create a node
        r = requests.post(
            f"{API}/organogram/nodes",
            headers=_h(cmod_token),
            json={
                "username": "SampleLMod",
                "rank": "LMod",
                "parent_id": TestNodeCRUD.created_ids["mmod"],
            },
        )
        assert r.status_code == 200, r.text
        TestNodeCRUD.created_ids["lmod"] = r.json()["id"]

    def test_delete_reparents_children(self, admin_token):
        # Delete MMod -> SampleMod1 (child) and SampleLMod (child) should be reparented to CMod
        mmod_id = TestNodeCRUD.created_ids["mmod"]
        cmod_id = TestNodeCRUD.created_ids["cmod"]
        r = requests.delete(f"{API}/organogram/nodes/{mmod_id}", headers=_h(admin_token))
        assert r.status_code == 200
        # Verify
        r2 = requests.get(f"{API}/organogram/nodes", headers=_h(admin_token))
        nodes = r2.json()
        ids = {n["id"]: n for n in nodes}
        assert mmod_id not in ids
        mod1 = ids[TestNodeCRUD.created_ids["mod1"]]
        lmod = ids[TestNodeCRUD.created_ids["lmod"]]
        assert mod1["parent_id"] == cmod_id
        assert lmod["parent_id"] == cmod_id

    def test_non_admin_delete_forbidden(self, lmod_token):
        cmod_id = TestNodeCRUD.created_ids["cmod"]
        r = requests.delete(f"{API}/organogram/nodes/{cmod_id}", headers=_h(lmod_token))
        assert r.status_code == 403

    def test_delete_unknown_returns_404(self, admin_token):
        r = requests.delete(f"{API}/organogram/nodes/no-such-id", headers=_h(admin_token))
        assert r.status_code == 404


# ====== Cleanup ======
def test_zz_cleanup(admin_token):
    r = requests.get(f"{API}/organogram/nodes", headers=_h(admin_token))
    for n in r.json():
        requests.delete(f"{API}/organogram/nodes/{n['id']}", headers=_h(admin_token))

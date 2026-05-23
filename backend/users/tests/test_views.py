from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import UserProfile


class RegisterAPITests(APITestCase):
    def test_register_returns_tokens(self):
        res = self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "email": "new@example.com",
                "password": "securepass",
                "passwordConfirm": "securepass",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_register_creates_user(self):
        self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "password": "securepass",
                "passwordConfirm": "securepass",
            },
        )
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_duplicate_username_rejected(self):
        User.objects.create_user(username="existing", password="pass1234")
        res = self.client.post(
            reverse("register"),
            {
                "username": "existing",
                "password": "securepass",
                "passwordConfirm": "securepass",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch_rejected(self):
        res = self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "password": "securepass",
                "passwordConfirm": "different1",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_rejected(self):
        res = self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "password": "short",
                "passwordConfirm": "short",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_stores_timezone(self):
        self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "password": "securepass",
                "passwordConfirm": "securepass",
                "timezone": "America/Denver",
            },
        )
        user = User.objects.get(username="newuser")
        profile = UserProfile.objects.get(user=user)
        self.assertEqual(profile.timezone, "America/Denver")


class LoginAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")

    def test_login_returns_tokens(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "testpass123"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_login_wrong_password_rejected(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "wrongpassword"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user_rejected(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "nobody", "password": "testpass123"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_stores_timezone(self):
        self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "testpass123", "timezone": "America/Denver"},
        )
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.timezone, "America/Denver")

    def test_login_invalid_timezone_ignored(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "testpass123", "timezone": "Not/Real"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.timezone, "UTC")


class TokenRefreshAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")

    def test_refresh_returns_new_access_token(self):
        login_res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "testpass123"},
        )
        res = self.client.post(
            reverse("token_refresh"),
            {"refresh": login_res.data["refresh"]},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_refresh_invalid_token_rejected(self):
        res = self.client.post(
            reverse("token_refresh"),
            {"refresh": "not.a.valid.token"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.client.force_authenticate(user=self.user)

    def test_get_profile_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(reverse("profile"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_returns_timezone(self):
        res = self.client.get(reverse("profile"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("timezone", res.data)

    def test_patch_profile_valid_timezone(self):
        res = self.client.patch(reverse("profile"), {"timezone": "America/Denver"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["timezone"], "America/Denver")

    def test_patch_profile_invalid_timezone_rejected(self):
        res = self.client.patch(reverse("profile"), {"timezone": "Not/Real/Timezone"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class UserModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")

    def test_user_profile_str(self):
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(str(profile), "alice profile")

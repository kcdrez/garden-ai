from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import UserProfile

REGISTER_PAYLOAD = {
    "username": "newuser",
    "email": "new@example.com",
    "password": "securepass",
    "passwordConfirm": "securepass",
}


class RegisterAPITests(APITestCase):
    def test_register_returns_tokens(self):
        res = self.client.post(reverse("register"), REGISTER_PAYLOAD)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_register_creates_user(self):
        self.client.post(reverse("register"), REGISTER_PAYLOAD)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_register_missing_email_rejected(self):
        payload = {**REGISTER_PAYLOAD, "email": ""}
        res = self.client.post(reverse("register"), payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username_rejected(self):
        User.objects.create_user(username="existing", password="pass1234")
        res = self.client.post(reverse("register"), {**REGISTER_PAYLOAD, "username": "existing"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch_rejected(self):
        res = self.client.post(reverse("register"), {**REGISTER_PAYLOAD, "passwordConfirm": "different1"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_short_password_rejected(self):
        res = self.client.post(
            reverse("register"), {**REGISTER_PAYLOAD, "password": "short", "passwordConfirm": "short"}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_stores_timezone(self):
        self.client.post(reverse("register"), {**REGISTER_PAYLOAD, "timezone": "America/Denver"})
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


class EmailLoginAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", email="alice@example.com", password="testpass123")

    def test_login_with_email(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice@example.com", "password": "testpass123"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_login_with_username_still_works(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "testpass123"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_login_with_wrong_email_rejected(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "nobody@example.com", "password": "testpass123"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


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


class PasswordResetAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123", email="alice@example.com")

    def _request_reset(self, email="alice@example.com"):
        return self.client.post(reverse("password_reset"), {"email": email})

    def _get_reset_token(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        return uid, token

    def test_reset_request_returns_200_for_registered_email(self):
        res = self._request_reset()
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_reset_request_returns_200_for_unregistered_email(self):
        # Always returns 200 to prevent user enumeration
        res = self._request_reset("nobody@example.com")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_reset_request_sends_email(self):
        from django.core import mail

        self._request_reset()
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("alice@example.com", mail.outbox[0].to)

    def test_reset_confirm_sets_new_password(self):
        uid, token = self._get_reset_token()
        res = self.client.post(
            reverse("password_reset_confirm"),
            {"uid": uid, "token": token, "newPassword": "newpassword123"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_reset_confirm_invalid_uid_rejected(self):
        _, token = self._get_reset_token()
        res = self.client.post(
            reverse("password_reset_confirm"),
            {"uid": "invalid", "token": token, "newPassword": "newpassword123"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_confirm_invalid_token_rejected(self):
        uid, _ = self._get_reset_token()
        res = self.client.post(
            reverse("password_reset_confirm"),
            {"uid": uid, "token": "invalid-token", "newPassword": "newpassword123"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_confirm_short_password_rejected(self):
        uid, token = self._get_reset_token()
        res = self.client.post(
            reverse("password_reset_confirm"),
            {"uid": uid, "token": token, "newPassword": "short"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

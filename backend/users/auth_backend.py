from django.contrib.auth import get_user_model
user_model = get_user_model()

class EmailAuthBackend:
    def authenticate(self, request, username=None, password=None):
        try:
            user = user_model.objects.get(email=username)
        except user_model.DoesNotExist:
            return None

        if user.check_password(password):
            return user
        return None
    def get_user(self, user_id):
        try:
            return user_model.objects.get(pk=user_id)
        except user_model.DoesNotExist:
            return None
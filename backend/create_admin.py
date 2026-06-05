import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = "admin@telnet.tn"
password = "Admin@2024"

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password)
    print("Superuser créé !")
else:
    print("Superuser existe déjà.")
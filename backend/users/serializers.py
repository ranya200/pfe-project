from rest_framework import serializers
import re
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Lecture / liste des utilisateurs — mot de passe exclu."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'title', 'phone_number', 'department', 'image',
            'role', 'role_display',
            'is_active', 'date_joined',
            'email_notifications_enabled',
        ]
        read_only_fields = ['id', 'is_active', 'date_joined', 'role_display']



class RegisterSerializer(serializers.ModelSerializer):
    """
    Création d'un utilisateur par l'admin.
    Tous les rôles dans ASSIGNABLE_ROLES sont autorisés via l'API.
    Le rôle 'admin' se crée uniquement en BDD (create_superuser).
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        max_length=20,
        error_messages={
            'min_length': 'Le mot de passe doit contenir au moins 8 caractères.',
            'max_length': 'Le mot de passe ne peut pas dépasser 20 caractères.',
        },
    )

    role = serializers.ChoiceField(
        choices=[(r, r) for r in CustomUser.ASSIGNABLE_ROLES],
        error_messages={
            'invalid_choice': (
                "Rôle invalide. Choisissez parmi : "
                + ", ".join(CustomUser.ASSIGNABLE_ROLES) + "."
            )
        }
    )

    class Meta:
        model  = CustomUser
        fields = [
            'email', 'password',
            'first_name', 'last_name',
            'title', 'phone_number', 'department', 'image',
            'role',
        ]

    # ── Validations ────────────────────────────────────────────────────────
    def validate_email(self, value):
        if len(value) > 50:
            raise serializers.ValidationError(
                "L'email ne peut pas dépasser 50 caractères."
            )
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_first_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError(
                "Le prénom doit contenir au moins 2 caractères."
            )
        if len(value) > 30:
            raise serializers.ValidationError(
                "Le prénom ne peut pas dépasser 30 caractères."
            )
        if not re.match(r"^[A-Za-zÀ-ÿ\s'\-]+$", value):
            raise serializers.ValidationError(
                "Le prénom ne doit contenir que des lettres."
            )
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError(
                "Le nom doit contenir au moins 2 caractères."
            )
        if len(value) > 30:
            raise serializers.ValidationError(
                "Le nom ne peut pas dépasser 30 caractères."
            )
        if not re.match(r"^[A-Za-zÀ-ÿ\s'\-]+$", value):
            raise serializers.ValidationError(
                "Le nom ne doit contenir que des lettres."
            )
        return value

    def validate_phone_number(self, value):
        value = value.strip()
        if not value.isdigit():
            raise serializers.ValidationError(
                "Le numéro de téléphone ne doit contenir que des chiffres."
            )
        if len(value) != 8:
            raise serializers.ValidationError(
                "Le numéro de téléphone doit contenir exactement 8 chiffres."
            )
        return value

    def validate_title(self, value):
        valid = [choice[0] for choice in CustomUser.TITLE_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(
                f"Titre invalide. Choisissez parmi : {', '.join(valid)}."
            )
        return value

    def validate_department(self, value):
        valid = [choice[0] for choice in CustomUser.DEPARTMENT_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(
                f"Département invalide. Choisissez parmi : {', '.join(valid)}."
            )
        return value

    def validate_image(self, value):
        if value is None:
            return value  # image optionnelle

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        max_size_mb = 2

        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Format invalide. Utilisez JPG, PNG ou WEBP."
            )
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(
                f"L'image ne peut pas dépasser {max_size_mb} Mo."
            )
        return value

   

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)   # hash du mot de passe
        user.must_change_password = True   # ISO 27001
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


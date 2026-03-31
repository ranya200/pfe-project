from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)



class CustomUser(AbstractUser):
     

    TITLE_CHOICES = (
        ('MR', 'Mr'),
        ('MS', 'Ms'),
    )

    DEPARTMENT_CHOICES = (
        ('MEDIA', 'Média & Énergie'),
        ('SPACE', 'Space'),
        ('BE', 'BE Electronique'),
        ('MONETIQUE', 'Monétique'),
        ('SI', 'SI'),
        ('TELECOM', 'Télécom'),
        ('RH', 'RH'),
        ('QUALITE', 'Qualité'),
        ('ADMIN', 'Admin'),
    )

    
    ROLE_CHOICES = (
        ('admin',           'Administrateur'),
        ('chef_projet',     'Chef de Projet'),
        ('resp_qualite',    'Responsable Qualité'),
        ('developpeur',     'Développeur'),
        ('tech_lead',       'Tech Lead'),
        ('ingenieur',       'Ingénieur'),
        ('validateur',      'Validateur'),
        ('charge_affaires', "Chargé d'Affaires"),
        ('consultant',      'Consultant'),
        ('stagiaire',       'Stagiaire'),
    )

    ASSIGNABLE_ROLES = [
        'chef_projet', 'resp_qualite', 'developpeur', 'tech_lead',
        'ingenieur', 'validateur', 'charge_affaires', 'consultant', 'stagiaire',
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='chef_projet',
    )

    email = models.EmailField(unique=True, max_length=50)
    title = models.CharField(max_length=5, choices=TITLE_CHOICES)
    phone_number = models.CharField(max_length=20)
    image = models.ImageField(upload_to='users/', null=True, blank=True)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES)
    username = models.CharField(max_length=150, null=True, blank=True)

    # ── ISO 27001 — Traçabilité & Sécurité ────────────────────────────────
    last_login_ip           = models.GenericIPAddressField(null=True, blank=True)
    failed_login_attempts   = models.PositiveIntegerField(default=0)
    account_locked_until    = models.DateTimeField(null=True, blank=True)
    last_password_change    = models.DateTimeField(null=True, blank=True)
    must_change_password    = models.BooleanField(default=False)

    objects = CustomUserManager()


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  

# ── Helpers ISO 27001 ─────────────────────────────────────────────────
    def is_account_locked(self):
        """Vérifie si le compte est verrouillé (ISO 27001 — politique de verrouillage)."""
        if self.account_locked_until and timezone.now() < self.account_locked_until:
            return True
        return False

    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.account_locked_until  = None
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])

    def increment_failed_attempts(self):
        self.failed_login_attempts += 1
        # Verrouillage après 5 tentatives échouées (ISO 27001)
        if self.failed_login_attempts >= 5:
            self.account_locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
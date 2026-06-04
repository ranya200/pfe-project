from django.db import models


class Client(models.Model):
    nom_client  = models.CharField(max_length=255)
    domaine     = models.CharField(max_length=255, blank=True)   # ex: Telecom, Banking, Energy
    email       = models.EmailField(blank=True)
    telephone   = models.CharField(max_length=30, blank=True)
    adresse     = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom_client']

    def __str__(self):
        return self.nom_client

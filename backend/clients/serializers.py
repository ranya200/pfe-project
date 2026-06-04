from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Client
        fields = ['id', 'nom_client', 'domaine', 'email', 'telephone', 'adresse', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


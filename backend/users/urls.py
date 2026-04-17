from rest_framework.routers import DefaultRouter
from .views import RegisterViewSet, LoginViewSet, MeViewSet, UsersViewSet, LogoutViewSet
from knox.views import LogoutAllView
from django.urls import path, include


router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('login',    LoginViewSet,    basename='login')
router.register('me',       MeViewSet,       basename='me')
router.register('users',    UsersViewSet,    basename='users')

urlpatterns = [
    path('', include(router.urls)),
    path('logout/',     LogoutViewSet.as_view(),  name='knox-logout'),   
    path('logout-all/', LogoutAllView.as_view(),  name='knox-logout-all'),
]
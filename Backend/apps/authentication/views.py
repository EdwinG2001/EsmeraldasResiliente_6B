from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Usuario
from .serializers import (
    RegistroCiudadanoSerializer, 
    PerfilUsuarioSerializer,
    CustomTokenObtainPairSerializer
)

class KeycloakConfigAPIView(APIView):
    """
    Retorna la configuración activa de Keycloak IAM (URL de Cloudflare, Realm y Clientes).
    Permite a la Web y a la App Móvil sincronizar dinámicamente la URL de Keycloak
    sin requerir recompilación de clientes ni cambios de código cuando el túnel se renueva.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        kc_url = getattr(settings, 'KEYCLOAK_URL', '').rstrip('/')
        realm = getattr(settings, 'KEYCLOAK_REALM', 'esmeraldas-resiliente')
        client_id = 'frontend-web'
        return Response({
            'keycloak_url': kc_url,
            'realm': realm,
            'client_id': client_id,
            'auth_url': f"{kc_url}/realms/{realm}/protocol/openid-connect/auth",
            'token_url': f"{kc_url}/realms/{realm}/protocol/openid-connect/token",
            'userinfo_url': f"{kc_url}/realms/{realm}/protocol/openid-connect/userinfo",
            'jwks_url': f"{kc_url}/realms/{realm}/protocol/openid-connect/certs",
        }, status=status.HTTP_200_OK)

class CustomTokenObtainPairView(generics.GenericAPIView):
    """
    Endpoint JWT de inicio de sesión compatible con 'admin', celular o email.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class RegistroCiudadanoAPIView(generics.CreateAPIView):
    """
    Registro rápido para la App Móvil Ciudadana.
    Retorna el usuario creado junto con los tokens JWT (access y refresh).
    """
    queryset = Usuario.objects.all()
    serializer_class = RegistroCiudadanoSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generar tokens JWT de forma inmediata
        refresh = RefreshToken.for_user(user)

        return Response({
            'mensaje': 'Usuario registrado exitosamente en el Sistema de Esmeraldas.',
            'usuario': {
                'id': str(user.id),
                'nombre_completo': user.get_full_name(),
                'telefono': user.telefono,
                'rol': user.rol
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class PerfilUsuarioAPIView(generics.RetrieveUpdateAPIView):
    """
    Consulta y actualización del perfil (Paso 2: Domicilio, Cédula y Vulnerabilidad).
    """
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


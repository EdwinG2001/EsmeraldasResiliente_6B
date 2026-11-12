import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

# Cargar variables de entorno desde .env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Configuración GeoDjango para Windows (GDAL y GEOS)
if os.name == 'nt':
    POSTGRES_BIN = r'C:\Program Files\PostgreSQL\18\bin'
    if os.path.exists(POSTGRES_BIN):
        os.environ['PATH'] = POSTGRES_BIN + ';' + os.environ.get('PATH', '')
        if hasattr(os, 'add_dll_directory'):
            try:
                os.add_dll_directory(POSTGRES_BIN)
            except Exception:
                pass
        gdal_candidate = os.path.join(POSTGRES_BIN, 'libgdal-35.dll')
        if os.path.exists(gdal_candidate):
            GDAL_LIBRARY_PATH = gdal_candidate
            GEOS_LIBRARY_PATH = os.path.join(POSTGRES_BIN, 'libgeos_c.dll')
        proj_dir = r'C:\Program Files\PostgreSQL\18\share\contrib\postgis-3.6\proj'
        if os.path.exists(proj_dir):
            os.environ['PROJ_LIB'] = proj_dir
            os.environ['PROJ_DATA'] = proj_dir

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-esmeraldas-resiliente-key-2026')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', '*').split(',') if h.strip()]

# Orígenes confiables para CSRF (Render, Localhost y Aiven)
CSRF_TRUSTED_ORIGINS = [
    'https://*.onrender.com',
    'http://localhost:8080',
    'http://localhost:8000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8000',
]
extra_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if extra_csrf:
    CSRF_TRUSTED_ORIGINS.extend([c.strip() for c in extra_csrf.split(',') if c.strip()])

# ------------------------------------------------------------------------------
# APLICACIONES INSTALADAS
# ------------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Soporte Geoespacial Nativo
    'django.contrib.gis',

    # Ecosistema API REST
    'rest_framework',
    'rest_framework_gis',
    'corsheaders',

    # Módulos del Sistema Integral de Esmeraldas
    'apps.authentication.apps.AuthenticationConfig',
    'apps.gis_core.apps.GisCoreConfig',
    'apps.weather.apps.WeatherConfig',
    'apps.reports.apps.ReportsConfig',
    'apps.evacuation.apps.EvacuationConfig',
    'apps.humanitarian_aid.apps.HumanitarianAidConfig',
    'apps.ai_analytics.apps.AiAnalyticsConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'Frontend', 'dist'))

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            FRONTEND_DIST_DIR,
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

# ------------------------------------------------------------------------------
# BASE DE DATOS ESPACIAL (POSTGRESQL + POSTGIS: Aiven Cloud / Local)
# ------------------------------------------------------------------------------
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            engine='django.contrib.gis.db.backends.postgis',
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': os.getenv('DB_ENGINE', 'django.contrib.gis.db.backends.postgis'),
            'NAME': os.getenv('DB_NAME', 'esmeraldas_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'admin'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': os.getenv('DB_SSLMODE', 'prefer'),
            },
        }
    }

# ------------------------------------------------------------------------------
# MODELO DE USUARIO PERSONALIZADO (CIUDADANÍA Y ROLES COE)
# ------------------------------------------------------------------------------
AUTH_USER_MODEL = 'authentication.Usuario'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ------------------------------------------------------------------------------
# INTERNACIONALIZACIÓN
# ------------------------------------------------------------------------------
LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------------------
# ARCHIVOS ESTÁTICOS Y MULTIMEDIA (FOTOS DE INCIDENTES)
# ------------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ------------------------------------------------------------------------------
# DJANGO REST FRAMEWORK Y AUTENTICACIÓN HÍBRIDA (KEYCLOAK OIDC + SIMPLE_JWT)
# ------------------------------------------------------------------------------
_kc_env = os.getenv('KEYCLOAK_URL', '').strip()
if not _kc_env or 'onrender.com' in _kc_env:
    KEYCLOAK_URL = 'https://innocent-arrivals-sec-penetration.trycloudflare.com'
else:
    KEYCLOAK_URL = _kc_env.rstrip('/')
KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'esmeraldas-resiliente')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.authentication.keycloak_auth.KeycloakOrJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ------------------------------------------------------------------------------
# CORS (SOPORTE FRONTEND WEB LEAFLET Y APP MÓVIL)
# ------------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'True') == 'True'
CORS_ALLOW_CREDENTIALS = True

# ------------------------------------------------------------------------------
# CONFIGURACIÓN OPENWEATHERMAP Y COORDENADAS ESMERALDAS
# ------------------------------------------------------------------------------
OPENWEATHERMAP_API_KEY = os.getenv('OPENWEATHERMAP_API_KEY', '')
OPENWEATHERMAP_BASE_URL = os.getenv('OPENWEATHERMAP_BASE_URL', 'https://api.openweathermap.org/data/2.5')
ESMERALDAS_LAT = float(os.getenv('ESMERALDAS_LAT', 0.9681))
ESMERALDAS_LON = float(os.getenv('ESMERALDAS_LON', -79.6582))


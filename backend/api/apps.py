from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'                     # Assure-toi que ça correspond au nom de ton dossier

    def ready(self):
        import api.signals             # Charge les signals
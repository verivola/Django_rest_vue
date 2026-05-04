from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Transaction
from .serializers import TransactionSerializer

@receiver(post_save, sender=Transaction)
def transaction_saved(sender, instance, created, **kwargs):
    serializer = TransactionSerializer(instance)
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        "transactions",
        {
            "type": "transaction_event",
            "data": {
                "type": "created" if created else "updated",
                "transaction": serializer.data
            }
        }
    )

@receiver(post_delete, sender=Transaction)
def transaction_deleted(sender, instance, **kwargs):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        "transactions",
        {
            "type": "transaction_event",
            "data": {
                "type": "deleted",
                "id": str(instance.id)
            }
        }
    )
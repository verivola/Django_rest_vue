from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        await self.accept()
        # Rejoindre le groupe pour recevoir les notifications
        await self.channel_layer.group_add("transactions", self.channel_name)
        print("🔥 WebSocket connecté")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("transactions", self.channel_name)
        print("❌ WebSocket déconnecté")

    # Recevoir les messages du groupe (venant des signals)
    async def transaction_event(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    async def receive(self, text_data):
        # Optionnel : pour tester
        data = json.loads(text_data)
        await self.send(text_data=json.dumps({
            "message": "Message reçu par le serveur",
            "data": data
        }))
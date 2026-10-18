# Avisos de pedidos por Telegram

Cada vez que alguien hace un pedido en la tienda, te llega un mensaje a Telegram con
el cliente, su WhatsApp (se abre con un toque), la dirección, los productos y el total.

Si no configuras nada, la tienda funciona igual: solo no envía avisos.

## 1. Crear el bot (2 minutos, desde el teléfono)

1. Abre Telegram y busca **@BotFather** (tiene una palomita azul de verificado).
2. Toca **Iniciar** y escribe `/newbot`.
3. Te pide un nombre: por ejemplo `Pedidos GutiStore`.
4. Te pide un usuario que termine en `bot`: por ejemplo `gutistore_pedidos_bot`.
5. Te responde con un **token** parecido a `8123456789:AAH...xyz`. Cópialo y guárdalo.
   Es como una contraseña: no lo compartas.

## 2. Saber tu ID de chat

1. Busca tu bot nuevo en Telegram (por el usuario que elegiste) y toca **Iniciar**.
   Esto es obligatorio: un bot no puede escribirte si tú no le escribiste primero.
2. Busca **@userinfobot**, toca **Iniciar** y te responde con tu **Id** (un número
   como `123456789`). Cópialo.

¿Quieres que le llegue a más de una persona? Cada una hace el paso 2 y pones los
números separados por coma: `123456789,987654321`.

¿Prefieres un grupo? Crea el grupo, agrega el bot y escribe cualquier cosa. Luego abre
en el navegador `https://api.telegram.org/botTU_TOKEN/getUpdates` y busca `"chat":{"id":-100...`.
Ese número (con el signo menos) es el ID del grupo.

## 3. Ponerlo en Vercel

1. Entra a vercel.com → tu proyecto de la tienda → **Settings** → **Environment Variables**.
2. Agrega `TELEGRAM_BOT_TOKEN` con el token del paso 1.
3. Agrega `TELEGRAM_CHAT_ID` con el ID del paso 2.
4. Ve a **Deployments**, abre los tres puntos del último despliegue y elige **Redeploy**.
   Las variables nuevas solo se aplican después de volver a desplegar.

## 4. Probar

Haz un pedido de prueba en la tienda. En segundos te llega el aviso.
Si no llega, revisa que le diste **Iniciar** a tu bot y que el ID no tenga espacios.
Los errores quedan en Vercel → **Logs**, con el texto "Aviso de Telegram no enviado".

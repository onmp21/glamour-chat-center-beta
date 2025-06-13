# Documentação da API Evolution - Envio de Mensagens

## Endpoint para Envio de Mensagem de Texto

**URL:** `POST /message/sendText/{instance}`

**Headers:**
- `Content-Type: application/json`
- `apikey: <api-key>`

**Parâmetros da URL:**
- `{instance}`: Nome da instância configurada

**Body da Requisição:**
```json
{
  "number": "<string>",
  "text": "<string>",
  "delay": 123,
  "linkPreview": true,
  "mentionsEveryOne": true,
  "mentioned": [
    "{remoteJID}"
  ],
  "quoted": {
    "key": {
      "id": "<string>"
    },
    "message": {
      "conversation": "<string>"
    }
  }
}
```

**Campos Obrigatórios:**
- `number`: Número do destinatário (formato: 5511999999999)
- `text`: Texto da mensagem

**Campos Opcionais:**
- `delay`: Delay em segundos antes de enviar
- `linkPreview`: Mostrar preview de links (true/false)
- `mentionsEveryOne`: Mencionar todos (true/false)
- `mentioned`: Array de IDs para mencionar
- `quoted`: Objeto para responder uma mensagem específica

**Resposta de Sucesso (201):**
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "message_id"
  },
  "message": {
    "conversation": "texto da mensagem"
  },
  "messageTimestamp": 1234567890,
  "status": "PENDING"
}
```

## Outros Endpoints Disponíveis:
- Send Status
- Send Media
- Send WhatsApp Audio
- Send Sticker
- Send Location
- Send Contact
- Send Reaction
- Send Poll
- Send List
- Send Buttons

## Estrutura para Integração:
1. Usar a instância configurada no canal
2. Obter o número do contato do canal
3. Enviar mensagem via API Evolution
4. Salvar mensagem no Supabase
5. Exibir mensagem no chat


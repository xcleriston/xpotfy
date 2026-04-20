# 📋 Instruções de Compartilhamento - Service Account

## 🔑 Dados do Service Account

- **Email**: `eventos@games-417200.iam.gserviceaccount.com`
- **Project ID**: `games-417200`
- **Status**: ✅ Autenticado e funcionando

## 📅 PASSO OBRIGATÓRIO: Compartilhar Calendário

Para que o Service Account possa criar eventos no seu calendário, você precisa:

### 1. Acessar Google Calendar
- Vá para [Google Calendar](https://calendar.google.com/)
- Clique no ícone de engrenagem ⚙️ (Configurações)
- Selecione "Configurações"

### 2. Compartilhar Calendário Principal
- No menu lateral esquerdo, clique em "Meus calendários"
- Passe o mouse sobre seu calendário principal
- Clique nos três pontos (⋮) → "Configurações e compartilhamento"
- Role até "Compartilhar com pessoas específicas"
- Clique em "Adicionar pessoas"

### 3. Adicionar Service Account
- **Email**: `eventos@games-417200.iam.gserviceaccount.com`
- **Permissões**: **"Fazer alterações em eventos"** (Importante!)
- Clique em "Enviar"

## 🚀 Após Compartilhar

Execute o comando:
```bash
python main_service.py --auto-confirm
```

## 📧 O Que Acontecerá

1. **12 eventos** serão criados automaticamente
2. **24 convites** enviados (2 por evento)
3. **Eventos de deslocamento** entre as semanas
4. **Dias de folga** marcados

## 🔧 Se Tiver Problemas

### "Permissão negada"
- Verifique se deu permissão de "Fazer alterações em eventos"
- Aguarde alguns minutos após compartilhar

### "Calendário não encontrado"
- Confirme o email do Service Account
- Verifique se está compartilhando o calendário correto

## ✅ Verificação

Para testar se funcionou:
```bash
python main_service.py --calendar-info
```

Deve mostrar seu calendário principal na lista.

---

## 🎉 Sistema Pronto!

Após compartilhar o calendário, o sistema estará 100% funcional para criar eventos com participantes!

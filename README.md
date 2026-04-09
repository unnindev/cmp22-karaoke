# KaraokeLocal 🎤

Sistema de karaokê doméstico com vídeos do YouTube.

---

## Requisitos

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **yt-dlp** para download de vídeos
- Windows 10/11

---

## Instalação

### 1. Instalar dependências do Node

```bash
npm install
```

### 2. Instalar yt-dlp

**Opção A — via pip (recomendado):**
```bash
pip install yt-dlp
```

**Opção B — executável direto:**
- Baixe `yt-dlp.exe` em https://github.com/yt-dlp/yt-dlp/releases
- Coloque na pasta `bin/` do projeto

### 3. Iniciar o app

```bash
npm start
```

---

## Como usar

### Baixar uma música

1. Vá para a aba **Download**
2. Cole a URL do YouTube (vídeo de karaokê)
3. Clique em **Buscar** — o app carrega título, thumbnail e duração
4. Edite os metadados: título, artista, idioma, gênero
5. Clique em **Baixar música**

A música aparece automaticamente na biblioteca ao terminar.

### Tocar uma música

- **Duplo clique** em qualquer música na biblioteca: abre o modal de fila
- Clique **▶ Tocar agora** para tocar imediatamente
- Clique **+ Fila** para adicionar à fila (você pode informar quem vai cantar)

### Gerenciar a fila

- Aba **Fila** mostra todas as músicas na ordem
- O app toca automaticamente a próxima ao terminar cada música
- Botão **×** remove da fila
- **Limpar fila** remove tudo

### Editar metadados

- Clique no ícone ✏️ ao lado de qualquer música
- Edite título, artista, idioma ou gênero
- **Excluir** remove a música da biblioteca E o arquivo de vídeo do disco

---

## Configuração de áudio (Focusrite Scarlett 2i2)

1. No Windows, defina a Scarlett como dispositivo de saída padrão
2. Abra o **Focusrite Control** e configure o monitor mix:
   - Input 1/2: microfones
   - DAW (saída do PC): áudio das músicas
3. Conecte as caixas nas saídas da Scarlett

O controle de volume dentro do app controla o volume do vídeo. O volume dos microfones é controlado pelo Focusrite Control ou pelos botões de gain da Scarlett.

---

## Tela de palco (TV / segundo monitor)

A janela de palco abre automaticamente no segundo monitor se detectado.
Se não tiver segundo monitor, abre como janela separada — mova manualmente para a TV.

---

## Estrutura de pastas

```
karaoke-local/
├── bin/           ← coloque yt-dlp.exe aqui (opcional)
├── assets/songs/  ← pasta padrão de músicas (configurável)
├── src/
│   ├── control/   ← interface de controle
│   └── stage/     ← tela do palco
├── main.js        ← processo principal
├── preload.js     ← bridge IPC
└── db.js          ← banco SQLite
```

O banco de dados (`karaoke.db`) e as configurações ficam em:
- Windows: `%APPDATA%\karaoke-local\`

---

## Solução de problemas

**"yt-dlp não encontrado"**
→ Instale via `pip install yt-dlp` ou coloque o `.exe` na pasta `bin/`

**Vídeo não toca na janela de palco**
→ Verifique se o arquivo foi baixado na pasta configurada em Config

**Áudio sem latência ruim no microfone**
→ No Focusrite Control, ative o "Direct Monitor" para ouvir o microfone com latência zero

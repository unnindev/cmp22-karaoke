# Configuração do Voicemeeter Banana para CMP22 Karaokê

## O que você vai conseguir

Microfone (Scarlett) + Áudio das músicas → misturados → saindo pela TV via HDMI.
Latência do microfone abaixo de 10ms, imperceptível ao cantar.

---

## 1. Instalar o Voicemeeter Banana

- Baixe em: **vb-audio.com/Voicemeeter/banana.htm**
- Instale e **reinicie o PC** (obrigatório, instala drivers de áudio virtual)

---

## 2. Configurar a saída de áudio do Windows

Após reiniciar, clique com botão direito no ícone de som na barra de tarefas:

**Som → Reprodução**

Defina como padrão: **VoiceMeeter Input** (não o HDMI, não a Scarlett)

Isso faz o áudio das músicas do CMP22 ir para o Voicemeeter automaticamente.

---

## 3. Abrir o Voicemeeter Banana

A interface tem 3 seções principais:
- **Esquerda:** entradas de hardware (microfones)
- **Centro:** entradas virtuais (áudio do PC)
- **Direita:** saídas (onde o som vai)

---

## 4. Configurar o microfone (entrada de hardware)

No painel esquerdo, clique em **HARDWARE INPUT 1**:
- Selecione: **Focusrite USB ASIO** (ou "Scarlett 2i2 USB")
- Se aparecer opção ASIO, sempre prefira ela (menor latência)

Abaixo do nome do dispositivo, ative o botão **A1** nessa faixa
(isso manda o microfone para a saída principal)

---

## 5. Configurar o áudio das músicas (entrada virtual)

No painel central, a faixa **VIRTUAL INPUT** já recebe o áudio do Windows automaticamente (porque você definiu VoiceMeeter Input como padrão no passo 2).

Ative o botão **A1** nessa faixa também.

---

## 6. Configurar a saída para a TV (A1)

No painel direito, clique em **A1** e selecione:
- **HDMI** (ou o nome da sua TV como aparece no Windows)

Isso é a saída master, onde tudo vai se misturar.

---

## 7. Configurar o driver ASIO (latência baixa)

No menu superior do Voicemeeter:
**Menu → System Settings / Options**

- **Preferred Main SampleRate:** 48000 Hz
- Em **ASIO Driver:** selecione **Focusrite USB ASIO**
- **Buffer Size:** 256 (bom equilíbrio entre latência e estabilidade)
  - Se travar o áudio: aumente para 512
  - Se quiser menos latência: tente 128

---

## 8. Controle de volume

No Voicemeeter você tem controle independente de:
- Volume do microfone (faixa do HARDWARE INPUT 1)
- Volume das músicas (faixa do VIRTUAL INPUT)
- Volume master de saída (faixa A1 no painel direito)

Suba os dois faders para aproximadamente 0dB como ponto de partida e ajuste conforme o gosto.

---

## 9. Iniciar com o Windows (recomendado)

No menu do Voicemeeter:
**Menu → System Tray (Run at Startup)**

Assim ele já está rodando quando você ligar o laptop.

**Importante:** sempre abra o Voicemeeter ANTES de abrir o CMP22 Karaokê.

---

## Fluxo resumido

```
Microfone → Scarlett 2i2 → Voicemeeter HARDWARE INPUT 1 ┐
                                                          ├→ A1 → HDMI → TV
Músicas → Windows → Voicemeeter VIRTUAL INPUT             ┘
```

---

## Problemas comuns

**Não escuto o microfone:**
→ Verifique se o botão A1 está ativo na faixa do HARDWARE INPUT 1

**Áudio das músicas não aparece no Voicemeeter:**
→ Confirme que VoiceMeeter Input está como dispositivo de reprodução padrão no Windows

**Travamentos ou crackling no áudio:**
→ Aumente o Buffer Size para 512 nas configurações ASIO

**Eco da voz:**
→ Desative o monitoramento direto no Focusrite Control (Direct Monitor off)

**Microfone com muito eco da TV:**
→ Diminua o volume da TV ou afaste o microfone da TV

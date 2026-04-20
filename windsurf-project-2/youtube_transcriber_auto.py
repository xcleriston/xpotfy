#!/usr/bin/env python3
"""
Versão automática do script com credenciais pré-configuradas para vídeos privados
"""

from youtube_transcriber import YouTubeTranscriber

def main():
    """Função principal com credenciais pré-definidas"""
    print("=== YouTube 5 Seconds Transcriber (Auto) ===\n")
    
    # Credenciais pré-configuradas
    email = "despertabm@gmail.com"
    password = "Pa@$sPkJe0BelEz@855"
    
    # Configuração
    channel_url = input("Digite a URL do canal do YouTube: ").strip()
    
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número máximo de vídeos (padrão 10): ") or "10")
    except:
        max_videos = 10
    
    # Inicia o transcritor com credenciais
    transcriber = YouTubeTranscriber(headless=False, email=email, password=password)
    
    try:
        videos = transcriber.process_channel(channel_url, max_videos)
        
        print(f"\nResumo:")
        print(f"- Total de vídeos processados: {len(videos)}")
        print(f"- Transcrições obtidas: {sum(1 for v in videos if v['transcription'] and '[Transcrição não disponível]' not in v['transcription'])}")
        
    except KeyboardInterrupt:
        print("\nOperação cancelada pelo usuário.")
    except Exception as e:
        print(f"\nErro durante a execução: {e}")
    finally:
        transcriber.close()

if __name__ == "__main__":
    main()

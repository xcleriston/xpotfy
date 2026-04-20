#!/usr/bin/env python3
"""
Versão simplificada que foca em funcionalidade básica sem complexidades
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class YouTubeSimpleTranscriber:
    def __init__(self):
        """Conexão simples com Chrome"""
        try:
            chrome_options = Options()
            chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✅ Conectado ao Chrome!")
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            raise
    
    def process_videos_from_debug_file(self):
        """Usa o arquivo debug existente para processar vídeos"""
        try:
            # Lê o arquivo debug que já tem os vídeos
            with open('debug_videos_20260309_230952.json', 'r', encoding='utf-8') as f:
                videos = json.load(f)
            
            print(f"📁 Carregados {len(videos)} vídeos do arquivo debug")
            
            # Processa apenas os vídeos únicos (remove duplicatas)
            unique_videos = {}
            for video in videos:
                url = video.get('url', '')
                if '/watch?v=' in url:
                    # Extrai ID do vídeo para remover duplicatas
                    video_id = url.split('v=')[1].split('&')[0]
                    if video_id not in unique_videos:
                        unique_videos[video_id] = video
            
            videos_list = list(unique_videos.values())
            print(f"📺 {len(videos_list)} vídeos únicos para processar")
            
            return videos_list
            
        except Exception as e:
            print(f"❌ Erro ao ler arquivo debug: {e}")
            return []
    
    def get_transcription_simple(self, video_url):
        """Transcrição simples e robusta"""
        try:
            print(f"   🎥 Processando vídeo...")
            
            # Abre URL diretamente (sem nova aba para simplificar)
            self.driver.get(video_url)
            time.sleep(8)  # Tempo para carregar
            
            # Tenta reproduzir de forma simples
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                self.driver.execute_script("arguments[0].click();", play_button)
                print("      ▶️ Reproduzindo 5 segundos...")
                time.sleep(6)  # 5 segundos + margem
            except:
                print("      ⚠️ Não foi possível reproduzir, aguardando...")
                time.sleep(6)
            
            # Extrai legendas de forma simples
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 {len(captions)} segmentos")
                else:
                    print("      📝 Sem legendas visíveis")
            except:
                print("      📝 Erro ao extrair legendas")
            
            return transcription if transcription else "[Sem transcrição]"
            
        except Exception as e:
            print(f"      ❌ Erro: {e}")
            return "[Erro]"
    
    def process_all_videos(self, max_videos=50):
        """Processa todos os vídeos de forma simples"""
        print("🎬 YouTube Simple Transcriber")
        print("="*50)
        print("Versão simplificada e robusta")
        print("="*50)
        
        # 1. Carrega vídeos do arquivo debug
        videos = self.process_videos_from_debug_file()
        if not videos:
            print("❌ Nenhum vídeo encontrado!")
            return []
        
        # 2. Limita número de vídeos
        videos = videos[:max_videos]
        print(f"\n📋 Processando {len(videos)} vídeos...")
        
        successful = 0
        failed = 0
        
        # 3. Processa cada vídeo
        for i, video in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] {video['title'][:50]}...")
            
            transcription = self.get_transcription_simple(video['url'])
            video['transcription'] = transcription
            
            if "[Transcrição" not in transcription and "[Erro" not in transcription:
                successful += 1
                print(f"      ✅ Sucesso!")
            else:
                failed += 1
                print(f"      ❌ Falha")
            
            time.sleep(3)  # Pausa entre vídeos
        
        # 4. Salva resultados
        self.save_results(videos, successful, failed)
        return videos
    
    def save_results(self, videos, successful, failed):
        """Salva resultados de forma simples"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_simples_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_simples_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES SIMPLIFICADAS\n")
            f.write("="*50 + "\n\n")
            
            for i, video in enumerate(videos):
                status = "✅" if "[Transcrição" not in video['transcription'] and "[Erro" not in video['transcription'] else "❌"
                f.write(f"\n{status} {i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*40 + "\n")
        
        print(f"\n🎉 PROCESSO CONCLUÍDO!")
        print(f"📊 RESUMO:")
        print(f"   🎥 Total: {len(videos)}")
        print(f"   ✅ Sucesso: {successful}")
        print(f"   ❌ Falha: {failed}")
        if videos:
            print(f"   📈 Taxa: {(successful/len(videos)*100):.1f}%")
        
        print(f"\n✅ Arquivos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Mantém Chrome aberto"""
        print("🔗 Chrome mantido aberto")

def main():
    print("🎬 YouTube Simple Transcriber")
    print("="*50)
    print("Versão simplificada - usa arquivo debug existente")
    print("="*50)
    
    try:
        max_videos = int(input("Número de vídeos (padrão 20): ") or "20")
    except:
        max_videos = 20
    
    try:
        transcriber = YouTubeSimpleTranscriber()
        videos = transcriber.process_all_videos(max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Cancelado.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()

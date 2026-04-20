#!/usr/bin/env python3
"""
Script simples que acessa cada vídeo, assiste 5 segundos e adiciona transcrição
"""

import time
import json
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

def main():
    print("🎬 YouTube Transcribe Videos")
    print("="*50)
    print("Acessa cada vídeo e adiciona transcrição de 5 segundos")
    print("="*50)
    
    # Conecta ao Chrome existente
    try:
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        driver = webdriver.Chrome(options=chrome_options)
        print("✅ Conectado ao Chrome!")
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return
    
    # Carrega a lista de vídeos do arquivo debug
    try:
        with open('debug_videos_20260309_230952.json', 'r', encoding='utf-8') as f:
            videos = json.load(f)
        print(f"📁 Carregados {len(videos)} vídeos")
    except Exception as e:
        print(f"❌ Erro ao carregar vídeos: {e}")
        return
    
    # Remove duplicatas pelo ID do vídeo
    unique_videos = {}
    for video in videos:
        url = video.get('url', '')
        if '/watch?v=' in url:
            video_id = url.split('v=')[1].split('&')[0]
            if video_id not in unique_videos:
                unique_videos[video_id] = video
    
    videos_list = list(unique_videos.values())
    print(f"📺 {len(videos_list)} vídeos únicos")
    
    # Pergunta quantos vídeos processar
    try:
        max_videos = int(input("Quantos vídeos processar (padrão 20): ") or "20")
    except:
        max_videos = 20
    
    videos_list = videos_list[:max_videos]
    print(f"\n📋 Processando {len(videos_list)} vídeos...")
    
    successful = 0
    failed = 0
    
    # Processa cada vídeo
    for i, video in enumerate(videos_list):
        print(f"\n[{i+1}/{len(videos_list)}] {video['title'][:50]}...")
        
        try:
            # Acessa o vídeo
            driver.get(video['url'])
            time.sleep(8)  # Tempo para carregar
            
            # Tenta reproduzir
            try:
                play_button = driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                driver.execute_script("arguments[0].click();", play_button)
                print("      ▶️ Reproduzindo 5 segundos...")
                time.sleep(6)  # 5 segundos + margem
            except:
                print("      ⚠️ Não conseguiu reproduzir, aguardando...")
                time.sleep(6)
            
            # Extrai legendas
            transcription = ""
            try:
                captions = driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 {len(captions)} segmentos")
                else:
                    print("      📝 Sem legendas")
            except:
                print("      📝 Erro ao extrair legendas")
            
            # Atualiza a transcrição no vídeo
            video['transcription'] = transcription if transcription else "[Sem transcrição]"
            
            if "[Transcrição" not in video['transcription']:
                successful += 1
                print("      ✅ Sucesso!")
            else:
                failed += 1
                print("      ❌ Sem transcrição")
            
        except Exception as e:
            print(f"      ❌ Erro: {e}")
            video['transcription'] = "[Erro]"
            failed += 1
        
        time.sleep(3)  # Pausa entre vídeos
    
    # Salva resultados atualizados
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    
    # JSON atualizado
    json_file = f"videos_com_transcric_{timestamp}.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(videos_list, f, ensure_ascii=False, indent=2)
    
    # TXT
    txt_file = f"videos_com_transcric_{timestamp}.txt"
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write("VÍDEOS COM TRANSCRIÇÕES - 5 SEGUNDOS\n")
        f.write("="*50 + "\n\n")
        
        for i, video in enumerate(videos_list):
            status = "✅" if "[Transcrição" not in video['transcription'] and "[Erro]" not in video['transcription'] else "❌"
            f.write(f"\n{status} {i+1}. {video['title']}\n")
            f.write(f"URL: {video['url']}\n")
            f.write(f"Transcrição: {video['transcription']}\n")
            f.write("-"*40 + "\n")
    
    print(f"\n🎉 PROCESSO CONCLUÍDO!")
    print(f"📊 RESUMO:")
    print(f"   🎥 Total: {len(videos_list)}")
    print(f"   ✅ Sucesso: {successful}")
    print(f"   ❌ Falha: {failed}")
    if videos_list:
        print(f"   📈 Taxa: {(successful/len(videos_list)*100):.1f}%")
    
    print(f"\n✅ Arquivos salvos:")
    print(f"   📄 {json_file}")
    print(f"   📄 {txt_file}")
    
    print("\n🔗 Chrome mantido aberto")

if __name__ == "__main__":
    main()

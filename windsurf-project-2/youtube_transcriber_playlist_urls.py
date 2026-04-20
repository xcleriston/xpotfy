#!/usr/bin/env python3
"""
Script para capturar URLs das playlists do canal
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

class YouTubePlaylistURLExtractor:
    def __init__(self):
        """Conecta ao Chrome existente"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)
        
    def extract_playlist_urls(self, channel_url):
        """Extrai URLs das playlists do canal"""
        print(f"🔍 Extraindo URLs de playlists: {channel_url}")
        self.driver.get(channel_url)
        time.sleep(3)
        
        # Rola a página para carregar mais conteúdo
        print("🔄 Carregando conteúdo...")
        for i in range(5):
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
        
        # Encontra todos os links de playlists
        playlists = []
        
        # Procura por diferentes tipos de elementos de playlist
        playlist_selectors = [
            "a[href*='/playlist?list=']",
            "ytd-grid-playlist-renderer a[href*='/playlist?list=']",
            "ytd-playlist-renderer a[href*='/playlist?list=']",
            ".ytd-grid-playlist-renderer a"
        ]
        
        for selector in playlist_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                print(f"   Seletor '{selector}': {len(elements)} elementos")
                
                for elem in elements:
                    try:
                        href = elem.get_attribute("href")
                        if href and "playlist?list=" in href:
                            title = elem.text.strip() or elem.get_attribute("title") or "Sem título"
                            
                            # Remove duplicatas
                            if not any(p['url'] == href for p in playlists):
                                playlists.append({
                                    "title": title,
                                    "url": href
                                })
                                print(f"      📋 {title[:50]} -> {href}")
                                
                    except Exception as e:
                        continue
                        
            except Exception as e:
                print(f"   Erro com seletor '{selector}': {e}")
                continue
        
        # Se não encontrou suficientes, tenta método manual
        if len(playlists) < 10:
            print("\n🔍 Tentando método manual...")
            try:
                # Procura por qualquer elemento que contenha "playlist"
                all_links = self.driver.find_elements(By.TAG_NAME, "a")
                for link in all_links:
                    try:
                        href = link.get_attribute("href")
                        if href and "playlist?list=" in href:
                            title = link.text.strip() or link.get_attribute("title") or "Sem título"
                            
                            if not any(p['url'] == href for p in playlists):
                                playlists.append({
                                    "title": title,
                                    "url": href
                                })
                                print(f"      📋 {title[:50]} -> {href}")
                                
                    except:
                        continue
                        
            except Exception as e:
                print(f"   Erro no método manual: {e}")
        
        print(f"\n✅ Total de playlists encontradas: {len(playlists)}")
        return playlists
    
    def manual_playlist_extraction(self, channel_url):
        """Modo manual para extrair URLs"""
        print(f"\n🖱️ MODO MANUAL DE EXTRAÇÃO")
        print("="*50)
        
        self.driver.get(channel_url)
        time.sleep(3)
        
        print("\n📋 INSTRUÇÕES:")
        print("1. Navegue no Chrome até encontrar as playlists")
        print("2. Clique em cada playlist para ver os vídeos")
        print("3. Quando estiver em uma página de playlist, pressione Enter")
        print("4. Repita para todas as playlists que quiser processar")
        
        playlists = []
        
        while True:
            print(f"\n📋 Playlists capturadas: {len(playlists)}")
            
            # Pega URL atual se for playlist
            current_url = self.driver.current_url
            if "playlist?list=" in current_url:
                # Tenta pegar título da playlist
                try:
                    title_elem = self.driver.find_element(By.CSS_SELECTOR, "h1.ytd-playlist-header-renderer, #title")
                    title = title_elem.text.strip()
                except:
                    title = f"Playlist {len(playlists)+1}"
                
                # Verifica se já não foi capturada
                if not any(p['url'] == current_url for p in playlists):
                    playlists.append({
                        "title": title,
                        "url": current_url
                    })
                    print(f"✅ Capturada: {title}")
            
            # Pergunta se quer continuar
            continuar = input("\nCapturar outra playlist? (s/n): ").strip().lower()
            if continuar != 's':
                break
        
        return playlists
    
    def save_playlist_urls(self, playlists):
        """Salva as URLs das playlists"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"playlist_urls_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(playlists, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"playlist_urls_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("URLS DAS PLAYLISTS ENCONTRADAS\n")
            f.write("="*50 + "\n\n")
            
            for i, playlist in enumerate(playlists):
                f.write(f"{i+1}. {playlist['title']}\n")
                f.write(f"URL: {playlist['url']}\n")
                f.write("-"*50 + "\n\n")
        
        print(f"\n✅ URLs salvas:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
        
        return json_file
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🔗 YouTube Playlist URL Extractor")
    print("="*50)
    print("Extrai URLs das playlists para processamento")
    print("="*50)
    
    channel_url = input("\nURL do canal: ").strip()
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        extractor = YouTubePlaylistURLExtractor()
        
        print("\n📋 ESCOLHA O MODO:")
        print("1. Extração automática")
        print("2. Modo manual (navegue e capture)")
        
        choice = input("\nEscolha (1-2): ").strip()
        
        if choice == "2":
            playlists = extractor.manual_playlist_extraction(channel_url)
        else:
            playlists = extractor.extract_playlist_urls(channel_url)
        
        if playlists:
            extractor.save_playlist_urls(playlists)
            print(f"\n🎯 Pronto para processar {len(playlists)} playlists!")
            print("Agora execute o script de transcrição com estas URLs.")
        else:
            print("\n❌ Nenhuma playlist encontrada.")
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'extractor' in locals():
            extractor.close()

if __name__ == "__main__":
    main()

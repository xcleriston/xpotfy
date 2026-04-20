#!/usr/bin/env python3
"""
Processa a lista completa dos 206 vídeos fornecida pelo usuário
"""

import time
import json
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class YouTubeCompleteListTranscriber:
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
    
    def parse_video_list(self, video_text):
        """Converte o texto da lista em dicionário de vídeos"""
        videos = []
        lines = video_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or ':' not in line:
                continue
            
            # Encontra a URL no final da linha
            url_match = re.search(r'(https://studio\.youtube\.com/video/[^/s]+)', line)
            if url_match:
                studio_url = url_match.group(1)
                video_id = studio_url.split('/')[-2]  # Pega o ID da URL
                
                # Extrai título (tudo antes da URL)
                title = line.replace(studio_url, '').strip().rstrip(':')
                
                # Converte para URL do YouTube normal
                youtube_url = f"https://www.youtube.com/watch?v={video_id}"
                
                videos.append({
                    "title": title,
                    "studio_url": studio_url,
                    "youtube_url": youtube_url,
                    "video_id": video_id,
                    "transcription": ""
                })
        
        return videos
    
    def get_transcription_simple(self, video_url):
        """Transcrição simples e robusta"""
        try:
            print(f"   🎥 Processando...")
            
            # Abre URL do YouTube (não do Studio)
            self.driver.get(video_url)
            time.sleep(8)  # Tempo para carregar
            
            # Tenta reproduzir
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                self.driver.execute_script("arguments[0].click();", play_button)
                print("      ▶️ Reproduzindo 5 segundos...")
                time.sleep(6)  # 5 segundos + margem
            except:
                print("      ⚠️ Não foi possível reproduzir, aguardando...")
                time.sleep(6)
            
            # Extrai legendas
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 {len(captions)} segmentos")
                else:
                    print("      📝 Sem legendas")
            except:
                print("      📝 Erro ao extrair legendas")
            
            return transcription if transcription else "[Sem transcrição]"
            
        except Exception as e:
            print(f"      ❌ Erro: {e}")
            return "[Erro]"
    
    def process_all_videos(self, video_text, max_videos=50):
        """Processa todos os vídeos da lista"""
        print("🎬 YouTube Complete List Transcriber")
        print("="*60)
        print("Processando a lista completa dos 206 vídeos")
        print("="*60)
        
        # 1. Parse da lista
        videos = self.parse_video_list(video_text)
        print(f"📋 {len(videos)} vídeos encontrados na lista")
        
        # 2. Limita número de vídeos
        videos = videos[:max_videos]
        print(f"\n📋 Processando {len(videos)} vídeos...")
        
        successful = 0
        failed = 0
        
        # 3. Processa cada vídeo
        for i, video in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] {video['title'][:50]}...")
            
            transcription = self.get_transcription_simple(video['youtube_url'])
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
        """Salva resultados"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_completas_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_completas_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES COMPLETAS - LISTA DE 206 VÍDEOS\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                status = "✅" if "[Transcrição" not in video['transcription'] and "[Erro" not in video['transcription'] else "❌"
                f.write(f"\n{status} {i+1}. {video['title']}\n")
                f.write(f"URL: {video['youtube_url']}\n")
                f.write(f"Studio: {video['studio_url']}\n")
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
    print("🎬 YouTube Complete List Transcriber")
    print("="*60)
    print("Processa a lista completa dos 206 vídeos")
    print("="*60)
    
    # Lista completa dos vídeos fornecida
    video_list_text = """
AULA 5 8 FASES DO ATENDIMENTO: https://studio.youtube.com/video/AAkae_NxBDo/edit
AULA 4 ANATOMIA DA PELE: https://studio.youtube.com/video/Umw9viUAHlY/edit
AULA 3: https://studio.youtube.com/video/hqh2ErasDai0P2E/edit
AULA 2: https://studio.youtube.com/video/LzqMGvaZBM8/edit
AULA 1: https://studio.youtube.com/video/4zztlCUCCy0/edit
AULA 11 PRÁTICA: https://studio.youtube.com/video/XRQyasA4Whg/edit
AULA 10 PREPARAÇÃO PARA A PRÁTICA: https://studio.youtube.com/video/RnpU0ZHfwwU/edit
AULA 9 EPILAÇÃO EGÍPCIA: https://studio.youtube.com/video/ucjBSYO8iUc/edit
AULA 8: https://studio.youtube.com/video/IYKUfy1n9tQ/edit
AULA 7: https://studio.youtube.com/video/ZXARU3As3Ks/edit
AULA 6: https://studio.youtube.com/video/HWXpxK-aKx4/edit
3 Conceitos de biossegurança; Panorama atual: https://studio.youtube.com/video/z_cCDlJF36A/edit
2 Quem é o Dr Biossegurança: https://studio.youtube.com/video/9EqCmSDDC2k/edit
1 Apresentação Como será o curso: https://studio.youtube.com/video/qTphf9MzvMs/edit
21 Noções de Microbiologia: https://studio.youtube.com/video/5zjHjrJpJmE/edit
10 Equipamento de Proteção Individual EPI: https://studio.youtube.com/video/kG335r3kxwY/edit
9 Equipamento de Proteção Coletiva EPC: https://studio.youtube.com/video/O8mPCR74T3I/edit
8 Estrutura física adequada: https://studio.youtube.com/video/PgJ8GAGC0uo/edit
7 Riscos ocupacionais nos SIPS Serviço de Interesse Para a Saúde: https://studio.youtube.com/video/IttFMqvBRug/edit
6 Infecções é importante conhecer: https://studio.youtube.com/video/Lqa_xYwkqiA/edit
5 Percepção do invisível: https://studio.youtube.com/video/H1PejgARo2M/edit
4 Energia positiva & Biossegurança: https://studio.youtube.com/video/LmlyP8cdFXo/edit
13 TRICOLOGIA ALOPECIA ANDROGENÉTICA: https://studio.youtube.com/video/2ZH7OYajYJQ/edit
12 TRICOLOGIA PATOLOGIAS ALOPECIA AREATA: https://studio.youtube.com/video/dZk-TW7D8xg/edit
12 TRICOLOGIA PATOLOGIAS ALOPECIA ANDROGENÉTICA 1: https://studio.youtube.com/video/Z8ieHn53DTY/edit
11 TRICOLOGIA CICLO CAPILAR 2: https://studio.youtube.com/video/V2UZJwtI8Dc/edit
11 TRICOLOGIA CICLO CAPILAR 1: https://studio.youtube.com/video/CwRne-If8cI/edit
10 TRICOLOGIA FORMATO DO CABELO: https://studio.youtube.com/video/iybFN5f9IXk/edit
9 TRICOLOGIA LIGAÇÕES QUÍMICAS NO CÓRTEX: https://studio.youtube.com/video/jTBIev0N0zM/edit
8 TRICOLOGIA MORFOLOGIA DO FOLÍCULO: https://studio.youtube.com/video/9YW2p19Ja9g/edit
7 TRICOLOGIA ESTUTURA DO FOLICULO PILOSO: https://studio.youtube.com/video/wpgqqDpmPFM/edit
6 TRICOLOGIA COBERTURA CAPILAR: https://studio.youtube.com/video/VCB4m2u0JTc/edit
5 TRICOLOGIA TRICOSCOPIA: https://studio.youtube.com/video/6e5Lb9G_MBk/edit
4 TRICOLOGIA TRICOLOGIA: https://studio.youtube.com/video/FbX7_wKr_hk/edit
18 TRICOLOGIA AGRADECIMENTOS: https://studio.youtube.com/video/ZWwqHlkJ2xM/edit
3 TRICOLOGIA A BASE DA TÉCNICA: https://studio.youtube.com/video/_G8uydrSUJY/edit
2 TRICOLOGIA ALINHAMENTO DE EXPECTATIVA: https://studio.youtube.com/video/ntI9VL5mvOI/edit
1 TRICOLOGIA BEM VINDO: https://studio.youtube.com/video/jFzm_PSP8gQ/edit
3 Plano de convivencia sistemica: https://studio.youtube.com/video/pVD_LlYUmyg/edit
2 Tecnologia: https://studio.youtube.com/video/24vNZUbdH9o/edit
1 Marketing e publicidade: https://studio.youtube.com/video/YhvjfEFRODU/edit
11 o futuro depende de voce, final do curso: https://studio.youtube.com/video/XRGg6CvQGxY/edit
10 Portifolio profissional parceiro: https://studio.youtube.com/video/j1Vr22t7Vfg/edit
9 Grande dica: https://studio.youtube.com/video/-dgrWstPSqE/edit
8 Inovaçao continuaçao: https://studio.youtube.com/video/98VIreoX3eU/edit
7 Inovaçao: https://studio.youtube.com/video/Ib5EaLSxqlg/edit
6 Parcerias: https://studio.youtube.com/video/cueRoeZzUoU/edit
5 Politica de pos vendas: https://studio.youtube.com/video/pbZ20_bXXqc/edit
4 Plano de convivencia sistemica continuaçao rateio: https://studio.youtube.com/video/SbC4KgTIVY8/edit
4 Treinamento Biblia do barbeiro 2: https://studio.youtube.com/video/ItFq6Cm6WTo/edit
3 Treinamento Biblia do barbeiro: https://studio.youtube.com/video/W2iOZFSUcms/edit
2 Como conduzir uma entrevista na prática: https://studio.youtube.com/video/6y24SxysNIM/edit
1 8 fases do atendimento feminino na prática 004: https://studio.youtube.com/video/b93EQ93CRSM/edit
8 Plano de carreira profissional: https://studio.youtube.com/video/xksY6MvyNt4/edit
7 Política de reconhecimento para colaboradores: https://studio.youtube.com/video/7Qm65mEcBxo/edit
6 Sanções e méritocracia: https://studio.youtube.com/video/Klj5dYIaxR0/edit
5 Prova de avaliação exemplo: https://studio.youtube.com/video/_vGwIG2pf50/edit
2 Indicação para avaliação de desempenho: https://studio.youtube.com/video/ysNFOZNmERE/edit
1 Avaliação modus operandi: https://studio.youtube.com/video/VtoVEkLS_NU/edit
8 8 fases do atendimento na prática 3: https://studio.youtube.com/video/KYKTJLZ_fog/edit
7 8 fases do atendimento na prática 2: https://studio.youtube.com/video/0Hs2-zMyKW0/edit
6 8 fases do atendimento na prática: https://studio.youtube.com/video/DpiIKB0V5Ic/edit
5 Comportamento de um gestor avaliação: https://studio.youtube.com/video/aqbS2LZeV4Y/edit
4 Planilha curva ABC: https://studio.youtube.com/video/eoYP9dss1a4/edit
3 Planilha configuração: https://studio.youtube.com/video/LiZU2NCLXlQ/edit
4 CORRENTE DO BEM PROCESSO DE RECRUTAMENTO: https://studio.youtube.com/video/Cn3XZRJ0vSQ/edit
3 CORRENTE DO BEM, GESTÃO DE PESSOAS: https://studio.youtube.com/video/yudlVcxRhY8/edit
2 DESIGNER DE CORTE E ESTRUTURA CONTINUAÇÃO: https://studio.youtube.com/video/C4taL9zz00Y/edit
1 DESIGNER DE CORTE E ESTRUTURA: https://studio.youtube.com/video/jkAYiu1coL8/edit
15 8 FASES DO ATENDIMENTO: https://studio.youtube.com/video/7kOo-jZW460/edit
14 ATENDIMENTO: https://studio.youtube.com/video/5vDP7553dbk/edit
12 PLANO DE CARREIRA NA ÁREA DA BELEZA: https://studio.youtube.com/video/OPEBqwWtylc/edit
11 CUSTEIO DO PROFISSIONAL DA BELEZA: https://studio.youtube.com/video/WarH2OxoxQk/edit
10 PLANO DE APRIMORAMENTO PESSOAL E PROFISSIONAL PAP: https://studio.youtube.com/video/ITY5TmySk3A/edit
8 ANÁLISE DE SWOT PESSOAL: https://studio.youtube.com/video/6hVgc3KF5hA/edit
7 ANÁLISE DE RECRUTAMENTO: https://studio.youtube.com/video/jcpIUGvj6_A/edit
6 ENTREVISTA COM A GESTÃO: https://studio.youtube.com/video/93GCzRIhCY8/edit
5 SELEÇÃO BARBEARIA E SALÃO: https://studio.youtube.com/video/DRIH_IHKSd4/edit
13 PARA TER SUCESSO PROFISSIONAL: https://studio.youtube.com/video/6TEWRQY-ZTQ/edit
9 LEI DO SALÃO PARCEIRO: https://studio.youtube.com/video/l9vvETfZz-g/edit
5 Planejamento estratégico: https://studio.youtube.com/video/4amJdJZKRjI/edit
4 Pilares de uma empresa: https://studio.youtube.com/video/wUweyEmoAVo/edit
3 Conceito O que é gestão para uma empresa alcançar o sucesso: https://studio.youtube.com/video/3OlMmXxkKYM/edit
2 Qual a diferença entre gerir um salão e uma barbearia: https://studio.youtube.com/video/y38fV1deVkc/edit
1 Introdução: https://studio.youtube.com/video/NxLdLOrYky4/edit
15 Identificação de gente linha do tempo profissional: https://studio.youtube.com/video/HyNieX5o4tI/edit
14 Foco, força e fé colaborador: https://studio.youtube.com/video/3_UZ4JnhZ2w/edit
13 O grande desafio: https://studio.youtube.com/video/z-4gavZ9HgI/edit
12 Receita, competência CHA: https://studio.youtube.com/video/9B1vQqfzGtU/edit
11 Modelo de gestão O grande desafio: https://studio.youtube.com/video/-hLeIT_dloU/edit
10 Modelo de gestão Diretrizes: https://studio.youtube.com/video/NANzdd6dDsE/edit
9 Modelo de gestão: https://studio.youtube.com/video/xs84Z3UAz4Q/edit
8 Identidade organizacional, nosso sonho: https://studio.youtube.com/video/6iNFJfMlajQ/edit
7 Nossos pilares: https://studio.youtube.com/video/kkQFT25ZdBw/edit
6 Planejamento estratégico na prática: https://studio.youtube.com/video/wvgl9i3pQyk/edit
5 Como gerenciar suas finanças: https://studio.youtube.com/video/4j23-WQVs2A/edit
4 Uso da tecnologia para a gestão: https://studio.youtube.com/video/BFX0UMRKVtQ/edit
3 Centro de custo: https://studio.youtube.com/video/TL9ceOfpk2s/edit
2 O que é gestão Gestão financeira: https://studio.youtube.com/video/5w4AcWgQWV8/edit
1 Introdução Gestão Financeira e Marketing: https://studio.youtube.com/video/B2BbDRZXNMU/edit
8 Final: https://studio.youtube.com/video/euCpmkwUwr4/edit
7 Treinamento para racionalidade do custo e aumento dos lucros: https://studio.youtube.com/video/HvHp4H_2bfc/edit
6 PAP²: https://studio.youtube.com/video/leuIdiiExpU/edit
2 Educação financeira Conceito: https://studio.youtube.com/video/wFWGN37zwW4/edit
1 Por que educação financeira e marketing juntos: https://studio.youtube.com/video/dtYlrS3DRlE/edit
8 Como você controla suas finanças hoje: https://studio.youtube.com/video/2Bwd3aw0ibs/edit
7 PAP²: https://studio.youtube.com/video/C_fhcFOhbt0/edit
6 Como gerenciar suas finanças Guia de bolso: https://studio.youtube.com/video/gP8LfP4N6pE/edit
5 Plano de contas: https://studio.youtube.com/video/dDcxd6QhEnA/edit
4 Planejamento financeiro pessoal e profissional: https://studio.youtube.com/video/0UI27lpmzBk/edit
3 Financeiramente consciente Educação financeira: https://studio.youtube.com/video/0o7fJz1nGwQ/edit
6. O grande desafio.: https://studio.youtube.com/video/vVmBhn3sJYM/edit
5 Vendas confiança, credibilidade: https://studio.youtube.com/video/pDTIfKavarc/edit
4 O que é vender: https://studio.youtube.com/video/WmGrU3rRcgA/edit
3 Qual a melhor profissão do mundo: https://studio.youtube.com/video/xO90UO23vWY/edit
2 O que é atender para você: https://studio.youtube.com/video/bHxap3eXT0U/edit
1 O que é atendimento: https://studio.youtube.com/video/y2Uv5UjwuJ4/edit
15 Continuação e finalização de identificação e relacionamento com os clientes: https://studio.youtube.com/video/CWKZIA6L3Kc/edit
14 Identificação e relacionamento com os clientes: https://studio.youtube.com/video/q7cNxrLMdZA/edit
13 POP detalhado: https://studio.youtube.com/video/NqxhKSaTF0k/edit
12 POP procedimento operacional padrão: https://studio.youtube.com/video/mYjRjxwxNv4/edit
11. Análise de perfil comportamental.: https://studio.youtube.com/video/jie29ToxCOA/edit
10. Habilidades e competência.: https://studio.youtube.com/video/V5ZbGBu3b6s/edit
9. Pré-requesitos do atendimento (para profissional da beleza).: https://studio.youtube.com/video/quuPFu5uA_g/edit
8 Pré requesitos do atendimento: https://studio.youtube.com/video/9peU6Lzq7Ag/edit
7. As 3 necessidades do ser humano.: https://studio.youtube.com/video/gm9wKbQNW8o/edit
MÉTODO DE DESIGN AJ NA JOLIE: https://studio.youtube.com/video/dLxYdr0GFX8/edit
A ESTRUTURA DAS SOBRANCELHAS MASCULINAS: https://studio.youtube.com/video/4QpUK31Wi-Y/edit
A estrutura das sobrancelhas FEMININAS: https://studio.youtube.com/video/ECVJkt9tdd8/edit
Fatores de crescimento: https://studio.youtube.com/video/bVIyYyDFkPY/edit
Fisiologia do pelo: https://studio.youtube.com/video/u1d--YU27LM/edit
Aula 10 Anatomia da pele: https://studio.youtube.com/video/_Uxkg-yOaks/edit
Controle profissional: https://studio.youtube.com/video/WnLbWfOMEvE/edit
Ficha de anamnese: https://studio.youtube.com/video/-tYg-Fn8nqQ/edit
O atendimento Personalizado: https://studio.youtube.com/video/CCvOJ7W5_0w/edit
A profissional: https://studio.youtube.com/video/1nZuocTCnts/edit
Como precificar meu serviço: https://studio.youtube.com/video/0O04rRQqzFA/edit
Final dos cursos: https://studio.youtube.com/video/kXZY6n8MCIE/edit
O que você precisa saber para começar: https://studio.youtube.com/video/243aDLSbTF4/edit
O mundo encantado da beleza: https://studio.youtube.com/video/sfazMrgbYsU/edit
Maquiagem 5 - 8 Fases Técnicas: https://studio.youtube.com/video/4CBGrzN5ch0/edit
Maquiagem 4 - Tipos de Pele: https://studio.youtube.com/video/exKJoWWFScw/edit
Maquiagem 7 - Técnicas para olhos: https://studio.youtube.com/video/G7IsB267kbo/edit
Maquiagem 6 - Técnicas de Pele: https://studio.youtube.com/video/7uuNd72lKuM/edit
Aula Técnica de Maquiagem - Parte 4: https://studio.youtube.com/video/Rsxw2_HoYYE/edit
Aula Técnica de Maquiagem - Parte 3: https://studio.youtube.com/video/7PcNNU-fMGs/edit
Aula Técnica de Maquiagem - Parte 2: https://studio.youtube.com/video/2v-hfqZpr9A/edit
Aula Técnica de Maquiagem - Parte 1: https://studio.youtube.com/video/h_bZBhuEMF0/edit
8. 8 Fases do Atendimento - Maquiagem 3.0.mp4: https://studio.youtube.com/video/C984bGDH8ZQ/edit
7 Atendimento & Fidelização todas: https://studio.youtube.com/video/gZkaYXAGWZs/edit
6. Vendas: https://studio.youtube.com/video/C83X6JTtzmo/edit
5. Código de Vestimenta: https://studio.youtube.com/video/tDHo3KwJaoM/edit
4. Conduta Profissional: https://studio.youtube.com/video/ef18kdz4Lmg/edit
3. Profissional 3.0: https://studio.youtube.com/video/-0g4QAhrHy8/edit
2. Postura Profissional: https://studio.youtube.com/video/qxbICjScuJU/edit
1. Introdução: https://studio.youtube.com/video/FC3qJQPEYmE/edit
Maquiagem 3 - Tipos de Rostos e Olhos: https://studio.youtube.com/video/beUbO8k1bwI/edit
Maquiagem 2 - História da Maquiagem: https://studio.youtube.com/video/2eT7AfjJOU0/edit
Maquiagem 1 - Introdução: https://studio.youtube.com/video/glxPU_VRoPE/edit
9. Biossegurança Manicure: https://studio.youtube.com/video/zEP-TxjL3O4/edit
8 Fases do Atendimento - Maquiagem 3.0: https://studio.youtube.com/video/SV6wEBSSklw/edit
Tutorial de Estudo Parte 2: https://studio.youtube.com/video/pVkn6TxyZrU/edit
Tutorial de Estudo Parte 1: https://studio.youtube.com/video/0AsDYeK7Hhw/edit
Introdução - Desperta Beleza Mulher: https://studio.youtube.com/video/Hg4sitDv0No/edit
Aula Técnica - Parte 2: https://studio.youtube.com/video/qOwWs0DAQ_o/edit
Aula Técnica - Parte 1: https://studio.youtube.com/video/bOt4tT7JY6Y/edit
2. Atendimento, conceito inova - O que você quer ser.: https://studio.youtube.com/video/fWWN_zGDXuY/edit
1. Introdução- Atendimento para Recepcionistas.: https://studio.youtube.com/video/bEYpUd4UDsQ/edit
4. O que é vender.: https://studio.youtube.com/video/gVb5D4-UZ2k/edit
3. O que é atender para você - Qual a melhor profissão do mundo.: https://studio.youtube.com/video/lAmrONvmoqk/edit
17. Conclusão.: https://studio.youtube.com/video/S7Bv4ady5I8/edit
16. indentificação e relacionamento com os clientes 2.: https://studio.youtube.com/video/DPUFcmw65RE/edit
Assistente 6 - Tipos de Tratamento parte 2: https://studio.youtube.com/video/PGn5WAQJFgo/edit
15 Identificação e relacionamento com os clientes: https://studio.youtube.com/video/BJAc5pcxro4/edit
Assistente 7 - Escovação & Finalização: https://studio.youtube.com/video/Rj-L4_8DRpg/edit
Assistente 6 - Tipos de Tratamento parte 3: https://studio.youtube.com/video/50NMTl9W6Hw/edit
14. Procedimento operacional padrão (POP, detalhado).: https://studio.youtube.com/video/bPnK5y2kyxo/edit
13. 3 types of atendimento - 8 fases do atendimento.: https://studio.youtube.com/video/JRbzaFvx304/edit
12. POP - Procedimento operacional padrão.: https://studio.youtube.com/video/776XoBg-BRg/edit
11. Análise de perfil comportamental.: https://studio.youtube.com/video/0R3T8JP08Y4/edit
10. Elementos essenciais para o atendimento.: https://studio.youtube.com/video/2UcXa_tSENw/edit
9. Pre-requesito do atendimento.: https://studio.youtube.com/video/4dIhJ20o6a4/edit
8. As 3 necessidades do ser humano.: https://studio.youtube.com/video/g953jkfGMZA/edit
7. O grande desafio.: https://studio.youtube.com/video/aXBojprC8FA/edit
6. Fases da profissão.: https://studio.youtube.com/video/m4QoUSuqti0/edit
5. Vendas (confiança, credibilidade).: https://studio.youtube.com/video/wDsyxtsy7HE/edit
Assistente 5 - Higienização Capilar: https://studio.youtube.com/video/RoqvM9tXdBI/edit
Assistente 4 - Instrumental de Trabalho: https://studio.youtube.com/video/kDRXU1gO-hA/edit
Assistente 6 - Tipos de Tratamento parte 1: https://studio.youtube.com/video/DxE15Pc8AzQ/edit
4 - Conduta Profissional: https://studio.youtube.com/video/58pGzPOzfOA/edit
10 - Biossegurança - Assistente de Cabeleireiro: https://studio.youtube.com/video/FUM6Yz7MIUg/edit
9 - Responsabilidades da Assistente de Cabeleireiro: https://studio.youtube.com/video/BWCujU-pdKk/edit
8 - Fazes do Atendimento: https://studio.youtube.com/video/IWPCheMG4ns/edit
7 - Atendimento & Fidelização todas: https://studio.youtube.com/video/O8gaM4gKtHc/edit
6 - Vendas: https://studio.youtube.com/video/V6SuPZ35mjU/edit
5 - Código de Vestimenta: https://studio.youtube.com/video/ITo9CFYeoTE/edit
3. Profissional 3.0: https://studio.youtube.com/video/rJvoTTCstIw/edit
Assistente 3 - Funções Técnicas: https://studio.youtube.com/video/2hEt5nD-qkI/edit
Assistente 2 - Responsabilidades da Assistente 3.0: https://studio.youtube.com/video/_DVeN5tzKoo/edit
Assistente 1 - Aula Técnica: https://studio.youtube.com/video/hbQkeGhTLII/edit
Aula Técnica - Parte 4: https://studio.youtube.com/video/q_w_gpUMng4/edit
2 - Postura Profissional todas: https://studio.youtube.com/video/TPEbfnID6gA/edit
Aula Técnica - Parte 3: https://studio.youtube.com/video/YBQkMBu30dI/edit
Aula Técnica Parte 2: https://studio.youtube.com/video/Y0ouTJ7AuvY/edit
1 - Introdução: https://studio.youtube.com/video/ZNID7Ttn1as/edit
Assistentes - Introdução: https://studio.youtube.com/video/6LGYMK3IVAI/edit
"""
    
    try:
        max_videos = int(input("Número de vídeos para processar (padrão 20): ") or "20")
    except:
        max_videos = 20
    
    try:
        transcriber = YouTubeCompleteListTranscriber()
        videos = transcriber.process_all_videos(video_list_text, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Cancelado.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()

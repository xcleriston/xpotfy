#!/usr/bin/env python3
"""
Script para gerar PDF profissional da proposta comercial
"""

import os
import sys
from weasyprint import HTML, CSS
from datetime import datetime

def gerar_pdf_proposta():
    """Gera PDF da proposta comercial com design moderno"""
    
    # Caminho do arquivo HTML
    html_path = "proposta-estudio33.html"
    pdf_path = f"PROPOSTA_ESTUDIO33_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    try:
        # Verificar se o arquivo HTML existe
        if not os.path.exists(html_path):
            print(f"❌ Erro: Arquivo {html_path} não encontrado!")
            return False
        
        print("🔄 Gerando PDF da proposta comercial...")
        
        # Ler conteúdo HTML
        with open(html_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        
        # CSS adicional para PDF
        css_content = """
        @page {
            size: A4;
            margin: 2cm;
            @bottom-center {
                content: "Estúdio 33 - Proposta Comercial - Página " counter(page) " de " counter(pages);
                font-size: 10px;
                color: #666;
            }
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .header {
            page-break-after: always;
        }
        
        .content {
            page-break-inside: avoid;
        }
        
        .pricing {
            page-break-inside: avoid;
        }
        
        .table {
            page-break-inside: avoid;
        }
        
        .timeline {
            page-break-inside: avoid;
        }
        
        .contact {
            page-break-after: always;
        }
        """
        
        # Gerar PDF
        html_doc = HTML(string=html_content)
        css_doc = CSS(string=css_content)
        
        html_doc.write_pdf(
            pdf_path,
            stylesheets=[css_doc],
            optimize_size=True
        )
        
        print(f"✅ PDF gerado com sucesso: {pdf_path}")
        print(f"📄 Tamanho do arquivo: {os.path.getsize(pdf_path) / 1024:.1f} KB")
        
        return True
        
    except ImportError:
        print("❌ Erro: Biblioteca 'weasyprint' não instalada!")
        print("📦 Instale com: pip install weasyprint")
        return False
        
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {str(e)}")
        return False

def gerar_pdf_alternativo():
    """Método alternativo para gerar PDF usando wkhtmltopdf"""
    
    html_path = "proposta-estudio33.html"
    pdf_path = f"PROPOSTA_ESTUDIO33_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    try:
        import subprocess
        
        print("🔄 Gerando PDF com método alternativo...")
        
        # Comando para gerar PDF
        cmd = [
            'wkhtmltopdf',
            '--page-size', 'A4',
            '--margin-top', '2cm',
            '--margin-right', '2cm',
            '--margin-bottom', '2cm',
            '--margin-left', '2cm',
            '--encoding', 'UTF-8',
            '--no-stop-slow-scripts',
            '--enable-local-file-access',
            html_path,
            pdf_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ PDF gerado com sucesso: {pdf_path}")
            return True
        else:
            print(f"❌ Erro: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Erro: 'wkhtmltopdf' não encontrado!")
        print("📦 Instale com: sudo apt-get install wkhtmltopdf (Linux) ou baixe do site oficial")
        return False
        
    except Exception as e:
        print(f"❌ Erro ao gerar PDF: {str(e)}")
        return False

def main():
    """Função principal"""
    print("🎨 GERADOR DE PDF - PROPOSTA ESTÚDIO 33")
    print("=" * 50)
    
    # Tentar gerar PDF com weasyprint
    if not gerar_pdf_proposta():
        print("\n🔄 Tentando método alternativo...")
        gerar_pdf_alternativo()
    
    print("\n📋 Próximos passos:")
    print("1. Abra o PDF gerado")
    print("2. Verifique o layout e conteúdo")
    print("3. Envie para o cliente")
    print("4. Aguarde aprovação")

if __name__ == "__main__":
    main()

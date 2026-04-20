import sys
from datetime import datetime, timedelta
from pathlib import Path

# Adiciona o diretório src ao path para que possamos importar os módulos
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session

from src.db.base import SessionLocal, engine, Base
from src.models.models import (
    User, Account, Strategy, Event, Market, Runner, RunnerOdds, Bet
)

def create_test_data(db: Session):
    """Cria dados de teste para o banco de dados."""
    # Limpar todas as tabelas (cuidado em produção!)
    print("Limpando tabelas existentes...")
    db.query(Bet).delete()
    db.query(RunnerOdds).delete()
    db.query(Runner).delete()
    db.query(Market).delete()
    db.query(Event).delete()
    db.query(Strategy).delete()
    db.query(Account).delete()
    db.query(User).delete()
    
    # Criar usuário de teste
    print("Criando usuário de teste...")
    test_user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password_here",  # Em produção, use hashes seguras como bcrypt
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Criar conta de aposta
    print("Criando conta de aposta...")
    test_account = Account(
        user_id=test_user.id,
        account_name="Minha Conta Betfair",
        account_type="betfair",
        username="betfair_username",
        password="betfair_password",
        is_active=True
    )
    db.add(test_account)
    db.commit()
    db.refresh(test_account)
    
    # Criar estratégia
    print("Criando estratégia de teste...")
    test_strategy = Strategy(
        name="Estratégia Inicial",
        description="Estratégia de teste para desenvolvimento",
        config={"stake": 10, "odds_min": 2.0, "odds_max": 5.0},
        is_active=True,
        user_id=test_user.id,
        account_id=test_account.id
    )
    db.add(test_strategy)
    db.commit()
    db.refresh(test_strategy)
    
    # Criar evento de corrida
    print("Criando evento de corrida...")
    race_event = Event(
        id="12345",
        name="Corrida de Cavalos - Hipódromo do Cristal",
        country_code="BR",
        timezone="America/Sao_Paulo",
        venue="Hipódromo do Cristal",
        open_date=datetime.utcnow() + timedelta(days=1),
        event_type_id="7",  # ID para corridas de cavalo na Betfair
        market_count=1,
        status="OPEN"
    )
    db.add(race_event)
    db.commit()
    db.refresh(race_event)
    
    # Criar mercado de aposta
    print("Criando mercado de aposta...")
    market = Market(
        id="1.23456789",
        event_id=race_event.id,
        name="Vencedor da Corrida",
        market_type="WIN",
        market_time=datetime.utcnow() + timedelta(days=1, hours=2),
        total_matched=10000.0,
        status="OPEN",
        betting_type="ODDS",
        number_of_winners=1
    )
    db.add(market)
    db.commit()
    db.refresh(market)
    
    # Criar corredores
    print("Criando corredores...")
    runners_data = [
        {"name": "Cavalo Veloz", "odds": 3.5},
        {"name": "Relâmpago Negro", "odds": 4.2},
        {"name": "Pé de Pano", "odds": 5.0},
        {"name": "Foguete", "odds": 6.0},
        {"name": "Estrela Cadente", "odds": 8.0}
    ]
    
    runners = []
    for i, data in enumerate(runners_data, 1):
        runner = Runner(
            id=i,
            market_id=market.id,
            name=data["name"],
            handicap=0.0,
            sort_priority=i,
            status="ACTIVE",
            last_price_traded=data["odds"],
            total_matched=1000.0
        )
        db.add(runner)
        runners.append(runner)
    
    db.commit()
    
    # Criar odds para os corredores
    print("Criando odds para os corredores...")
    for runner in runners:
        odds = RunnerOdds(
            runner_id=runner.id,
            last_price_traded=runner.last_price_traded,
            total_matched=runner.total_matched,
            available_to_back={"prices": [[runner.last_price_traded, 100, 200]]},
            available_to_lay={"prices": [[runner.last_price_traded + 0.5, 100, 200]]}
        )
        db.add(odds)
    
    db.commit()
    
    # Criar uma aposta de teste
    print("Criando aposta de teste...")
    test_bet = Bet(
        id="BET-12345",
        user_id=test_user.id,
        account_id=test_account.id,
        strategy_id=test_strategy.id,
        market_id=market.id,
        runner_id=runners[0].id,
        bet_type="BACK",
        status="EXECUTION_COMPLETE",
        price=runners[0].last_price_traded,
        size=10.0,  # R$ 10,00
        bsp_liability=None,
        placed_date=datetime.utcnow(),
        matched_date=datetime.utcnow(),
        side="BACK",
        persistence_type="LAPSE",
        order_type="LIMIT"
    )
    db.add(test_bet)
    db.commit()
    
    print("\nDados de teste criados com sucesso!")
    print(f"- Usuário: {test_user.username} (ID: {test_user.id})")
    print(f"- Conta: {test_account.account_name} (ID: {test_account.id})")
    print(f"- Estratégia: {test_strategy.name} (ID: {test_strategy.id})")
    print(f"- Evento: {race_event.name} (ID: {race_event.id})")
    print(f"- Mercado: {market.name} (ID: {market.id})")
    print(f"- Corredores: {', '.join([r.name for r in runners])}")
    print(f"- Aposta de teste: R$ {test_bet.size} no {runners[0].name} a {test_bet.price}")

def main():
    """Função principal para popular o banco de dados com dados de teste."""
    db = SessionLocal()
    try:
        create_test_data(db)
    except Exception as e:
        print(f"Erro ao popular o banco de dados: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Iniciando a população do banco de dados com dados de teste...")
    main()

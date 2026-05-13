from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ¡OJO AQUÍ! 
# Cambia 'root' y 'tu_contraseña' por tu usuario y contraseña de MySQL.
# Si usas XAMPP por defecto, el usuario es 'root' y la contraseña va vacía: "mysql+pymysql://root:@localhost:3306/pata_data_db"
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/pata_data_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
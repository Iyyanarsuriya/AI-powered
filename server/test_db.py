from sqlalchemy import text

from app.database.connection import engine


try:

    with engine.connect() as connection:

        result = connection.execute(
            text("SELECT 1")
        )

        print("Database connection successful!")

        print(
            "Database response:",
            result.scalar()
        )


except Exception as error:

    print("Database connection failed!")

    print(error)
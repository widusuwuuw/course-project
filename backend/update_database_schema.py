#!/usr/bin/env python3
"""
Database schema update script - Add missing fields to lab_reports table
"""

import sqlite3
import os

def update_database_schema():
    """Update database schema, add missing fields"""

    # Database file path
    db_path = "dev.db"

    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        return False

    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables in database: {[table[0] for table in tables]}")

        # Check existing columns
        try:
            cursor.execute("PRAGMA table_info(lab_reports)")
            existing_columns = [row[1] for row in cursor.fetchall()]
            print(f"Existing columns: {existing_columns}")
        except sqlite3.Error as e:
            print(f"lab_reports table doesn't exist yet: {e}")
            existing_columns = []

        # Columns to add
        new_columns = {
            'recommendations': 'TEXT',
            'category': "VARCHAR(50) DEFAULT 'comprehensive'",
            'ai_body_report': 'TEXT'
        }

        # Add missing columns
        for column_name, column_type in new_columns.items():
            if column_name not in existing_columns:
                try:
                    alter_sql = f"ALTER TABLE lab_reports ADD COLUMN {column_name} {column_type}"
                    cursor.execute(alter_sql)
                    print(f"Successfully added column: {column_name}")
                except sqlite3.Error as e:
                    print(f"Failed to add column {column_name}: {e}")
            else:
                print(f"Column {column_name} already exists, skipping")

        # Commit changes
        conn.commit()

        # Verify update
        cursor.execute("PRAGMA table_info(lab_reports)")
        updated_columns = [row[1] for row in cursor.fetchall()]
        print(f"Updated columns: {updated_columns}")

        conn.close()
        print("Database schema update completed successfully")
        return True

    except Exception as e:
        print(f"Database schema update failed: {e}")
        return False

if __name__ == "__main__":
    print("Starting database schema update...")
    update_database_schema()
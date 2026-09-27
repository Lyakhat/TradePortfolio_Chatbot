import re
import pandas as pd
import io

def clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sanitize DataFrame column names to be SQLite and SQL-safe.
    Removes spaces, hyphens, slashes, parentheses, and consecutive underscores.
    """
    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.replace(" ", "_", regex=False)
        .str.replace("-", "_", regex=False)
        .str.replace("/", "_", regex=False)
        .str.replace("(", "", regex=False)
        .str.replace(")", "", regex=False)
        .str.replace("[", "", regex=False)
        .str.replace("]", "", regex=False)
        .str.replace(".", "_", regex=False)
        .str.replace("__", "_", regex=False)
    )
    # Remove any non-alphanumeric characters except underscore
    df.columns = [re.sub(r'[^a-zA-Z0-9_]', '', col) for col in df.columns]
    # Ensure column doesn't start with a number
    df.columns = [f"col_{col}" if col and col[0].isdigit() else (col or "unnamed_col") for col in df.columns]
    return df

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sanitizes column names and removes unpopulated or corrupted dummy columns
    (such as columns with 100% '00:00.0', empty strings, or nulls).
    """
    df = clean_columns(df)
    
    cols_to_drop = []
    for col in df.columns:
        if df[col].isna().all():
            cols_to_drop.append(col)
            continue
        series = df[col].astype(str).str.strip()
        unique_vals = set(series.unique()) - {'', 'nan', 'None', 'null', '00:00.0', '00:00', '00:00:00', '0.0', 'NaN'}
        if len(unique_vals) == 0:
            cols_to_drop.append(col)
            
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        
    return df

def parse_and_clean_csv(file_content: bytes, filename: str) -> pd.DataFrame:
    """
    Reads a CSV binary payload, converts to DataFrame, sanitizes headers, and removes dummy columns.
    """
    # Attempt standard UTF-8 parsing with fallback encodings
    try:
        df = pd.read_csv(io.BytesIO(file_content), encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(file_content), encoding="latin1")
    
    return clean_dataframe(df)

def sanitize_table_name(filename: str) -> str:
    """
    Derives a valid SQL table name from a file name (e.g. 'holdings.csv' -> 'holdings').
    """
    base_name = re.sub(r'\.[^.]+$', '', filename).strip()
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', base_name).lower()
    clean_name = re.sub(r'_+', '_', clean_name).strip('_')
    if not clean_name:
        clean_name = "uploaded_table"
    if clean_name[0].isdigit():
        clean_name = f"tbl_{clean_name}"
    return clean_name

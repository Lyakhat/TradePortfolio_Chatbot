import pandas as pd

def format_query_result(df: pd.DataFrame) -> str:
    """
    Formats query results into clean Markdown responses, replicating trade_portfolio.ipynb format.
    """
    if df.empty:
        return "No results found for the given criteria."

    # Single scalar output (e.g., COUNT(*), SUM(...))
    if df.shape == (1, 1):
        val = df.iloc[0, 0]
        if pd.isna(val):
            return "**None**"
        if isinstance(val, (int, float)):
            return f"**{val:,.4f}**".rstrip('0').rstrip('.') if isinstance(val, float) else f"**{val:,}**"
        return f"**{val}**"

    # Up to 10 rows
    if len(df) <= 10:
        return f"**Answer:**\n```\n{df.to_string(index=False)}\n```"

    # More than 10 rows -> Show Top 10
    return f"**Top 10 of {len(df)} results:**\n```\n{df.head(10).to_string(index=False)}\n```"

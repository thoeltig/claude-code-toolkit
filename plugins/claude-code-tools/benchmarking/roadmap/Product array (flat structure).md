# Product array (flat structure)
- Read CSV 100 · 31.7k tokens · 13s · 37692 characters · 1 header row with 22 columns x 150 data rows => 3,300 data cells
    - ".\benchmarking\data\csv_100.csv"
- Read JSON Compact 100 · 41.5k tokens · 11s · 80812 characters · 149 items in array with 22 fields (empty ommited = 19-22 fields => 2,831-3,278 fields)
    - ".\benchmarking\data\json_100_compact.json"
- Read JSON Pretty 100 · 49.6k tokens · 13s · 71628 characters · 100 items in array with 22 fields (empty ommited = 19-22 fields => 1,900-2,000 fields)
    - ".\benchmarking\data\json_100_pretty.json"

# read-Efficient slash command
- Read CSV 100 to minified JSON · 41.7k tokens · 12s · 84099 characters · 150 items in array with 22 fields (empty ommited = 19-22 fields => 2,850-3,300 fields)
    - ".\benchmarking\data\csv_100.compact.json"